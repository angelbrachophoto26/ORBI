"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrbiProject } from "@/types";
import {
  fetchProjects,
  createProject,
  deleteProject,
  migrateFromLocalStorage,
  fetchProjectById,
} from "@/lib/supabase/projects";
import { fetchPendingInvites, acceptInvite, fetchSharedProjects } from "@/lib/supabase/collaborators";
import { setActiveProject } from "@/lib/store";
import ProjectCard from "./ProjectCard";
import EmptyState from "./EmptyState";
import InviteModal from "./InviteModal";
import Button from "@/components/ui/Button";
import { Plus, Orbit, TrendingUp, LogOut, Bell, Check, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PendingInvite {
  id: string;
  projectId: string;
  projectName: string;
  collaboratorEmail: string;
  status: string;
  createdAt: string;
}

export default function DashboardClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<OrbiProject[]>([]);
  const [sharedProjects, setSharedProjects] = useState<OrbiProject[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showInvites, setShowInvites] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        await migrateFromLocalStorage();
        const [data, invites] = await Promise.all([
          fetchProjects(),
          fetchPendingInvites(),
        ]);
        setProjects(data);
        setPendingInvites(invites);

        // Load shared projects
        const sharedIds = await fetchSharedProjects();
        if (sharedIds.length > 0) {
          const shared = await Promise.all(sharedIds.map((id) => fetchProjectById(id)));
          setSharedProjects(shared.filter(Boolean) as OrbiProject[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const emptyProject = projects.find((p) => p.completedModules.length === 0);
      const project = emptyProject ?? (await createProject());
      setActiveProject(project);
      router.push(`/module/product-brief?pid=${project.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAcceptInvite(inviteId: string) {
    try {
      const projectId = await acceptInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      const project = await fetchProjectById(projectId);
      if (project) {
        setSharedProjects((prev) => [...prev, project]);
        setActiveProject(project);
        router.push(`/module/${project.lastModule}?pid=${project.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const completed = projects.filter((p) => p.completedModules.length === 7).length;
  const inProgress = projects.filter(
    (p) => p.completedModules.length > 0 && p.completedModules.length < 7
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orbi-accent border-t-transparent animate-spin" />
          <p className="text-sm text-orbi-muted">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Orbit className="w-5 h-5 text-orbi-accent" />
            <span className="text-xs font-semibold text-orbi-accent uppercase tracking-widest">Orbi</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Mis proyectos</h1>
          <p className="text-orbi-muted text-sm mt-1">Gestiona tus estrategias de marketing</p>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button onClick={handleCreate} size="md" disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              {creating ? "Creando..." : "Nuevo proyecto"}
            </Button>
          )}

          {/* Invite notifications */}
          {pendingInvites.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowInvites((v) => !v)}
                className="relative p-2 rounded-lg text-orbi-muted hover:text-white hover:bg-orbi-card transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orbi-primary rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {pendingInvites.length}
                </span>
              </button>

              {showInvites && (
                <div className="absolute right-0 top-10 w-80 bg-orbi-surface border border-orbi-border rounded-xl shadow-2xl z-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-orbi-muted uppercase tracking-widest px-1 mb-2">
                    Invitaciones pendientes
                  </p>
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between gap-3 p-3 bg-orbi-card/60 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{invite.projectName}</p>
                        <p className="text-xs text-orbi-muted">Te invitaron a colaborar</p>
                      </div>
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-orbi-primary hover:bg-orbi-primary text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Aceptar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-orbi-muted hover:text-slate-300 hover:bg-orbi-card transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-orbi-surface border border-orbi-border rounded-lg">
            <TrendingUp className="w-4 h-4 text-orbi-accent" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-white">{projects.length}</span>{" "}
              {projects.length === 1 ? "proyecto" : "proyectos"}
            </span>
          </div>
          {inProgress > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orbi-surface border border-orbi-border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-sm text-slate-300">
                <span className="font-semibold text-white">{inProgress}</span> en progreso
              </span>
            </div>
          )}
          {completed > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orbi-surface border border-orbi-border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-orbi-primary" />
              <span className="text-sm text-slate-300">
                <span className="font-semibold text-white">{completed}</span>{" "}
                {completed === 1 ? "completado" : "completados"}
              </span>
            </div>
          )}
          {sharedProjects.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orbi-surface border border-orbi-border rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">
                <span className="font-semibold text-white">{sharedProjects.length}</span> compartidos
              </span>
            </div>
          )}
        </div>
      )}

      {/* My projects grid */}
      {projects.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
              onInvite={(id, name) => setInviteTarget({ id, name })}
            />
          ))}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex flex-col items-center justify-center gap-3 h-48 border-2 border-dashed border-orbi-border rounded-xl text-orbi-secondary hover:border-orbi-accent/50 hover:text-orbi-accent hover:bg-orbi-primary/5 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Nuevo proyecto</span>
          </button>
        </div>
      )}

      {/* Shared projects */}
      {sharedProjects.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-orbi-muted uppercase tracking-widest">
              Proyectos compartidos contigo
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => {}}
                isShared
              />
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteTarget && (
        <InviteModal
          projectId={inviteTarget.id}
          projectName={inviteTarget.name}
          onClose={() => setInviteTarget(null)}
        />
      )}
    </div>
  );
}
