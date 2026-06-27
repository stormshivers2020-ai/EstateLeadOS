import { createClient } from "@/lib/supabase/client";
import { isSupabaseMode } from "@/lib/config/runtime";
import { assertSupabaseConfigured } from "@/lib/supabase/env";

const BUCKET = "documents";

export async function uploadDocumentPlaceholder(file: File, meta: { leadId: string; organizationId: string }) {
  if (!isSupabaseMode()) {
    const objectUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : null;
    return {
      id: `upload-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      objectUrl,
      leadId: meta.leadId,
      organizationId: meta.organizationId,
      status: "uploaded" as const,
      warning: "Local Preview Mode stores upload metadata for testing. Connect Supabase Storage for production document storage.",
    };
  }

  assertSupabaseConfigured();
  const supabase = createClient();
  const path = `${meta.organizationId}/${meta.leadId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.path, 60 * 60);

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Could not create signed URL: ${signError?.message ?? "unknown"}`);
  }

  return {
    id: data.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    objectUrl: signedData.signedUrl,
    leadId: meta.leadId,
    organizationId: meta.organizationId,
    status: "uploaded" as const,
    warning: "Document stored in Supabase Storage. Professional review may be required before use.",
  };
}
