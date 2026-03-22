"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PROJECT_STATUS_OPTIONS } from "@/app/dashboard/projects/constants";
import { createClient } from "@/lib/supabase/server";

const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  clientId: z.string().uuid(),
  techStack: z.string().max(120).optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  deployHookUrl: z.string().url().optional().or(z.literal("")),
});

const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(PROJECT_STATUS_OPTIONS),
  techStack: z.string().max(120).optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  deployHookUrl: z.string().url().optional().or(z.literal("")),
  vercelProjectId: z.string().max(120).optional().or(z.literal("")),
});

const deleteProjectSchema = z.object({
  projectId: z.string().uuid(),
});

function createProjectSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  const suffix = Date.now().toString(36).slice(-6);
  return `${base || "project"}-${suffix}`;
}

type ActionState = { error?: string; success?: boolean } | null;

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
) {
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    techStack: formData.get("techStack"),
    repoUrl: formData.get("repoUrl"),
    deployHookUrl: formData.get("deployHookUrl"),
  });

  if (!parsed.success) {
    return { error: "Please provide valid project details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in again." };
  }

  const payload = {
    owner_id: user.id,
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    slug: createProjectSlug(parsed.data.name),
    tech_stack: parsed.data.techStack || "nextjs",
    repo_url: parsed.data.repoUrl || null,
    deploy_hook_url: parsed.data.deployHookUrl || null,
  };

  const { error } = await supabase.from("projects").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function updateProjectAction(
  _prevState: ActionState,
  formData: FormData,
) {
  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
    techStack: formData.get("techStack"),
    repoUrl: formData.get("repoUrl"),
    deployHookUrl: formData.get("deployHookUrl"),
    vercelProjectId: formData.get("vercelProjectId"),
  });

  if (!parsed.success) {
    return { error: "Please provide valid project updates." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({
      status: parsed.data.status,
      tech_stack: parsed.data.techStack || "nextjs",
      repo_url: parsed.data.repoUrl || null,
      deploy_hook_url: parsed.data.deployHookUrl || null,
      vercel_project_id: parsed.data.vercelProjectId || null,
    })
    .eq("id", parsed.data.projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProjectAction(
  _prevState: ActionState,
  formData: FormData,
) {
  const parsed = deleteProjectSchema.safeParse({
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    return { error: "Invalid project id." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data.projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  return { success: true };
}
