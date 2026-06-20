"use client";

import { useState, useEffect } from "react";
import { OrbiProject } from "@/types";
import { getActiveProject, setActiveProject } from "@/lib/store";
import { fetchProjectById } from "@/lib/supabase/projects";

function getPidFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("pid");
}

interface UseActiveProjectResult {
  project: OrbiProject | null;
  loading: boolean;
  error: string | null;
}

export function useActiveProject(): UseActiveProjectResult {
  const [project, setProject] = useState<OrbiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolve() {
      // 1. Try localStorage first
      const local = getActiveProject();
      if (local) {
        setProject(local);
        setLoading(false);
        return;
      }

      // 2. Fallback: fetch from Supabase via pid in URL
      const pid = getPidFromUrl();
      if (pid) {
        try {
          const fetched = await fetchProjectById(pid);
          if (fetched) {
            setActiveProject(fetched);
            setProject(fetched);
          } else {
            setError("Proyecto no encontrado. Vuelve al dashboard.");
          }
        } catch (e) {
          console.error(e);
          setError("Error cargando el proyecto. Vuelve al dashboard.");
        }
      } else {
        setError("No se encontró el proyecto activo. Vuelve al dashboard.");
      }

      setLoading(false);
    }

    resolve();
  }, []);

  return { project, loading, error };
}
