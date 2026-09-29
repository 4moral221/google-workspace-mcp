import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase URL or Service Role Key missing in environment.');
    }
    supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return supabaseClient;
}

export async function getActiveGoogleToken(accountEmail = null) {
  const supabase = getSupabase();
  let query = supabase.from('google_tokens').select('*');

  if (accountEmail) {
    query = query.eq('account_email', accountEmail);
  } else {
    query = query.order('updated_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    throw new Error(`Failed to retrieve Google token: ${error?.message || 'No token found'}`);
  }
  return data;
}

export async function logCall({ toolName, args, response, status, errorMessage, executionTimeMs }) {
  try {
    const supabase = getSupabase();
    await supabase.from('mcp_call_log').insert({
      tool_name: toolName,
      arguments: args || {},
      response: response || {},
      status,
      error_message: errorMessage || null,
      execution_time_ms: executionTimeMs,
    });
  } catch (err) {
    console.error('[Supabase Audit Log Error]:', err.message);
  }
}
