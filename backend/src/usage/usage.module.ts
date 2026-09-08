import { Module } from '@nestjs/common';
import { DeviceIdentityService } from './services/device-identity.service';
import { UsageService } from './services/usage.service';

@Module({
  providers: [DeviceIdentityService, UsageService],
  exports: [DeviceIdentityService, UsageService],
})
export class UsageModule {}
