import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  Logger,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { OtpService } from './services/otp.service';
import { AuthService } from './services/auth.service';
import { DeviceIdentityService } from '../usage/services/device-identity.service';
import { UsageService } from '../usage/services/usage.service';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import type { AuthPayload, User, CheckHistoryEntry } from './interfaces/auth.interface';
import type { UsageStatus } from '../usage/interfaces/usage.interface';

/** Simple email regex — not exhaustive, just basic validation. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly deviceIdentity: DeviceIdentityService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * POST /auth/send-otp
   * Sends a 6-digit OTP to the given email address.
   */
  @Post('send-otp')
  @HttpCode(200)
  async sendOtp(
    @Body('email') email?: string,
  ): Promise<{ sent: boolean; message: string }> {
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    const sent = await this.otpService.sendOtp(email);
    if (!sent) {
      return {
        sent: false,
        message: 'Too many OTP requests. Please wait a few minutes and try again.',
      };
    }

    return { sent: true, message: 'OTP sent to your email.' };
  }

  /**
   * POST /auth/verify-otp
   * Verifies the OTP and returns a JWT + user record.
   * Also migrates anonymous check history to the new/existing account.
   */
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Body('email') email: string | undefined,
    @Body('code') code: string | undefined,
    @Req() req: Request,
  ): Promise<{ token: string; user: User }> {
    if (!email || !code) {
      throw new BadRequestException('Email and OTP code are required.');
    }

    const valid = this.otpService.verifyOtp(email, code);
    if (!valid) {
      throw new UnauthorizedException(
        'Invalid or expired OTP. Please request a new one.',
      );
    }

    // Extract device ID for history migration
    // Note: response cookie setting is not needed here since we only read
    const device = this.deviceIdentity.extractIdentity(
      req,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.res as any,
    );

    // Login or create user + migrate anonymous history
    const user = this.authService.loginOrCreate(email, device.deviceId);

    // Issue JWT
    const payload: AuthPayload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    this.logger.log(`User authenticated: ${user.email}`);

    return { token, user };
  }

  /**
   * GET /auth/me
   * Returns the current user's profile and usage status.
   * Requires a valid JWT.
   */
  @Get('me')
  @UseGuards(OptionalAuthGuard)
  getMe(
    @Req() req: Request & { user?: AuthPayload },
  ): { user: User; usageStatus: UsageStatus } | null {
    if (!req.user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const user = this.authService.findById(req.user.sub);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Extract device for usage status
    const device = this.deviceIdentity.extractIdentity(
      req,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.res as any,
    );
    const usageStatus = this.usageService.checkAvailability(device, user.id);

    return { user, usageStatus };
  }

  /**
   * GET /auth/history
   * Returns the last 20 check results for the authenticated user.
   */
  @Get('history')
  @UseGuards(OptionalAuthGuard)
  getHistory(
    @Req() req: Request & { user?: AuthPayload },
  ): { history: CheckHistoryEntry[] } {
    if (!req.user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const history = this.authService.getHistory(req.user.sub);
    return { history };
  }
}
