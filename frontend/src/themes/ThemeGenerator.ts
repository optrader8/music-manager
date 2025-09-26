import type { ThemeConfig, DesignTokens, ColorScale, SemanticColors } from '@/types/template';
import type { Config as TailwindConfig } from 'tailwindcss';

/**
 * Theme Generator for creating design tokens and CSS from theme configuration
 */
export class ThemeGenerator {
  private static instance: ThemeGenerator;

  private constructor() {}

  static getInstance(): ThemeGenerator {
    if (!ThemeGenerator.instance) {
      ThemeGenerator.instance = new ThemeGenerator();
    }
    return ThemeGenerator.instance;
  }

  /**
   * Generate complete design tokens from theme configuration
   */
  async generateTokens(themeConfig: ThemeConfig): Promise<DesignTokens> {
    const colors = await this.generateColorSystem(themeConfig.colors);

    return {
      colors,
      typography: themeConfig.typography,
      spacing: themeConfig.spacing,
      shadows: themeConfig.shadows,
      borderRadius: themeConfig.borderRadius,
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      zIndex: {
        auto: 'auto',
        0: 0,
        10: 10,
        20: 20,
        30: 30,
        40: 40,
        50: 50,
        modal: 1000,
        dropdown: 1010,
        tooltip: 1020,
        overlay: 1030,
      },
    };
  }

