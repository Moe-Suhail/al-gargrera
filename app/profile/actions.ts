"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireActionContext } from "@/lib/action-context";
import { sendEmailNotification } from "@/lib/email/send-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadProfileImage } from "@/lib/storage";

const currencySchema = z.enum(["EGP", "USD", "SAR", "AED", "EUR", "GBP"]);

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export async function updateProfileAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const displayName = cleanText(formData.get("display_name"));
  const phone = cleanText(formData.get("phone")) || null;
  const country = cleanText(formData.get("country")) || null;
  const city = cleanText(formData.get("city")) || null;
  const residenceInput = cleanText(formData.get("current_residence_label"));
  const currentResidenceLabel =
    residenceInput || [city, country].filter(Boolean).join("، ") || null;
  const defaultCurrency = currencySchema
    .catch("EGP")
    .parse(cleanText(formData.get("default_currency")) || "EGP");
  const timezone = cleanText(formData.get("timezone")) || null;
  let profileImageUrl = cleanText(formData.get("profile_image_url")) || null;
  const profileImage = formData.get("profile_image");

  if (!displayName) {
    redirect("/profile?error=required");
  }

  if (profileImage instanceof File && profileImage.size > 0) {
    try {
      const adminSupabase = createSupabaseAdminClient() ?? supabase;
      profileImageUrl = await uploadProfileImage({
        supabase: adminSupabase,
        file: profileImage,
        profileId: context.profile.id
      });
    } catch (error) {
      console.error("Profile image upload failed", error);
      redirect("/profile?error=image");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      phone,
      country,
      city,
      current_residence_label: currentResidenceLabel,
      default_currency: defaultCurrency,
      timezone,
      profile_image_url: profileImageUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", context.profile.id)
    .eq("auth_user_id", context.user.id);

  if (error) {
    redirect("/profile?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "profile",
    entityId: context.profile.id,
    action: "حدّث الملف الشخصي",
    oldValue: {
      display_name: context.profile.display_name,
      country: context.profile.country,
      city: context.profile.city,
      default_currency: context.profile.default_currency
    },
    newValue: {
      display_name: displayName,
      country,
      city,
      default_currency: defaultCurrency
    },
    performedBy: context.profile.id
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/settings");
  redirect("/profile?success=profile");
}

export async function changePasswordAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const password = cleanText(formData.get("new_password"));
  const confirmPassword = cleanText(formData.get("confirm_password"));

  if (password !== confirmPassword) {
    redirect("/profile?error=password-match");
  }

  if (!isStrongPassword(password)) {
    redirect("/profile?error=password-weak");
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirect("/profile?error=password");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "profile",
    entityId: context.profile.id,
    action: "تم تغيير كلمة المرور",
    oldValue: null,
    newValue: null,
    performedBy: context.profile.id
  });

  await sendEmailNotification(
    "password_changed",
    "profile",
    context.profile.id,
    context.profile.id
  );

  revalidatePath("/activity");
  redirect("/profile?success=password");
}
