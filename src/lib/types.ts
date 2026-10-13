export type IconName =
  | "CheckCircle"
  | "Sparkles"
  | "FastForward"
  | "Film"
  | "Globe"
  | "PlayCircle"
  | "Settings";

export interface StatItem {
  label: string;
  description: string;
  icon: IconName;
}

export interface WorkItem {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
  description?: string;
}

export interface BenefitItem {
  title: string;
  description: string;
  icon: IconName;
}

export interface PricingPlan {
  title: string;
  price: string;
  priceUSD?: number;
  description: string;
  features: string[];
  highlight: boolean;
  thumbnailUrl?: string;
}

export interface ContactChannel {
  label: string;
  value: string;
  href: string;
}

export interface PlayerSettings {
  title: string;
  description: string;
  backgroundUrl: string;
  accentColor: string;
}

export interface SiteContent {
  metadata: {
    title: string;
    description: string;
  };
  navbar: {
    brandName: string;
    logoUrl: string;
    links: { name: string; href: string }[];
  };
  hero: {
    line1: string;
    line2: string;
    punchline: string;
    subheading: string;
    youtubeVideoId: string;
  };
  stats: {
    eyebrow: string;
    title: string;
    items: StatItem[];
  };
  featuredWork: {
    eyebrow: string;
    title: string;
    items: WorkItem[];
  };
  whyChooseUs: {
    eyebrow: string;
    title: string;
    items: BenefitItem[];
  };
  showcase: {
    youtubeVideoId: string;
    badge: string;
    title: string;
    description: string;
    breakdownTitle: string;
    breakdownText: string;
    pacingTitle: string;
    pacingText: string;
  };
  player: PlayerSettings;
  pricing: {
    eyebrow: string;
    title: string;
    footnote: string;
    plans: PricingPlan[];
  };
  customSections: {
    id: string;
    eyebrow: string;
    title: string;
    textBlocks: string[];
    imageUrl: string;
    imageRounded: boolean;
  }[];
  videoSection: {
    eyebrow: string;
    title: string;
    description: string;
    items: WorkItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    tools: string[];
    summaryTitle: string;
    summaryText: string;
    workflowText: string;
    deliveryText: string;
  };
  contact: {
    badge: string;
    title: string;
    description: string;
    channels: ContactChannel[];
  };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: string;
  read: boolean;
}
