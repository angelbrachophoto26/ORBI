import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OrbiProject } from "@/types";
import { setActiveProject } from "@/lib/store";
import { fetchProjectById } from "@/lib/supabase/projects";

export function useRealtimeProject(
  projectId: string | undefined,
  onUpdate: (project: OrbiProject) => void
) {
  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        async () => {
          const updated = await fetchProjectById(projectId);
          if (updated) {
            setActiveProject(updated);
            onUpdate(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onUpdate]);
}