  /**
   * Generate CSS custom properties from design tokens
   */
  generateCSS(tokens: DesignTokens): string {
    const cssVars: string[] = [':root {'];

    // Colors
    cssVars.push('  /* Primary Colors */');
    Object.entries(tokens.colors.primary).forEach(([shade, color]) => {
      cssVars.push(`  --color-primary-${shade}: ${color};`);
    });

    cssVars.push('  /* Secondary Colors */');
    Object.entries(tokens.colors.secondary).forEach(([shade, color]) => {
      cssVars.push(`  --color-secondary-${shade}: ${color};`);
    });

    cssVars.push('  /* Neutral Colors */');
    Object.entries(tokens.colors.neutral).forEach(([shade, color]) => {
      cssVars.push(`  --color-neutral-${shade}: ${color};`);
    });

    cssVars.push('  /* Semantic Colors */');
    Object.entries(tokens.colors.semantic).forEach(([name, color]) => {
      cssVars.push(`  --color-${name}: ${color};`);
    });

    // Typography
    cssVars.push('  /* Font Families */');
    Object.entries(tokens.typography.fontFamily).forEach(([name, value]) => {
      cssVars.push(`  --font-${name}: ${value};`);
    });

    cssVars.push('  /* Font Sizes */');
    Object.entries(tokens.typography.fontSize).forEach(([size, value]) => {
      cssVars.push(`  --text-${size}: ${value};`);
    });

    cssVars.push('  /* Font Weights */');
    Object.entries(tokens.typography.fontWeight).forEach(([weight, value]) => {
      cssVars.push(`  --font-${weight}: ${value};`);
    });

    cssVars.push('  /* Line Heights */');
    Object.entries(tokens.typography.lineHeight).forEach(([name, value]) => {
      cssVars.push(`  --leading-${name}: ${value};`);
    });

    // Spacing
    cssVars.push('  /* Spacing */');
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      cssVars.push(`  --space-${key.replace('.', '-')}: ${value};`);
    });

    // Shadows
    cssVars.push('  /* Shadows */');
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      cssVars.push(`  --shadow-${name}: ${value};`);
    });

    // Border Radius
    cssVars.push('  /* Border Radius */');
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      cssVars.push(`  --rounded-${name}: ${value};`);
    });

    // Breakpoints
    cssVars.push('  /* Breakpoints */');
    Object.entries(tokens.breakpoints).forEach(([name, value]) => {
      cssVars.push(`  --screen-${name}: ${value};`);
    });

    // Z-Index
    cssVars.push('  /* Z-Index */');
    Object.entries(tokens.zIndex).forEach(([name, value]) => {
      cssVars.push(`  --z-${name}: ${value};`);
    });

    cssVars.push('}');

    return cssVars.join('\n');
  }

  /**
   * Generate SCSS variables from design tokens
   */
  generateSCSS(tokens: DesignTokens): string {
    const scssVars: string[] = ['// Design Tokens'];

    // Colors
    scssVars.push('// Primary Colors');
    Object.entries(tokens.colors.primary).forEach(([shade, color]) => {
      scssVars.push(`$color-primary-${shade}: ${color};`);
    });

    scssVars.push('// Secondary Colors');
    Object.entries(tokens.colors.secondary).forEach(([shade, color]) => {
      scssVars.push(`$color-secondary-${shade}: ${color};`);
    });

    scssVars.push('// Neutral Colors');
    Object.entries(tokens.colors.neutral).forEach(([shade, color]) => {
      scssVars.push(`$color-neutral-${shade}: ${color};`);
    });

    // Typography
    scssVars.push('// Typography');
    Object.entries(tokens.typography.fontSize).forEach(([size, value]) => {
      scssVars.push(`$text-${size}: ${value};`);
    });

    // Spacing
    scssVars.push('// Spacing');
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      scssVars.push(`$space-${key.replace('.', '-')}: ${value};`);
    });

    // Create SCSS maps for easier usage
    scssVars.push('\n// Color Maps');
    scssVars.push('$primary-colors: (');
    Object.entries(tokens.colors.primary).forEach(([shade, color]) => {
      scssVars.push(`  ${shade}: ${color},`);
    });
    scssVars.push(');');

    return scssVars.join('\n');
  }

  /**
   * Generate Tailwind CSS configuration
   */
  generateTailwindConfig(tokens: DesignTokens): TailwindConfig {
    return {
      theme: {
        extend: {
          colors: {
            primary: tokens.colors.primary,
            secondary: tokens.colors.secondary,
            neutral: tokens.colors.neutral,
            success: tokens.colors.semantic.success,
            warning: tokens.colors.semantic.warning,
            error: tokens.colors.semantic.error,
            info: tokens.colors.semantic.info,
          },
          fontFamily: tokens.typography.fontFamily,
          fontSize: tokens.typography.fontSize,
          fontWeight: tokens.typography.fontWeight,
          lineHeight: tokens.typography.lineHeight,
          spacing: tokens.spacing,
          boxShadow: tokens.shadows,
          borderRadius: tokens.borderRadius,
          screens: tokens.breakpoints,
          zIndex: tokens.zIndex,
        },
      },
    };
  }

  /**
   * Generate color system from theme colors configuration
   */
  private async generateColorSystem(colors: unknown): Promise<{
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    semantic: SemanticColors;
  }> {
    let primary: ColorScale;
    let secondary: ColorScale;
    let neutral: ColorScale;

    // Generate primary color scale
    if (typeof colors.primary === 'string') {
      primary = this.generateColorScale(colors.primary);
    } else {
      primary = colors.primary as ColorScale;
    }

    // Generate secondary color scale
    if (colors.secondary) {
      if (typeof colors.secondary === 'string') {
        secondary = this.generateColorScale(colors.secondary);
      } else {
        secondary = colors.secondary as ColorScale;
      }
    } else {
      // Generate complementary color
      const complementaryColor = this.generateComplementaryColor(
        typeof colors.primary === 'string' ? colors.primary : colors.primary[500]
      );
      secondary = this.generateColorScale(complementaryColor);
    }

    // Generate neutral color scale
    if (colors.neutral) {
      neutral = colors.neutral as ColorScale;
    } else {
      neutral = this.generateNeutralScale(
        typeof colors.primary === 'string' ? colors.primary : colors.primary[500]
      );
    }

    // Generate semantic colors
    const semantic: SemanticColors = colors.semantic || {
      success: '#10B981', // Green-500
      warning: '#F59E0B', // Amber-500
      error: '#EF4444', // Red-500
      info: '#3B82F6', // Blue-500
    };

    return { primary, secondary, neutral, semantic };
  }

  /**
   * Generate a full color scale from a base color
   */
  private generateColorScale(baseColor: string): ColorScale {
    // Convert hex to HSL for better color manipulation
    const hsl = this.hexToHsl(baseColor);

    return {
      50: this.hslToHex({ ...hsl, l: Math.min(95, hsl.l + 45) }),
      100: this.hslToHex({ ...hsl, l: Math.min(90, hsl.l + 35) }),
      200: this.hslToHex({ ...hsl, l: Math.min(85, hsl.l + 25) }),
      300: this.hslToHex({ ...hsl, l: Math.min(75, hsl.l + 15) }),
      400: this.hslToHex({ ...hsl, l: Math.min(65, hsl.l + 5) }),
      500: baseColor, // Base color
      600: this.hslToHex({ ...hsl, l: Math.max(35, hsl.l - 5) }),
      700: this.hslToHex({ ...hsl, l: Math.max(25, hsl.l - 15) }),
      800: this.hslToHex({ ...hsl, l: Math.max(15, hsl.l - 25) }),
      900: this.hslToHex({ ...hsl, l: Math.max(10, hsl.l - 35) }),
      950: this.hslToHex({ ...hsl, l: Math.max(5, hsl.l - 40) }),
    };
  }

  /**
   * Generate complementary color
   */
  private generateComplementaryColor(baseColor: string): string {
    const hsl = this.hexToHsl(baseColor);
    const complementaryHue = (hsl.h + 180) % 360;

    return this.hslToHex({ ...hsl, h: complementaryHue });
  }

  /**
   * Generate neutral color scale based on primary color
   */
  private generateNeutralScale(baseColor: string): ColorScale {
    const hsl = this.hexToHsl(baseColor);

    // Create neutral by desaturating the base color
    const neutralHsl = { ...hsl, s: Math.max(5, hsl.s * 0.1) };

    return {
      50: this.hslToHex({ ...neutralHsl, l: 98 }),
      100: this.hslToHex({ ...neutralHsl, l: 96 }),
      200: this.hslToHex({ ...neutralHsl, l: 90 }),
      300: this.hslToHex({ ...neutralHsl, l: 83 }),
      400: this.hslToHex({ ...neutralHsl, l: 64 }),
      500: this.hslToHex({ ...neutralHsl, l: 45 }),
      600: this.hslToHex({ ...neutralHsl, l: 36 }),
      700: this.hslToHex({ ...neutralHsl, l: 26 }),
      800: this.hslToHex({ ...neutralHsl, l: 15 }),
      900: this.hslToHex({ ...neutralHsl, l: 9 }),
      950: this.hslToHex({ ...neutralHsl, l: 4 }),
    };
  }

  /**
   * Convert hex color to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Convert HSL color to hex
   */
  private hslToHex(hsl: { h: number; s: number; l: number }): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Validate color contrast for accessibility
   */
  validateContrast(
    foreground: string,
    background: string
  ): {
    ratio: number;
    aaPass: boolean;
    aaaPass: boolean;
  } {
    const getLuminance = (color: string): number => {
      const rgb = this.hexToRgb(color);
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      aaPass: ratio >= 4.5,
      aaaPass: ratio >= 7,
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  }
}
