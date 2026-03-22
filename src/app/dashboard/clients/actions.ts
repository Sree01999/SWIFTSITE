"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createClientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  businessType: z.string().max(120).optional().or(z.literal("")),
});

export async function createClientAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    businessType: formData.get("businessType"),
  });

  if (!parsed.success) {
    return { error: "Please provide valid client details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in again." };
  }

  const { error } = await supabase.from("clients").insert({
    owner_id: user.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    business_type: parsed.data.businessType || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  return { success: true };
}
