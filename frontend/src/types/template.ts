// Template system types for Phase 2

export interface TemplateConfig {
  version: string;
  project: ProjectMetadata;
  layout: LayoutConfig;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  features: FeatureFlags;
  plugins: PluginConfig[];
  build: BuildConfig;
}

export interface ProjectMetadata {
  name: string;
  description?: string;
  author?: string;
  version?: string;
  license?: string;
  repository?: string;
}

export interface LayoutConfig {
  type: LayoutType;
  sidebar?: SidebarConfig;
  header?: HeaderConfig;
  content?: ContentConfig;
  breadcrumbs?: BreadcrumbConfig;
}

export type LayoutType = 'classic' | 'modern' | 'dashboard';

export interface SidebarConfig {
  position: 'left' | 'right';
  width: string;
  collapsible: boolean;
  overlay: boolean; // mobile only
  miniMode?: boolean; // dashboard only
  groups?: SidebarGroup[];
}

export interface HeaderConfig {
  height: string;
  sticky: boolean;
  showLogo: boolean;
  showNav?: boolean;
  navigation?: 'tabs' | 'pills' | 'underline'; // modern layout
  showSearch?: boolean;
}

export interface ContentConfig {
  maxWidth?: string;
  padding?: string;
  centered?: boolean;
}

export interface BreadcrumbConfig {
  enabled: boolean;
  showHome: boolean;
  maxItems: number;
  separator?: string;
}

export interface SidebarGroup {
  id: string;
  label: string;
  items: NavigationItem[];
  collapsible?: boolean;
}

export interface ThemeConfig {
  preset?: 'default' | 'corporate' | 'creative' | 'custom';
  colors: ColorConfig;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  shadows: ShadowConfig;
  borderRadius: BorderRadiusConfig;
  darkMode?: boolean;
}

export interface ColorConfig {
  primary: string | ColorScale;
  secondary?: string | ColorScale;
  neutral?: ColorScale;
  semantic?: SemanticColors;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyConfig {
  fontFamily: FontFamilies;
  fontSize: FontSizes;
  fontWeight: FontWeights;
  lineHeight: LineHeights;
  letterSpacing?: LetterSpacing;
}

export interface FontFamilies {
  sans: string;
  serif?: string;
  mono?: string;
}

export interface FontSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

export interface FontWeights {
  thin: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
}

export interface LineHeights {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface LetterSpacing {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

export interface SpacingConfig {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

export interface ShadowConfig {
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface BorderRadiusConfig {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  active?: boolean;
  children?: NavigationItem[];
}

export type NavigationConfig = NavigationItem[];

export interface FeatureFlags {
  authentication: boolean;
  search: boolean;
  notifications: boolean;
  darkMode: boolean;
  responsive: boolean;
  breadcrumbs: boolean;
  widgets?: boolean; // dashboard only
}

export interface PluginConfig {
  name: string;
  version?: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface BuildConfig {
  target: 'es2020' | 'es2022' | 'esnext';
  sourceMaps: boolean;
  minify: boolean;
  treeshaking: boolean;
  bundleAnalyzer?: boolean;
}

// Design Tokens - generated from ThemeConfig
export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    semantic: SemanticColors;
  };
  typography: TypographyConfig;
  spacing: SpacingConfig;
  shadows: ShadowConfig;
  borderRadius: BorderRadiusConfig;
  breakpoints: Breakpoints;
  zIndex: ZIndexScale;
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndexScale {
  auto: string;
  0: number;
  10: number;
  20: number;
  30: number;
  40: number;
  50: number;
  modal: number;
  dropdown: number;
  tooltip: number;
  overlay: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

// Template generation types
export interface GenerationResult {
  files: ProjectFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  metadata: GenerationMetadata;
}

export interface ProjectFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'config' | 'page' | 'hook' | 'util' | 'type';
}

export interface GenerationMetadata {
  templateVersion: string;
  generatedAt: string;
  config: TemplateConfig;
  stats: {
    fileCount: number;
    componentCount: number;
    totalLines: number;
  };
}

// Plugin system types
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];

  dependencies: Record<string, string>;
  peerDependencies?: Record<string, string>;

  files: FileManifest[];
  components: ComponentManifest[];
  hooks: HookManifest[];

  configuration?: unknown; // JSON Schema
}

export interface FileManifest {
  source: string;
  destination: string;
  template?: boolean;
}

export interface ComponentManifest {
  name: string;
  path: string;
  dependencies: string[];
  props?: Record<string, unknown>;
}

export interface HookManifest {
  name: string;
  stage: 'pre-generation' | 'post-generation' | 'pre-install' | 'post-install';
  script: string;
}

// CLI types
export interface CLIOptions {
  config?: string;
  interactive?: boolean;
  skipInstall?: boolean;
  skipGit?: boolean;
  template?: LayoutType;
  theme?: string;
  features?: string[];
  plugins?: string[];
  preview?: boolean;
  verbose?: boolean;
}

export interface PromptStep {
  id: string;
  type: 'input' | 'select' | 'multiselect' | 'confirm' | 'color';
  message: string;
  choices?: Choice[];
  default?: unknown;
  validate?: (value: unknown) => boolean | string;
  when?: (answers: unknown) => boolean;
}

export interface Choice {
  name: string;
  value: unknown;
  description?: string;
  disabled?: boolean | string;
}
