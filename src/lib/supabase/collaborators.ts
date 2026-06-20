import { createClient } from "./client";

export interface Collaborator {
  id: string;
  projectId: string;
  collaboratorEmail: string;
  collaboratorId: string | null;
  status: "pending" | "accepted";
  createdAt: string;
}

export async function inviteCollaborator(projectId: string, email: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("project_collaborators").insert({
    project_id: projectId,
    owner_id: user.id,
    collaborator_email: email,
  });
  if (error) throw error;
}

export async function fetchCollaborators(projectId: string): Promise<Collaborator[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_collaborators")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    collaboratorEmail: r.collaborator_email,
    collaboratorId: r.collaborator_id,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function acceptInvite(inviteId: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_collaborators")
    .update({ status: "accepted", collaborator_id: user.id })
    .eq("id", inviteId)
    .select("project_id")
    .single();
  if (error) throw error;
  return data.project_id;
}

export async function fetchPendingInvites(): Promise<(Collaborator & { projectName: string })[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("project_collaborators")
    .select("*, projects(product_name)")
    .eq("collaborator_email", user.email ?? "")
    .eq("status", "pending");
  if (error) return [];

  return (data ?? []).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    collaboratorEmail: r.collaborator_email,
    collaboratorId: r.collaborator_id,
    status: r.status,
    createdAt: r.created_at,
    projectName: (r.projects as { product_name: string } | null)?.product_name ?? "Proyecto sin nombre",
  }));
}

export async function fetchSharedProjects(): Promise<string[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("project_collaborators")
    .select("project_id")
    .eq("collaborator_id", user.id)
    .eq("status", "accepted");

  return (data ?? []).map((r) => r.project_id);
}
