"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductBrief } from "@/types";
import { setActiveProject, updateProductBrief, markModuleComplete } from "@/lib/store";
import { updateProjectBrief, updateProjectProgress } from "@/lib/supabase/projects";
import { useActiveProject } from "@/lib/useActiveProject";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "ecommerce", label: "E-commerce / Tienda online" },
  { value: "saas", label: "SaaS / Software" },
  { value: "servicios", label: "Servicios profesionales" },
  { value: "educacion", label: "Educación / Cursos" },
  { value: "salud", label: "Salud y bienestar" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "restaurante", label: "Restaurante / Food" },
  { value: "moda", label: "Moda / Lifestyle" },
  { value: "tecnologia", label: "Tecnología / Apps" },
  { value: "otro", label: "Otro" },
];

const PRICE_OPTIONS = [
  { value: "gratuito", label: "Gratuito / Freemium" },
  { value: "0-50", label: "$0 – $50 USD" },
  { value: "50-200", label: "$50 – $200 USD" },
  { value: "200-500", label: "$200 – $500 USD" },
  { value: "500-2000", label: "$500 – $2,000 USD" },
  { value: "2000+", label: "$2,000+ USD" },
];

const EMPTY: ProductBrief = {
  productName: "",
  productDescription: "",
  category: "",
  uniqueValue: "",
  targetProblem: "",
  priceRange: "",
  website: "",
};

interface Errors {
  [key: string]: string;
}

export default function ProductBriefForm() {
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError } = useActiveProject();
  const [form, setForm] = useState<ProductBrief>(EMPTY);
  const [formReady, setFormReady] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Once project loads, populate form with existing brief data
  useEffect(() => {
    if (project && !formReady) {
      setForm(project.productBrief ?? EMPTY);
      setFormReady(true);
    }
  }, [project, formReady]);

  function update(field: keyof ProductBrief, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const newErrors: Errors = {};
    if (!form.productName.trim()) newErrors.productName = "El nombre del producto es obligatorio.";
    if (!form.productDescription.trim() || form.productDescription.length < 30)
      newErrors.productDescription = "Describe tu producto con al menos 30 caracteres.";
    if (!form.category) newErrors.category = "Selecciona una categoría.";
    if (!form.uniqueValue.trim() || form.uniqueValue.length < 20)
      newErrors.uniqueValue = "Describe tu propuesta de valor con al menos 20 caracteres.";
    if (!form.targetProblem.trim() || form.targetProblem.length < 20)
      newErrors.targetProblem = "Describe el problema que resuelves con al menos 20 caracteres.";
    if (!form.priceRange) newErrors.priceRange = "Selecciona un rango de precio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !project) return;
    setSaving(true);
    setSaveError(null);
    try {
      let updated = updateProductBrief(project, form);
      updated = markModuleComplete(updated, "product-brief");
      updated = { ...updated, lastModule: "audience-discovery" };
      setActiveProject(updated);
      // Supabase sync — navigate regardless of success
      try {
        await updateProjectBrief(updated.id, form);
        await updateProjectProgress(updated.id, updated.completedModules, "audience-discovery");
      } catch (syncErr) {
        console.error("Supabase sync failed (continuing):", syncErr);
      }
      router.push(`/module/audience-discovery?pid=${updated.id}`);
    } catch (e) {
      console.error(e);
      setSaveError("Ocurrió un error inesperado. Intenta de nuevo.");
      setSaving(false);
    }
  }

  const completedFields = Object.entries(form).filter(
    ([key, val]) => key !== "website" && val.trim().length > 0
  ).length;
  const totalRequired = 6;
  const progress = Math.round((completedFields / totalRequired) * 100);

  // Loading state
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        <span className="text-sm text-slate-400">Cargando proyecto...</span>
      </div>
    );
  }

  // Project not found
  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-slate-300 text-sm">{projectError ?? "No se encontró el proyecto."}</p>
        <Button onClick={() => router.push("/dashboard")} size="sm">
          Volver al dashboard
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{completedFields}/{totalRequired} campos</span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-5">
        <Input
          id="productName"
          label="Nombre del producto o empresa *"
          placeholder="ej. Orbi, TasKing, SaludApp..."
          value={form.productName}
          onChange={(e) => update("productName", e.target.value)}
          error={errors.productName}
        />

        <Textarea
          id="productDescription"
          label="Descripción del producto *"
          placeholder="Describe qué es tu producto, qué hace y para quién está pensado. Sé específico."
          rows={4}
          value={form.productDescription}
          onChange={(e) => update("productDescription", e.target.value)}
          error={errors.productDescription}
          hint={`${form.productDescription.length} caracteres (mínimo 30)`}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="category"
            label="Categoría *"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            error={errors.category}
          />
          <Select
            id="priceRange"
            label="Rango de precio *"
            options={PRICE_OPTIONS}
            value={form.priceRange}
            onChange={(e) => update("priceRange", e.target.value)}
            error={errors.priceRange}
          />
        </div>

        <Textarea
          id="uniqueValue"
          label="¿Cuál es tu propuesta de valor única? *"
          placeholder="¿Por qué un cliente debería elegirte a ti y no a la competencia?"
          rows={3}
          value={form.uniqueValue}
          onChange={(e) => update("uniqueValue", e.target.value)}
          error={errors.uniqueValue}
          hint={`${form.uniqueValue.length} caracteres (mínimo 20)`}
        />

        <Textarea
          id="targetProblem"
          label="¿Qué problema resuelves? *"
          placeholder="Describe el dolor o necesidad específica que tiene tu cliente ideal."
          rows={3}
          value={form.targetProblem}
          onChange={(e) => update("targetProblem", e.target.value)}
          error={errors.targetProblem}
          hint={`${form.targetProblem.length} caracteres (mínimo 20)`}
        />

        <Input
          id="website"
          label="Sitio web (opcional)"
          placeholder="https://tuproducto.com"
          value={form.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
          type="url"
        />
      </div>

      {/* Error message */}
      {saveError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Esta info alimentará todos los módulos siguientes</span>
        </div>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar a Audiencias
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
