import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGuestSession = {
  token: 'fake-token',
  user_id: 'u1',
  username: 'guest',
  created_at: 0,
  expires_at: 9999999999,
  vars: {},
  isexpired: () => false,
};
const mockEmailSession = {
  token: 'email-token',
  user_id: 'u2',
  username: 'test',
  created_at: 0,
  expires_at: 9999999999,
  vars: {},
  isexpired: () => false,
};
const mockRestoredSession = {
  token: 'restored-token',
  user_id: 'u1',
  username: 'guest',
  created_at: 0,
  expires_at: 9999999999,
  vars: {},
  isexpired: () => false,
};

vi.mock('@heroiclabs/nakama-js', () => ({
  Client: vi.fn().mockImplementation((_key, _host, _port, _ssl) => ({
    useSSL: _ssl ?? false,
    authenticateCustom: vi.fn().mockResolvedValue(mockGuestSession),
    authenticateEmail: vi.fn().mockResolvedValue(mockEmailSession),
  })),
  Session: { restore: vi.fn().mockReturnValue(mockRestoredSession) },
}));

describe('nakama client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('authenticates as guest', async () => {
    const { authenticateGuest } = await import('../src/net/nakama');
    const s = await authenticateGuest();
    expect(s.token).toBe('fake-token');
  });

  it('authenticates with email', async () => {
    const { authenticateEmail } = await import('../src/net/nakama');
    const s = await authenticateEmail('test@test.com', 'password');
    expect(s.token).toBe('email-token');
  });

  it('reconnects with existing token', async () => {
    const { reconnectSession } = await import('../src/net/nakama');
    const s = await reconnectSession('old-token');
    expect(s?.token).toBe('restored-token');
  });
});
