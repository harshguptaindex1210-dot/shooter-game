import { Client, Session } from '@heroiclabs/nakama-js';

let client: Client | null = null;
let session: Session | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client('defaultkey', '127.0.0.1', '7350', false);
  }
  return client;
}

export async function authenticateGuest(): Promise<Session> {
  const c = getClient();
  const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
  session = await c.authenticateCustom(id);
  return session;
}

export async function authenticateEmail(email: string, password: string): Promise<Session> {
  const c = getClient();
  session = await c.authenticateEmail(email, password);
  return session;
}

export async function reconnectSession(token: string): Promise<Session | null> {
  try {
    session = Session.restore(token);
    return session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (session && session.isexpired(Date.now() / 1000)) {
    session = null;
  }
  return session;
}
