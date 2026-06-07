import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountSpace, AppContext, Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

type RequiredAppContext = Omit<
  AppContext,
  "user" | "profile" | "accountSpace"
> & {
  user: User;
  profile: Profile;
  accountSpace: AccountSpace;
};

export async function requireActionContext() {
  const [context, supabase] = await Promise.all([
    getCurrentContext(),
    createSupabaseServerClient()
  ]);

  if (!context.isConfigured || !supabase) {
    redirect("/login?error=env");
  }

  if (!context.user || !context.profile) {
    redirect("/login");
  }

  if (!context.accountSpace) {
    redirect("/settings?error=no-account");
  }

  return {
    context: {
      ...context,
      profile: context.profile,
      user: context.user,
      accountSpace: context.accountSpace
    } as RequiredAppContext,
    supabase
  };
}

export function ensureMember(profileIds: string[], value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  return profileIds.includes(id) ? id : profileIds[0];
}
