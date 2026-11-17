import { MockPaymentGateway, WALLET_LIMIT } from './mock-payment.gateway';

describe('MockPaymentGateway', () => {
  let gateway: MockPaymentGateway;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
  });

  it('declines a CARD whose number ends with 0000', async () => {
    const result = await gateway.charge({ amount: 1000, method: 'CARD', cardNumber: '4111111111110000' });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Card declined');
  });

  it('approves a CARD whose number does not end with 0000', async () => {
    const result = await gateway.charge({ amount: 1000, method: 'CARD', cardNumber: '4111111111111111' });
    expect(result.success).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('approves a CARD charge without a cardNumber', async () => {
    const result = await gateway.charge({ amount: 1000, method: 'CARD' });
    expect(result.success).toBe(true);
  });

  it('approves a WALLET charge equal to WALLET_LIMIT', async () => {
    const result = await gateway.charge({ amount: WALLET_LIMIT, method: 'WALLET' });
    expect(result.success).toBe(true);
  });

  it('declines a WALLET charge above WALLET_LIMIT', async () => {
    const result = await gateway.charge({ amount: WALLET_LIMIT + 1, method: 'WALLET' });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Wallet balance insufficient');
  });

  it('does not apply the 0000 card rule to WALLET charges', async () => {
    const result = await gateway.charge({ amount: 1000, method: 'WALLET', cardNumber: '4111111111110000' });
    expect(result.success).toBe(true);
  });

  it('returns a mock_ reference that differs between calls', async () => {
    const first = await gateway.charge({ amount: 1000, method: 'WALLET' });
    const second = await gateway.charge({ amount: 1000, method: 'WALLET' });
    expect(first.reference.startsWith('mock_')).toBe(true);
    expect(second.reference).not.toBe(first.reference);
  });
});
