import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { OtpService } from './services/otp.service';
import { AuthService } from './services/auth.service';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    UsageModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-jwt-secret',
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [OtpService, AuthService, OptionalAuthGuard],
  exports: [AuthService, OptionalAuthGuard, JwtModule],
})
export class AuthModule {}
