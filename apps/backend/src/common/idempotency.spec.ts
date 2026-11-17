import { BadRequestException } from '@nestjs/common';
import { hashRequest, requireIdempotencyKey } from './idempotency';

const REQUIRED_MESSAGE = 'Idempotency-Key header is required';
const FORMAT_MESSAGE = 'Idempotency-Key must be 8-128 characters of [A-Za-z0-9_-]';

describe('requireIdempotencyKey', () => {
  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
  ])('throws the required message for %s', (_label, value) => {
    expect(() => requireIdempotencyKey(value)).toThrow(BadRequestException);
    expect(() => requireIdempotencyKey(value)).toThrow(REQUIRED_MESSAGE);
  });

  it.each([
    ['shorter than 8 characters', 'a'.repeat(7)],
    ['longer than 128 characters', 'a'.repeat(129)],
    ['containing whitespace', 'abcd efgh'],
    ['containing an invalid symbol', 'abcdefg@h'],
  ])('throws the format message for a key %s', (_label, value) => {
    expect(() => requireIdempotencyKey(value)).toThrow(BadRequestException);
    expect(() => requireIdempotencyKey(value)).toThrow(FORMAT_MESSAGE);
  });

  it('accepts a key of exactly 8 characters', () => {
    const key = 'a'.repeat(8);
    expect(requireIdempotencyKey(key)).toBe(key);
  });

  it('accepts a key of exactly 128 characters', () => {
    const key = 'a'.repeat(128);
    expect(requireIdempotencyKey(key)).toBe(key);
  });

  it('accepts letters, digits, underscore and hyphen', () => {
    const key = 'AZaz09_-AZaz09_-';
    expect(requireIdempotencyKey(key)).toBe(key);
  });
});

describe('hashRequest', () => {
  it('returns the same hash for the same payload', () => {
    expect(hashRequest({ orderId: 'o1', method: 'WALLET' })).toBe(hashRequest({ orderId: 'o1', method: 'WALLET' }));
  });

  it('returns different hashes for different payloads', () => {
    expect(hashRequest({ orderId: 'o1', method: 'WALLET' })).not.toBe(hashRequest({ orderId: 'o2', method: 'WALLET' }));
  });

  it('returns a 64-character lowercase hex string', () => {
    expect(hashRequest({ orderId: 'o1' })).toMatch(/^[0-9a-f]{64}$/);
  });
});
