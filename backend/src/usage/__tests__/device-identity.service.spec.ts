// Mock @nestjs/config to avoid ESM import error in Jest
jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn(),
}));

import { DeviceIdentityService } from '../services/device-identity.service';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

describe('DeviceIdentityService', () => {
  let service: DeviceIdentityService;

  beforeEach(() => {
    const mockConfig = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    service = new DeviceIdentityService(mockConfig);
  });

  it('uses existing signed cookie if present', () => {
    const mockReq = {
      signedCookies: { rp_did: 'existing-device-id' },
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockRes = {
      cookie: jest.fn(),
    } as unknown as Response;

    const identity = service.extractIdentity(mockReq, mockRes);
    expect(identity.deviceId).toBe('existing-device-id');
    expect(identity.fingerprintHash).toBeDefined();
    expect(mockRes.cookie).not.toHaveBeenCalled();
  });

  it('generates and sets cookie if none present', () => {
    const mockReq = {
      signedCookies: {},
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockRes = {
      cookie: jest.fn(),
    } as unknown as Response;

    const identity = service.extractIdentity(mockReq, mockRes);
    expect(identity.deviceId).toBeDefined();
    expect(identity.deviceId.length).toBeGreaterThan(10);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'rp_did',
      identity.deviceId,
      expect.objectContaining({
        signed: true,
        httpOnly: true,
      }),
    );
  });
});
