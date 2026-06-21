import { createClient } from "./client";
import { OrbiProject, ProductBrief, ModuleSlug, AudiencePersona, AdVariant, SocialPost, BlogArticle } from "@/types";
import type { KeywordCluster } from "@/lib/generateKeywords";

function rowToProject(row: Record<string, unknown>): OrbiProject {
  return {
    id: row.id as string,
    productBrief: row.product_name
      ? {
          productName: (row.product_name as string) ?? "",
          productDescription: (row.product_description as string) ?? "",
          category: (row.category as string) ?? "",
          uniqueValue: (row.unique_value as string) ?? "",
          targetProblem: (row.target_problem as string) ?? "",
          priceRange: (row.price_range as string) ?? "",
          website: (row.website as string) ?? "",
        }
      : undefined,
    audiences: (row.audiences as import("@/types").AudiencePersona[]) ?? [],
    selectedAudienceIds: (row.selected_audience_ids as string[]) ?? [],
    keywords: (row.keywords as import("@/lib/generateKeywords").KeywordCluster[]) ?? [],
    ads: (row.ads as import("@/types").AdVariant[]) ?? [],
    posts: (row.posts as import("@/types").SocialPost[]) ?? [],
    article: (row.article as import("@/types").BlogArticle) ?? undefined,
    completedModules: (row.completed_modules as ModuleSlug[]) ?? [],
    lastModule: (row.last_module as ModuleSlug) ?? "product-brief",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function briefToRow(brief: ProductBrief) {
  return {
    product_name: brief.productName,
    product_description: brief.productDescription,
    category: brief.category,
    unique_value: brief.uniqueValue,
    target_problem: brief.targetProblem,
    price_range: brief.priceRange,
    website: brief.website ?? null,
  };
}

export async function fetchProjectById(id: string): Promise<OrbiProject | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return rowToProject(data);
}

export async function fetchProjects(): Promise<OrbiProject[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  // Deduplicate by ID in case of migration race conditions
  const rows = data ?? [];
  const seen = new Set<string>();
  return rows.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).map(rowToProject);
}

export async function createProject(): Promise<OrbiProject> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function updateProjectBrief(
  id: string,
  brief: ProductBrief
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update(briefToRow(brief))
    .eq("id", id);
  if (error) throw error;
}

export async function updateProjectProgress(
  id: string,
  completedModules: ModuleSlug[],
  lastModule: ModuleSlug
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ completed_modules: completedModules, last_module: lastModule })
    .eq("id", id);
  if (error) throw error;
}

export async function saveAudiences(
  id: string,
  audiences: AudiencePersona[],
  selectedAudienceIds: string[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ audiences, selected_audience_ids: selectedAudienceIds })
    .eq("id", id);
  if (error) throw error;
}

export async function saveKeywords(
  id: string,
  keywords: KeywordCluster[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ keywords })
    .eq("id", id);
  if (error) throw error;
}

export async function saveAds(id: string, ads: AdVariant[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ ads }).eq("id", id);
  if (error) throw error;
}

export async function saveArticle(id: string, article: BlogArticle): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ article }).eq("id", id);
  if (error) throw error;
}

export async function savePosts(id: string, posts: SocialPost[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ posts }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("orbi_projects");
  if (!raw) return;

  let local: OrbiProject[] = [];
  try {
    local = JSON.parse(raw);
  } catch {
    return;
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || local.length === 0) return;

  // Fetch existing IDs to avoid duplicates
  const { data: existing } = await supabase.from("projects").select("id").eq("user_id", user.id);
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));

  for (const project of local) {
    if (existingIds.has(project.id)) continue; // already migrated
    const row: Record<string, unknown> = {
      id: project.id,
      user_id: user.id,
      completed_modules: project.completedModules,
      last_module: project.lastModule,
    };
    if (project.productBrief) {
      Object.assign(row, briefToRow(project.productBrief));
    }
    await supabase.from("projects").insert(row);
  }

  localStorage.removeItem("orbi_projects");
  localStorage.removeItem("orbi_active_project");
}
