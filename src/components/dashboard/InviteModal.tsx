"use client";

import { useState } from "react";
import { X, Mail, Send, Check, UserPlus } from "lucide-react";
import { inviteCollaborator } from "@/lib/supabase/collaborators";
import { createClient } from "@/lib/supabase/client";

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export default function InviteModal({ projectId, projectName, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await inviteCollaborator(projectId, email);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Get the invite ID
      const { data } = await supabase
        .from("project_collaborators")
        .select("id")
        .eq("project_id", projectId)
        .eq("collaborator_email", email)
        .single();

      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId: data?.id,
          projectName,
          ownerEmail: user?.email,
          collaboratorEmail: email,
        }),
      });

      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("unique")) {
        setError("Este email ya fue invitado a este proyecto.");
      } else {
        setError("Error al enviar la invitación. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-orbi-surface border border-orbi-border rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orbi-accent" />
            <h2 className="text-white font-semibold">Invitar colaborador</h2>
          </div>
          <button
            onClick={onClose}
            className="text-orbi-muted hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-orbi-muted mb-5">
          El colaborador podrá ver y editar{" "}
          <strong className="text-white">"{projectName}"</strong> en tiempo real.
        </p>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
              <Check className="w-6 h-6 text-orbi-accent" />
            </div>
            <p className="text-white font-medium">Invitación enviada</p>
            <p className="text-sm text-orbi-muted text-center">
              Le enviamos un email a <strong className="text-slate-300">{email}</strong> con el link para unirse.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-2 text-sm text-orbi-accent hover:text-orbi-accent"
            >
              Invitar a otro
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orbi-muted" />
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-orbi-card border border-orbi-border-light rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orbi-accent transition-colors"
              />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orbi-primary hover:bg-orbi-primary disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              {loading ? "Enviando..." : "Enviar invitación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
