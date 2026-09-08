import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type { DeviceIdentity } from '../interfaces/usage.interface';

/** Cookie name for the device ID. */
const DEVICE_COOKIE = 'rp_did';

/** Cookie max age: 1 year in milliseconds. */
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * DeviceIdentityService — extracts/creates device identity from HTTP requests.
 *
 * Per auth-and-tiers.md lines 7–9:
 * 1. Signed HTTP-only cookie with a random device ID (primary signal)
 * 2. Coarse fingerprint = SHA-256(IP + User-Agent) as secondary signal
 *
 * The cookie survives normal browsing. The fingerprint catches
 * cookie-clearers at the cost of false positives on shared IPs
 * (deliberately generous per doc line 12).
 */
@Injectable()
export class DeviceIdentityService {
  private readonly logger = new Logger(DeviceIdentityService.name);
  private readonly cookieSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cookieSecret = this.configService.get<string>('COOKIE_SECRET') || 'dev-cookie-secret';
  }

  /**
   * Extracts device identity from the request.
   * Creates and sets the cookie if it doesn't exist yet.
   */
  extractIdentity(req: Request, res: Response): DeviceIdentity {
    // 1. Read or create device ID cookie
    let deviceId = req.signedCookies?.[DEVICE_COOKIE] as string | undefined;

    if (!deviceId) {
      deviceId = randomUUID();
      res.cookie(DEVICE_COOKIE, deviceId, {
        signed: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
      });
      this.logger.debug(`New device cookie set: ${deviceId.slice(0, 8)}…`);
    }

    // 2. Compute coarse fingerprint
    const ip = this.extractIp(req);
    const ua = req.headers['user-agent'] || 'unknown';
    const fingerprintHash = createHash('sha256')
      .update(`${ip}|${ua}`)
      .digest('hex');

    return { deviceId, fingerprintHash };
  }

  /**
   * Extracts the client IP, handling common proxy headers.
   */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
