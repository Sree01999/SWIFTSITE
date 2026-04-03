import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "@/lib/env";

export function createServiceRoleClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseServiceEnv();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
