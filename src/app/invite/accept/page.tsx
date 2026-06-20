"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvite } from "@/lib/supabase/collaborators";
import { createClient } from "@/lib/supabase/client";
import { Orbit, Check, AlertCircle } from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteId = params.get("id");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login">("loading");

  useEffect(() => {
    if (!inviteId) { setStatus("error"); return; }

    async function handle() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Store invite ID and redirect to login
        sessionStorage.setItem("pending_invite", inviteId!);
        setStatus("login");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      try {
        const projectId = await acceptInvite(inviteId!);
        setStatus("success");
        setTimeout(() => router.push(`/module/product-brief?pid=${projectId}`), 1500);
      } catch {
        setStatus("error");
      }
    }

    handle();
  }, [inviteId, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="p-2 rounded-xl bg-emerald-600">
        <Orbit className="w-6 h-6 text-white" />
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Aceptando invitación...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-2">
          <Check className="w-8 h-8 text-emerald-500" />
          <p className="text-white font-medium">¡Invitación aceptada!</p>
          <p className="text-sm text-slate-400">Entrando al proyecto...</p>
        </div>
      )}

      {status === "login" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-white font-medium">Necesitas iniciar sesión primero</p>
          <p className="text-sm text-slate-400">Redirigiendo al login...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-white font-medium">Invitación inválida o expirada</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
          >
            Ir al dashboard
          </button>
        </div>
      )}
    </div>
  );
}
