export interface ProductBrief {
  productName: string;
  productDescription: string;
  category: string;
  uniqueValue: string;
  targetProblem: string;
  priceRange: string;
  website?: string;
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  status: "pending" | "in-progress" | "completed";
}

export type ModuleSlug =
  | "product-brief"
  | "audience-discovery"
  | "keyword-intelligence"
  | "ad-generator"
  | "post-generator"
  | "content-generator"
  | "team-briefing";

export interface AudiencePersona {
  id: string;
  name: string;
  age: string;
  role: string;
  companyProfile: string;
  jtbd: string;
  topPains: string[];
  triggerEvents: string[];
  desiredOutcomes: string[];
  keyVocabulary: string[];
  channels: string[];
  objections: string[];
}

export type PostPlatform = "instagram" | "facebook" | "linkedin";
export type PostFormat = "feed" | "carousel" | "reel";
export type PostPillar = "educational" | "pain" | "outcome" | "behind_scenes" | "promotional";

export interface SocialPost {
  id: string;
  platform: PostPlatform;
  format: PostFormat;
  pillar: PostPillar;
  pillarLabel: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  carouselSlides?: string[]; // titles for each slide if format === "carousel"
  reelScript?: string;       // script/shot list if format === "reel"
  selected: boolean;
}

export type AdPlatform = "google" | "meta";
export type AdAngle =
  | "pain"
  | "outcome"
  | "social_proof"
  | "curiosity"
  | "urgency";

export interface AdVariant {
  id: string;
  platform: AdPlatform;
  angle: AdAngle;
  angleLabel: string;
  // Google RSA
  headlines?: string[];   // up to 15, max 30 chars each
  descriptions?: string[]; // up to 4, max 90 chars each
  // Meta
  primaryText?: string;  // up to 125 chars visible
  headline?: string;     // max 40 chars
  description?: string;  // max 30 chars
  selected: boolean;
}

export interface BlogSection {
  id: string;
  heading: string;  // H2 o H3
  level: 2 | 3;
  content: string;
}

export interface BlogArticle {
  title: string;           // H1 — optimizado para SEO
  metaDescription: string; // max 160 chars
  slug: string;            // URL sugerida
  intro: string;           // párrafo de apertura
  sections: BlogSection[];
  conclusion: string;
  ctaText: string;         // llamada a la acción final
  targetKeyword: string;   // keyword principal del artículo
  readingTime: number;     // minutos estimados
}

export interface OrbiProject {
  id: string;
  productBrief?: ProductBrief;
  audiences?: AudiencePersona[];
  selectedAudienceIds?: string[];
  keywords?: import("@/lib/generateKeywords").KeywordCluster[];
  ads?: AdVariant[];
  posts?: SocialPost[];
  article?: BlogArticle;
  completedModules: ModuleSlug[];
  lastModule: ModuleSlug;
  createdAt: string;
  updatedAt: string;
}
