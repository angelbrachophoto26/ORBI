"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Orbit } from "lucide-react";

type Mode = "google" | "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) setError(error.message);
      else setSuccess("Revisa tu email para confirmar tu cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Email o contraseña incorrectos.");
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-emerald-600">
            <Orbit className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold text-white tracking-tight">Orbi</p>
            <p className="text-[11px] text-slate-500 leading-none">by Life26</p>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-white mb-1 text-center">
          {mode === "signup" ? "Crear cuenta" : "Bienvenido a Orbi"}
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
          {mode === "signup" ? "Regístrate con email o Google." : "Entra con tu cuenta para continuar."}
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all duration-200 shadow-sm mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">o con email</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Email form */}
        {mode === "google" ? (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className="flex-1 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className="flex-1 py-2.5 text-sm font-medium text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-lg transition-colors"
            >
              Registrarse
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {error && <p className="text-xs text-rose-400">{error}</p>}
            {success && <p className="text-xs text-emerald-400">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? "Procesando..." : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
            </button>

            <button
              type="button"
              onClick={() => { setMode("google"); setError(null); setSuccess(null); }}
              className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors pt-1"
            >
              ← Volver
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-slate-600 text-center">Sin contraseña · Life26 · 2026</p>
      </div>
    </div>
  );
}
