import { ProductBrief, AudiencePersona } from "@/types";

export type KeywordIntent = "informacional" | "comercial" | "transaccional";

export interface Keyword {
  id: string;
  phrase: string;
  intent: KeywordIntent;
  cluster: string;
  estimatedVolume: "alta" | "media" | "baja";
  difficulty: "baja" | "media" | "alta";
  selected: boolean;
}

export interface KeywordCluster {
  name: string;
  intent: KeywordIntent;
  keywords: Keyword[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function kw(
  phrase: string,
  intent: KeywordIntent,
  cluster: string,
  volume: Keyword["estimatedVolume"],
  difficulty: Keyword["difficulty"]
): Keyword {
  return { id: uid(), phrase, intent, cluster, estimatedVolume: volume, difficulty, selected: false };
}

function generateInformacionalKeywords(brief: ProductBrief): Keyword[] {
  const { productName, category, targetProblem } = brief;
  const problemSlug = targetProblem.split(" ").slice(0, 4).join(" ").toLowerCase();
  const categoryMap: Record<string, string[]> = {
    saas: ["software", "herramienta", "plataforma", "app"],
    ecommerce: ["tienda online", "e-commerce", "productos", "compra online"],
    servicios: ["servicio", "consultoría", "agencia"],
    educacion: ["curso", "formación", "aprendizaje", "programa"],
    salud: ["salud", "bienestar", "tratamiento"],
    tecnologia: ["tecnología", "app", "software", "herramienta digital"],
    inmobiliaria: ["inmobiliaria", "propiedades", "bienes raíces"],
    restaurante: ["restaurante", "comida", "gastronomía"],
    moda: ["moda", "ropa", "estilo"],
    otro: ["solución", "producto", "servicio"],
  };
  const cats = categoryMap[category] ?? categoryMap["otro"];
  const cat = cats[0];

  return [
    kw(`qué es ${productName}`, "informacional", "marca", "media", "baja"),
    kw(`para qué sirve ${productName}`, "informacional", "marca", "baja", "baja"),
    kw(`cómo funciona ${productName}`, "informacional", "marca", "baja", "baja"),
    kw(`${productName} reseña`, "informacional", "marca", "media", "baja"),
    kw(`cómo resolver ${problemSlug}`, "informacional", "problema", "alta", "media"),
    kw(`por qué ${problemSlug}`, "informacional", "problema", "alta", "baja"),
    kw(`soluciones para ${problemSlug}`, "informacional", "problema", "media", "media"),
    kw(`cómo mejorar ${problemSlug}`, "informacional", "problema", "alta", "baja"),
    kw(`qué es ${cat}`, "informacional", "categoria", "alta", "alta"),
    kw(`tipos de ${cat}`, "informacional", "categoria", "media", "media"),
    kw(`ventajas de usar ${cat}`, "informacional", "categoria", "media", "baja"),
    kw(`cómo elegir ${cat}`, "informacional", "categoria", "media", "media"),
  ];
}

function generateComercialKeywords(
  brief: ProductBrief,
  audiences: AudiencePersona[]
): Keyword[] {
  const { productName, category } = brief;
  const categoryMap: Record<string, string> = {
    saas: "software",
    ecommerce: "tienda online",
    servicios: "servicio",
    educacion: "curso",
    salud: "producto de salud",
    tecnologia: "herramienta",
    inmobiliaria: "agente inmobiliario",
    restaurante: "restaurante",
    moda: "marca de ropa",
    otro: "solución",
  };
  const cat = categoryMap[category] ?? "solución";

  const audienceKws: Keyword[] = [];
  audiences.slice(0, 2).forEach((aud) => {
    const roleSlug = aud.role.split("/")[0].trim().toLowerCase().split(" ").slice(0, 3).join(" ");
    audienceKws.push(
      kw(`${cat} para ${roleSlug}`, "comercial", "audiencia", "media", "media"),
      kw(`mejor ${cat} para ${roleSlug}`, "comercial", "audiencia", "media", "media")
    );
  });

  return [
    kw(`mejor ${cat} para [tu industria]`, "comercial", "categoria", "alta", "alta"),
    kw(`${cat} más recomendado`, "comercial", "categoria", "media", "alta"),
    kw(`alternativas a [competidor]`, "comercial", "competencia", "media", "media"),
    kw(`${productName} vs [competidor]`, "comercial", "competencia", "media", "baja"),
    kw(`opiniones de ${productName}`, "comercial", "marca", "media", "baja"),
    kw(`${productName} funciona`, "comercial", "marca", "baja", "baja"),
    kw(`${productName} testimonios`, "comercial", "marca", "baja", "baja"),
    kw(`${productName} casos de éxito`, "comercial", "marca", "baja", "baja"),
    ...audienceKws,
  ];
}

function generateTransaccionalKeywords(brief: ProductBrief): Keyword[] {
  const { productName, priceRange, category } = brief;
  const categoryMap: Record<string, string> = {
    saas: "software",
    ecommerce: "producto",
    servicios: "servicio",
    educacion: "curso",
    salud: "tratamiento",
    tecnologia: "herramienta",
    inmobiliaria: "propiedad",
    restaurante: "reserva",
    moda: "comprar ropa",
    otro: "servicio",
  };
  const cat = categoryMap[category] ?? "solución";
  const priceKw = priceRange === "gratuito" ? "gratis" : "precio";

  return [
    kw(`${productName} precio`, "transaccional", "compra", "media", "baja"),
    kw(`${productName} ${priceKw}`, "transaccional", "compra", "media", "baja"),
    kw(`contratar ${productName}`, "transaccional", "compra", "baja", "baja"),
    kw(`${productName} demo`, "transaccional", "compra", "baja", "baja"),
    kw(`${productName} prueba gratis`, "transaccional", "compra", "media", "baja"),
    kw(`comprar ${cat}`, "transaccional", "categoria", "alta", "alta"),
    kw(`contratar ${cat}`, "transaccional", "categoria", "media", "alta"),
    kw(`${cat} ${priceKw}`, "transaccional", "categoria", "alta", "alta"),
    kw(`${cat} online`, "transaccional", "categoria", "alta", "alta"),
    kw(`${productName} descuento`, "transaccional", "oferta", "baja", "baja"),
    kw(`${productName} plan`, "transaccional", "oferta", "baja", "baja"),
  ];
}

export function generateKeywords(
  brief: ProductBrief,
  audiences: AudiencePersona[]
): KeywordCluster[] {
  const informacional = generateInformacionalKeywords(brief);
  const comercial = generateComercialKeywords(brief, audiences);
  const transaccional = generateTransaccionalKeywords(brief);

  const clusters: KeywordCluster[] = [
    {
      name: "Informacional — Educación y problema",
      intent: "informacional",
      keywords: informacional,
    },
    {
      name: "Comercial — Comparación y evaluación",
      intent: "comercial",
      keywords: comercial,
    },
    {
      name: "Transaccional — Compra y conversión",
      intent: "transaccional",
      keywords: transaccional,
    },
  ];

  return clusters;
}
