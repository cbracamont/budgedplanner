import { useEffect } from 'react';

const themeConfigs = {
  sober: {
    light: {
      primary: '220 15% 25%',
      'primary-glow': '220 15% 35%',
      'gradient-gold': 'linear-gradient(135deg, hsl(220 15% 25%), hsl(220 15% 40%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(220 15% 25%), hsl(220 15% 35%))',
      'shadow-gold': '0 8px 24px -4px hsl(220 15% 25% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(220 15% 25% / 0.3)',
    },
    dark: {
      primary: '220 15% 75%',
      'primary-glow': '220 15% 85%',
      'gradient-gold': 'linear-gradient(135deg, hsl(220 15% 75%), hsl(220 15% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(220 15% 75%), hsl(220 15% 65%))',
      'shadow-gold': '0 8px 24px -4px hsl(220 15% 75% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(220 15% 75% / 0.4)',
    }
  },
  gold: {
    light: {
      primary: '45 100% 51%',
      'primary-glow': '45 100% 65%',
      'gradient-gold': 'linear-gradient(135deg, hsl(45 100% 51%), hsl(38 92% 50%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(45 100% 51%), hsl(45 100% 65%))',
      'shadow-gold': '0 8px 24px -4px hsl(45 100% 51% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(45 100% 51% / 0.3)',
    },
    dark: {
      primary: '45 100% 51%',
      'primary-glow': '45 100% 65%',
      'gradient-gold': 'linear-gradient(135deg, hsl(45 100% 51%), hsl(38 92% 50%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(45 100% 51%), hsl(45 100% 65%))',
      'shadow-gold': '0 8px 24px -4px hsl(45 100% 51% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(45 100% 51% / 0.4)',
    }
  },
  ocean: {
    light: {
      primary: '200 90% 50%',
      'primary-glow': '220 85% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(200 90% 50%), hsl(220 85% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(200 90% 50%), hsl(210 88% 55%))',
      'shadow-gold': '0 8px 24px -4px hsl(200 90% 50% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(200 90% 50% / 0.3)',
    },
    dark: {
      primary: '200 90% 50%',
      'primary-glow': '220 85% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(200 90% 50%), hsl(220 85% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(200 90% 50%), hsl(210 88% 55%))',
      'shadow-gold': '0 8px 24px -4px hsl(200 90% 50% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(200 90% 50% / 0.4)',
    }
  },
  forest: {
    light: {
      primary: '140 70% 40%',
      'primary-glow': '160 65% 50%',
      'gradient-gold': 'linear-gradient(135deg, hsl(140 70% 40%), hsl(160 65% 50%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(140 70% 40%), hsl(150 68% 45%))',
      'shadow-gold': '0 8px 24px -4px hsl(140 70% 40% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(140 70% 40% / 0.3)',
    },
    dark: {
      primary: '140 70% 50%',
      'primary-glow': '160 65% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(140 70% 50%), hsl(160 65% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(140 70% 50%), hsl(150 68% 55%))',
      'shadow-gold': '0 8px 24px -4px hsl(140 70% 50% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(140 70% 50% / 0.4)',
    }
  },
  sunset: {
    light: {
      primary: '25 95% 55%',
      'primary-glow': '340 85% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(25 95% 55%), hsl(340 85% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(25 95% 55%), hsl(15 90% 58%))',
      'shadow-gold': '0 8px 24px -4px hsl(25 95% 55% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(25 95% 55% / 0.3)',
    },
    dark: {
      primary: '25 95% 55%',
      'primary-glow': '340 85% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(25 95% 55%), hsl(340 85% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(25 95% 55%), hsl(15 90% 58%))',
      'shadow-gold': '0 8px 24px -4px hsl(25 95% 55% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(25 95% 55% / 0.4)',
    }
  },
  royal: {
    light: {
      primary: '270 70% 50%',
      'primary-glow': '290 65% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(270 70% 50%), hsl(290 65% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(270 70% 50%), hsl(280 68% 55%))',
      'shadow-gold': '0 8px 24px -4px hsl(270 70% 50% / 0.25)',
      'shadow-premium': '0 12px 32px -8px hsl(270 70% 50% / 0.3)',
    },
    dark: {
      primary: '270 70% 50%',
      'primary-glow': '290 65% 60%',
      'gradient-gold': 'linear-gradient(135deg, hsl(270 70% 50%), hsl(290 65% 60%))',
      'gradient-primary': 'linear-gradient(135deg, hsl(270 70% 50%), hsl(280 68% 55%))',
      'shadow-gold': '0 8px 24px -4px hsl(270 70% 50% / 0.35)',
      'shadow-premium': '0 12px 32px -8px hsl(270 70% 50% / 0.4)',
    }
  }
};

export const useTheme = () => {
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const isDark = document.documentElement.classList.contains('dark');
      const config = themeConfigs[theme as keyof typeof themeConfigs];
      
      if (!config) return;
      
      const vars = isDark ? config.dark : config.light;
      const root = document.documentElement;
      
      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    };

    const theme = document.documentElement.getAttribute('data-theme') || 'gold';
    applyTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'gold';
          applyTheme(newTheme);
        }
        if (mutation.attributeName === 'class') {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'gold';
          applyTheme(currentTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    return () => observer.disconnect();
  }, []);
};
