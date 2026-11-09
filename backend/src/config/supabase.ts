import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://mock-c-cimas.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key";

// Authoritative backend client using service-role key (NEVER sent to client)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const JWT_SECRET = process.env.JWT_SECRET || "c_cimas_enterprise_secret_jwt_key_2026_dev";

