import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AccountMember,
  AccountSpace,
  AppContext,
  Profile
} from "@/lib/types";

type AnySupabase = SupabaseClient<any, "public", any>;

function fallbackDisplayName(email?: string | null) {
  return email?.split("@")[0]?.replace(/[._-]+/g, " ") || "مستخدم";
}

async function ensureProfile(
  supabase: AnySupabase,
  userId: string,
  email?: string | null
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing as Profile;
  }

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: userId,
      display_name: fallbackDisplayName(email),
      email: email ?? "",
      default_currency: "EGP"
    })
    .select("*")
    .single();

  if (error) {
    console.error("Unable to create profile", error.message);
    return null;
  }

  return created as Profile;
}

export async function getCurrentContext(): Promise<AppContext> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      user: null,
      profile: null,
      accountSpace: null,
      members: []
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isConfigured: true,
      user: null,
      profile: null,
      accountSpace: null,
      members: []
    };
  }

  const profile = await ensureProfile(supabase, user.id, user.email);

  if (!profile) {
    return {
      isConfigured: true,
      user,
      profile: null,
      accountSpace: null,
      members: []
    };
  }

  const { data: memberships } = await supabase
    .from("account_members")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  const firstMembership = memberships?.[0] as
    | { account_space_id: string }
    | undefined;

  if (!firstMembership) {
    return {
      isConfigured: true,
      user,
      profile,
      accountSpace: null,
      members: []
    };
  }

  const { data: accountSpace } = await supabase
    .from("account_spaces")
    .select("*")
    .eq("id", firstMembership.account_space_id)
    .maybeSingle();

  const { data: memberRows } = await supabase
    .from("account_members")
    .select("*")
    .eq("account_space_id", firstMembership.account_space_id)
    .order("created_at", { ascending: true });

  const profileIds = (memberRows ?? []).map((member) => member.user_id);
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("*").in("id", profileIds)
    : { data: [] };

  const profilesById = new Map(
    (profiles ?? []).map((item) => [item.id, item as Profile])
  );

  const members = (memberRows ?? []).map((member) => ({
    ...(member as Omit<AccountMember, "profile">),
    profile:
      profilesById.get(member.user_id) ??
      ({
        id: member.user_id,
        auth_user_id: "",
        display_name: "مستخدم",
        email: "",
        phone: null,
        country: null,
        city: null,
        current_residence_label: null,
        default_currency: "EGP",
        timezone: null,
        profile_image_url: null,
        receive_email_notifications: true,
        notify_on_transaction_created: true,
        notify_on_transaction_confirmed: true,
        notify_on_transaction_completed: true,
        notify_on_repayment: true,
        notify_on_pending_reminder: true,
        created_at: member.created_at,
        updated_at: member.created_at
      } satisfies Profile)
  })) as AccountMember[];

  return {
    isConfigured: true,
    user,
    profile,
    accountSpace: accountSpace as AccountSpace | null,
    members
  };
}

export function getOtherMember(context: AppContext) {
  return (
    context.members.find((member) => member.user_id !== context.profile?.id) ??
    null
  );
}
