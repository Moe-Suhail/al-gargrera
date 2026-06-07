import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment } from "@/lib/types";

const BUCKET = "transaction-attachments";
type AnySupabase = SupabaseClient<any, "public", any>;

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
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
