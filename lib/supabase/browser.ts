"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createBrowserClient(config.url, config.anonKey);
}
