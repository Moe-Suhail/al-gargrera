import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment } from "@/lib/types";

const BUCKET = "transaction-attachments";
const PROFILE_IMAGES_BUCKET = "profile-images";
type AnySupabase = SupabaseClient<any, "public", any>;

export function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function ensureProfileImagesBucket(supabase: AnySupabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === PROFILE_IMAGES_BUCKET);

  if (exists) {
    return;
  }

  const { error } = await supabase.storage.createBucket(PROFILE_IMAGES_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: 1024 * 1024 * 3
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function uploadProfileImage({
  supabase,
  file,
  profileId
}: {
  supabase: AnySupabase;
  file: File;
  profileId: string;
}) {
  if (!file.size) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Profile image must be an image.");
  }

  const cleanName = safeFileName(file.name) || "profile-image";
  const extension = cleanName.includes(".") ? cleanName.split(".").pop() : "jpg";
  const path = `${profileId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadTransactionAttachment({
  supabase,
  file,
  accountSpaceId,
  transactionId,
  uploadedBy
}: {
  supabase: AnySupabase;
  file: File;
  accountSpaceId: string;
  transactionId: string;
  uploadedBy: string;
}) {
  if (!file.size) {
    return null;
  }

  const cleanName = safeFileName(file.name) || "receipt";
  const path = `${accountSpaceId}/${transactionId}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      account_space_id: accountSpaceId,
      transaction_id: transactionId,
      file_url: null,
      file_path: path,
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size,
      uploaded_by: uploadedBy
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Attachment;
}

export async function withSignedAttachmentUrls(
  supabase: AnySupabase,
  attachments: Attachment[]
) {
  const signed = await Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(attachment.file_path, 60 * 30);

      return {
        ...attachment,
        signed_url: data?.signedUrl
      };
    })
  );

  return signed;
}
