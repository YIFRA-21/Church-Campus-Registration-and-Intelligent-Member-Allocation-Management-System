import { createClient } from "@supabase/supabase-js";

// Client Supabase instance (Using PUBLIC anon key only - NEVER service_role)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mock-c-cimas.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "mock-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

