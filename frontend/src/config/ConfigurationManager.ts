import type {
  TemplateConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SpacingConfig,
  ShadowConfig,
  BorderRadiusConfig,
  Breakpoints,
  ZIndexScale,
  FontFamilies,
  FontSizes,
  FontWeights,
  LineHeights,
} from '@/types/template';

/**
 * Configuration Manager for template system
 * Handles loading, validation, and management of template configurations
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private schemas: Map<string, Record<string, unknown>> = new Map();
  private migrations: Migration[] = [];

  private constructor() {
    this.initializeSchemas();
    this.initializeMigrations();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration from various sources
   */
  async loadConfig(source: string | TemplateConfig): Promise<TemplateConfig> {
    let config: TemplateConfig;

    if (typeof source === 'string') {
      // Load from file path
      config = await this.loadFromFile(source);
    } else {
      // Direct config object
      config = source;
    }

    // Apply migrations
    config = await this.applyMigrations(config);

    // Validate
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new ConfigurationError('Invalid configuration', validation.errors);
    }

    return config;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: TemplateConfig, filePath: string): Promise<void> {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new ConfigurationError('Cannot save invalid configuration', validation.errors);
    }

    const content = JSON.stringify(config, null, 2);
    // In a real implementation, this would use fs.writeFile
    console.log(`Would save to ${filePath}:`, content);
  }

  /**
   * Merge multiple configurations with precedence
   */
  mergeConfigs(...configs: TemplateConfig[]): TemplateConfig {
    if (configs.length === 0) {
      throw new Error('At least one configuration is required');
    }

    if (configs.length === 1) {
      return configs[0];
    }

    // Deep merge configurations (right takes precedence)
    return configs.reduce((merged: TemplateConfig, config: TemplateConfig) => {
      return this.deepMerge(
        merged as Record<string, unknown>,
        config as Record<string, unknown>
      ) as unknown as TemplateConfig;
    });
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(config: TemplateConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate version
    if (!config.version) {
      errors.push({
        path: 'version',
        message: 'Version is required',
        code: 'MISSING_VERSION',
      });
    } else if (!this.schemas.has(config.version)) {
      errors.push({
        path: 'version',
        message: `Unsupported version: ${config.version}`,
        code: 'INVALID_VERSION',
      });
    }

    // Validate project metadata
    if (!config.project?.name) {
      errors.push({
        path: 'project.name',
        message: 'Project name is required',
        code: 'MISSING_PROJECT_NAME',
      });
    }

    if (config.project?.name && !/^[a-z0-9-]+$/.test(config.project.name)) {
      errors.push({
        path: 'project.name',
        message: 'Project name must contain only lowercase letters, numbers, and hyphens',
        code: 'INVALID_PROJECT_NAME',
      });
    }

    // Validate layout configuration
    if (!config.layout?.type) {
      errors.push({
        path: 'layout.type',
        message: 'Layout type is required',
        code: 'MISSING_LAYOUT_TYPE',
      });
    } else if (!['classic', 'modern', 'dashboard'].includes(config.layout.type)) {
      errors.push({
        path: 'layout.type',
        message: `Invalid layout type: ${config.layout.type}`,
        code: 'INVALID_LAYOUT_TYPE',
      });
    }

    // Validate theme configuration
    if (config.theme) {
      const themeValidation = this.validateThemeConfig(config.theme);
      errors.push(...themeValidation.errors);
      warnings.push(...themeValidation.warnings);
    }

    // Validate features
    if (config.layout?.type === 'dashboard' && !config.features?.breadcrumbs) {
      warnings.push({
        path: 'features.breadcrumbs',
        message: 'Dashboard layout works best with breadcrumbs enabled',
        suggestion: 'Enable breadcrumbs for better navigation in dashboard layout',
      });
    }

    // Validate plugins
    if (config.plugins) {
      for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i];
        if (!plugin.name) {
          errors.push({
            path: `plugins[${i}].name`,
            message: 'Plugin name is required',
            code: 'MISSING_PLUGIN_NAME',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get default configuration for a layout type
   */
  getDefaultConfig(layoutType: 'classic' | 'modern' | 'dashboard' = 'classic'): TemplateConfig {
    const baseConfig: TemplateConfig = {
      version: '2.0.0',
      project: {
        name: 'my-react-app',
        description: 'Generated with React UI Template',
        author: 'Developer',
        version: '0.1.0',
        license: 'MIT',
      },
      layout: {
        type: layoutType,
        header: {
          height: '64px',
          sticky: true,
          showLogo: true,
        },
        content: {
          maxWidth: '1200px',
          padding: '24px',
        },
      },
      theme: {
        preset: 'default',
        colors: {
          primary: '#3B82F6', // Blue-500
        },
        typography: {
          fontFamily: {
            sans: 'Inter, system-ui, sans-serif',
          },
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '4rem',
          },
          fontWeight: {
            thin: 100,
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
          },
          lineHeight: {
            none: 1,
            tight: 1.25,
            snug: 1.375,
            normal: 1.5,
            relaxed: 1.625,
            loose: 2,
          },
        },
        spacing: this.getDefaultSpacing() as SpacingConfig,
        shadows: this.getDefaultShadows() as ShadowConfig,
        borderRadius: this.getDefaultBorderRadius() as BorderRadiusConfig,
      },
      navigation: [],
      features: {
        authentication: false,
        search: false,
        notifications: false,
        darkMode: true,
        responsive: true,
        breadcrumbs: layoutType === 'dashboard',
        widgets: layoutType === 'dashboard',
      },
      plugins: [],
      build: {
        target: 'es2022',
        sourceMaps: true,
        minify: true,
        treeshaking: true,
      },
    };

    // Customize based on layout type
    switch (layoutType) {
      case 'classic':
        baseConfig.layout.sidebar = {
          position: 'left',
          width: '240px',
          collapsible: true,
          overlay: true,
        };
        break;

      case 'modern':
        baseConfig.layout.header!.showNav = true;
        baseConfig.layout.header!.navigation = 'tabs';
        break;

      case 'dashboard':
        baseConfig.layout.sidebar = {
          position: 'left',
          width: '240px',
          collapsible: true,
          overlay: true,
          miniMode: true,
        };
        baseConfig.layout.breadcrumbs = {
          enabled: true,
          showHome: true,
          maxItems: 5,
        };
        break;
    }

    return baseConfig;
  }

  private async loadFromFile(filePath: string): Promise<TemplateConfig> {
    // In a real implementation, this would use fs.readFile
    // For now, return a mock configuration
    console.log(`Would load from ${filePath}`);
    return this.getDefaultConfig();
  }

  private async applyMigrations(config: TemplateConfig): Promise<TemplateConfig> {
    let migratedConfig = { ...config };

    for (const migration of this.migrations) {
      if (migration.canApply(migratedConfig)) {
        migratedConfig = await migration.apply(migratedConfig);
      }
    }

    return migratedConfig;
  }

  private validateThemeConfig(theme: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (theme.colors?.primary) {
      if (typeof theme.colors.primary === 'string') {
        if (!this.isValidColor(theme.colors.primary)) {
          errors.push({
            path: 'theme.colors.primary',
            message: 'Invalid color format',
            code: 'INVALID_COLOR',
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private isValidColor(color: string): boolean {
    // Basic color validation (hex, rgb, hsl)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;

    return hexRegex.test(color) || rgbRegex.test(color) || hslRegex.test(color);
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    if (source === null || typeof source !== 'object') {
      return source as Record<string, unknown>;
    }

    if (Array.isArray(source)) {
      return source as Record<string, unknown>;
    }

    const result = { ...target } as Record<string, unknown>;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          result[key] = this.deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          );
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private initializeSchemas(): void {
    // Initialize JSON schemas for different versions
    this.schemas.set('2.0.0', {
      // Schema definition would go here
    });
  }

  private initializeMigrations(): void {
    // Initialize migration functions
    this.migrations.push(
      new Migration('1.0.0', '2.0.0', (config) => {
        // Migration logic from v1 to v2
        return { ...config, version: '2.0.0' };
      })
    );
  }

  private getDefaultSpacing(): SpacingConfig {
    return {
      0: '0px',
      px: '1px',
      '0.5': '0.125rem',
      1: '0.25rem',
      '1.5': '0.375rem',
      2: '0.5rem',
      '2.5': '0.625rem',
      3: '0.75rem',
      '3.5': '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    };
  }

  private getDefaultShadows(): ShadowConfig {
    return {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: '0 0 #0000',
    };
  }

  private getDefaultBorderRadius(): BorderRadiusConfig {
    return {
      none: '0px',
      sm: '0.125rem',
      default: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    };
  }
}

/**
 * Custom error class for configuration-related errors
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[] = []
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Migration class for configuration version upgrades
 */
class Migration {
  constructor(
    public fromVersion: string,
    public toVersion: string,
    private migrationFn: (config: TemplateConfig) => Promise<TemplateConfig> | TemplateConfig
  ) {}

  canApply(config: TemplateConfig): boolean {
    return config.version === this.fromVersion;
  }

  async apply(config: TemplateConfig): Promise<TemplateConfig> {
    const result = await this.migrationFn(config);
    return { ...result, version: this.toVersion };
  }
}
