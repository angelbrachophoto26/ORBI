"use client";

import { OrbiProject, ModuleSlug, ProductBrief } from "@/types";

const PROJECTS_KEY = "orbi_projects";
const ACTIVE_KEY = "orbi_active_project";

// ── Projects list ────────────────────────────────────────────

export function getProjects(): OrbiProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: OrbiProject): void {
  if (typeof window === "undefined") return;
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  if (typeof window === "undefined") return;
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ── Active project ───────────────────────────────────────────

export function getActiveProject(): OrbiProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveProject(project: OrbiProject): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(project));
  saveProject(project);
}

export function clearActiveProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_KEY);
}

// ── Helpers ──────────────────────────────────────────────────

export function createProject(): OrbiProject {
  return {
    id: crypto.randomUUID(),
    completedModules: [],
    lastModule: "product-brief",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function markModuleComplete(
  project: OrbiProject,
  slug: ModuleSlug
): OrbiProject {
  const completed = project.completedModules.includes(slug)
    ? project.completedModules
    : [...project.completedModules, slug];
  return {
    ...project,
    completedModules: completed,
    updatedAt: new Date().toISOString(),
  };
}

export function updateProductBrief(
  project: OrbiProject,
  brief: ProductBrief
): OrbiProject {
  return {
    ...project,
    productBrief: brief,
    updatedAt: new Date().toISOString(),
  };
}
