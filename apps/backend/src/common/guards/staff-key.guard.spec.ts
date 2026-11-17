import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { StaffKeyGuard } from './staff-key.guard';

const SECRET = 'staff-secret-key';

function contextWith(headers: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

describe('StaffKeyGuard', () => {
  const originalKey = process.env.STAFF_API_KEY;
  let guard: StaffKeyGuard;

  beforeEach(() => {
    guard = new StaffKeyGuard();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.STAFF_API_KEY;
    } else {
      process.env.STAFF_API_KEY = originalKey;
    }
  });

  it('throws NotFoundException when STAFF_API_KEY is not set', () => {
    delete process.env.STAFF_API_KEY;
    expect(() => guard.canActivate(contextWith({ 'x-staff-key': SECRET }))).toThrow(NotFoundException);
  });

  it('throws NotFoundException when STAFF_API_KEY is an empty string', () => {
    process.env.STAFF_API_KEY = '';
    expect(() => guard.canActivate(contextWith({ 'x-staff-key': SECRET }))).toThrow(NotFoundException);
  });

  it('returns true when x-staff-key matches STAFF_API_KEY', () => {
    process.env.STAFF_API_KEY = SECRET;
    expect(guard.canActivate(contextWith({ 'x-staff-key': SECRET }))).toBe(true);
  });

  it('throws ForbiddenException when x-staff-key is wrong', () => {
    process.env.STAFF_API_KEY = SECRET;
    expect(() => guard.canActivate(contextWith({ 'x-staff-key': 'wrong-key' }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when x-staff-key header is missing', () => {
    process.env.STAFF_API_KEY = SECRET;
    expect(() => guard.canActivate(contextWith({}))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when x-staff-key header is an array', () => {
    process.env.STAFF_API_KEY = SECRET;
    expect(() => guard.canActivate(contextWith({ 'x-staff-key': [SECRET] }))).toThrow(ForbiddenException);
  });
});
