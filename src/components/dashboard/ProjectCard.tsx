"use client";

import { OrbiProject } from "@/types";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { setActiveProject } from "@/lib/store";
import {
  ArrowRight,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  UserPlus,
  Users,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  saas: "SaaS / Software",
  servicios: "Servicios",
  educacion: "Educación",
  salud: "Salud",
  inmobiliaria: "Inmobiliaria",
  restaurante: "Restaurante",
  moda: "Moda",
  tecnologia: "Tecnología",
  otro: "Otro",
};

interface ProjectCardProps {
  project: OrbiProject;
  onDelete: (id: string) => void;
  onInvite?: (id: string, name: string) => void;
  isShared?: boolean;
}

export default function ProjectCard({ project, onDelete, onInvite, isShared }: ProjectCardProps) {
  const router = useRouter();
  const completed = project.completedModules.length;
  const total = MODULES.length;
  const progress = Math.round((completed / total) * 100);
  const category = project.productBrief?.category
    ? CATEGORY_LABELS[project.productBrief.category] ?? project.productBrief.category
    : null;

  const createdAt = new Date(project.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function handleOpen() {
    setActiveProject(project);
    router.push(`/module/${project.lastModule}?pid=${project.id}`);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(project.id);
  }

  return (
    <div
      onClick={handleOpen}
      className={cn(
        "group relative flex flex-col bg-orbi-surface border border-orbi-border rounded-xl p-5 cursor-pointer",
        "hover:border-orbi-accent/50 hover:bg-orbi-surface/80 transition-all duration-200",
        "hover:shadow-lg hover:shadow-emerald-900/20"
      )}
    >
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
        {!isShared && onInvite && (
          <button
            onClick={(e) => { e.stopPropagation(); onInvite(project.id, project.productBrief?.productName ?? "Proyecto"); }}
            className="p-1.5 rounded-lg text-orbi-secondary hover:text-orbi-accent hover:bg-orbi-primary/10 transition-all"
            title="Invitar colaborador"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        )}
        {!isShared && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-orbi-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Eliminar proyecto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isShared && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-800/40">
          <Users className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] text-blue-400">Compartido</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 pr-6">
        <h3 className="text-base font-semibold text-white truncate group-hover:text-orbi-accent transition-colors">
          {project.productBrief?.productName ?? "Sin nombre"}
        </h3>
        <div className="flex items-center gap-3 mt-1.5">
          {category && (
            <span className="flex items-center gap-1 text-xs text-orbi-muted">
              <Tag className="w-3 h-3" />
              {category}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-orbi-muted">
            <Calendar className="w-3 h-3" />
            {createdAt}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-orbi-muted">Progreso</span>
          <span className="text-xs font-semibold text-orbi-accent">
            {completed}/{total} módulos
          </span>
        </div>
        <div className="h-1.5 bg-orbi-card rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Module dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {MODULES.map((mod) => {
          const done = project.completedModules.includes(mod.slug as any);
          const isCurrent = mod.slug === project.lastModule && !done;
          return (
            <div key={mod.id} title={mod.title}>
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-orbi-accent" />
              ) : isCurrent ? (
                <Circle className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs text-orbi-muted">
          {completed === 0
            ? "Sin empezar"
            : completed === total
            ? "Completado"
            : `En módulo ${completed + 1} de ${total}`}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-orbi-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Abrir <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {/* Gold accent for completed */}
      {completed === total && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-yellow-500/40 pointer-events-none" />
      )}
    </div>
  );
}
