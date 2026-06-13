import { getClient } from './getClient.js';

export async function setOnlinePhase({ session, identity, status }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can change the online phase.');
  }

  const result = await client
    .from('online_sessions')
    .update({ status, last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}
