"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvite } from "@/lib/supabase/collaborators";
import { createClient } from "@/lib/supabase/client";
import { Orbit, Check, AlertCircle } from "lucide-react";

function AcceptInviteContent() {
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
    <div className="min-h-screen bg-orbi-bg flex flex-col items-center justify-center gap-4">
      <div className="p-2 rounded-xl bg-orbi-primary">
        <Orbit className="w-6 h-6 text-white" />
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-orbi-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-orbi-muted">Aceptando invitación...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-2">
          <Check className="w-8 h-8 text-orbi-accent" />
          <p className="text-white font-medium">¡Invitación aceptada!</p>
          <p className="text-sm text-orbi-muted">Entrando al proyecto...</p>
        </div>
      )}

      {status === "login" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-white font-medium">Necesitas iniciar sesión primero</p>
          <p className="text-sm text-orbi-muted">Redirigiendo al login...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-white font-medium">Invitación inválida o expirada</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-orbi-accent hover:text-orbi-accent mt-2"
          >
            Ir al dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteContent />
    </Suspense>
  );
}
