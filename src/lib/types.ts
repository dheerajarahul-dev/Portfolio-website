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

export interface MediaLibraryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "video" | "photo";
  sourceType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  crop?: {
    x: number;
    y: number;
    scale: number;
  };
  layout?: EditableLayout;
  published: boolean;
  featured: boolean;
  altText?: string;
  createdAt?: string;
}

export interface PlayerSettings {
  title: string;
  description: string;
  backgroundUrl: string;
  accentColor: string;
  showComments: boolean;
  showSuggestions: boolean;
  showPlaybackSettings: boolean;
  showReferenceButton: boolean;
  backButtonLabel: string;
  speedLabel: string;
  qualityLabel: string;
  referenceButtonLabel: string;
  commentsTitle: string;
  commentsSortLabel: string;
  commentsNewestLabel: string;
  commentsOldestLabel: string;
  commentNameLabel: string;
  commentNamePlaceholder: string;
  commentBodyLabel: string;
  commentPlaceholder: string;
  commentSubmitLabel: string;
  commentsPrivacyNote: string;
  commentsEmptyMessage: string;
  suggestionsTitle: string;
  suggestionsEmptyMessage: string;
  youtubeQualityMessage: string;
  sourceQualityMessage: string;
  noVideoMessage: string;
  commentsLoadingMessage: string;
  commentsUnavailableMessage: string;
  playButtonLabel: string;
  pauseButtonLabel: string;
  muteButtonLabel: string;
  unmuteButtonLabel: string;
  fullscreenButtonLabel: string;
  timelineLabel: string;
  volumeLabel: string;
  referenceAddedLabel: string;
  qualityAutoValue: string;
  qualitySourceValue: string;
  currentVideoLabel: string;
}

export interface FounderProfile {
  name: string;
  role: string;
  photoUrl: string;
  biography: string;
}

export interface EditableLayout {
  x: number;
  y: number;
  scale: number;
}

export interface VisualElementSettings {
  x?: number;
  y?: number;
  scale?: number;
  width?: string;
  height?: string;
  maxWidth?: string;
  padding?: string;
  margin?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  opacity?: number;
  objectFit?: "contain" | "cover";
  altText?: string;
  label?: string;
}

export interface SiteContent {
  metadata: {
    title: string;
    description: string;
  };
  navbar: {
    brandName: string;
    logoUrl: string;
    contactLabel: string;
    links: { name: string; href: string }[];
  };
  hero: {
    line1: string;
    line2: string;
    punchline: string;
    subheading: string;
    ctaWork: string;
    ctaReel: string;
    ctaContact: string;
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
  founder: FounderProfile;
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
    layout?: EditableLayout;
  }[];
  mediaLibrary: {
    title: string;
    description: string;
    items: MediaLibraryItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    tools: string[];
    toolLogos?: { label: string; src: string; alt: string }[];
    summaryTitle: string;
    summaryText: string;
    workflowText: string;
    deliveryText: string;
  };
  contact: {
    badge: string;
    title: string;
    description: string;
    directTitle: string;
    directHeading: string;
    directDescription: string;
    channelAction: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      projectTypeLabel: string;
      projectTypes: string[];
      subjectLabel: string;
      subjectPlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submitLabel: string;
      successMessage: string;
    };
    channels: ContactChannel[];
  };
  editor?: {
    elements: Record<string, VisualElementSettings>;
  };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  projectType: string;
  message: string;
  createdAt: string;
  read: boolean;
  deletedAt?: string | null;
}

export type AdminUserRole = "owner" | "editor" | "media" | "messages";

export type AdminPermission =
  | "overview:view"
  | "media:manage"
  | "site:edit"
  | "messages:view"
  | "messages:delete"
  | "accounts:manage"
  | "settings:view";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminUserRole;
  permissions: AdminPermission[];
  active: boolean;
  createdAt: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
  passwordSalt: string;
  updatedAt: string;
}
