// 3DDX Dynamic Global Application Configuration
// Every aspect of the application (branding, colors, theme, versioning, links, features, API) is defined here

export interface AppBrandingConfig {
  appName: string;
  shortName: string;
  tagline: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  copyrightHolder: string;
  logoLight: string;
  logoDark: string;
  logoIcon: string;
}

export interface AppLinksConfig {
  companyWebsite: string;
  supportEmail: string;
  supportPortal: string;
  documentationUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  statusPageUrl: string;
  systemDiagnosticsUrl: string;
}

export interface AppThemeConfig {
  defaultTheme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface AppFeaturesConfig {
  enablePowerBIRealEmbed: boolean;
  enableSoundEffects: boolean;
  enableLiveTelemetry: boolean;
  enableMultiLanguage: boolean;
  enableTableExcelResize: boolean;
  defaultPageSize: number;
}

export interface AppConfiguration {
  branding: AppBrandingConfig;
  links: AppLinksConfig;
  theme: AppThemeConfig;
  features: AppFeaturesConfig;
  powerBi: {
    defaultEmbedUrl: string;
    workspaceId: string;
    datasetName: string;
    refreshIntervalSec: number;
  };
}

export const DEFAULT_APP_CONFIG: AppConfiguration = {
  branding: {
    appName: '3D Diagnostix CP PRO MAX',
    shortName: '3DDX CP',
    tagline: 'Enterprise Cloud Dental ERP & Clinical Dispatch Platform',
    version: 'v4.5.2-prod',
    buildNumber: '20261006.PROD',
    releaseDate: 'October 2026',
    copyrightHolder: '3D Diagnostix Inc. All rights reserved.',
    logoLight: '/logo-3ddx-full.png',
    logoDark: '/logo-3ddx-full.png',
    logoIcon: '/logo-3ddx.png',
  },
  links: {
    companyWebsite: 'https://3ddx.com',
    supportEmail: 'support@3ddx.com',
    supportPortal: 'https://support.3ddx.com',
    documentationUrl: 'https://docs.3ddx.com',
    privacyPolicyUrl: 'https://3ddx.com/privacy',
    termsOfServiceUrl: 'https://3ddx.com/terms',
    statusPageUrl: 'https://status.3ddx.com',
    systemDiagnosticsUrl: 'https://diagnostics.3ddx.com',
  },
  theme: {
    defaultTheme: 'light',
    primaryColor: '#0284c7', // Sky-600
    accentColor: '#ea580c',  // Orange-600
    successColor: '#10b981', // Emerald-500
    warningColor: '#f59e0b', // Amber-500
    dangerColor: '#ef4444',  // Rose-500
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '1rem',
  },
  features: {
    enablePowerBIRealEmbed: true,
    enableSoundEffects: true,
    enableLiveTelemetry: true,
    enableMultiLanguage: true,
    enableTableExcelResize: true,
    defaultPageSize: 10,
  },
  powerBi: {
    defaultEmbedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiNTRjMzI0MmQtNTA3YS00N2MwLWI0ZTctMGEyOGUwOGI0OTRhIiwidCI6IjI1ZDIwZjU1LWIxMGMtNDk5MS1hMTJlLWRlOWZkZDA2YTY0MCIsImMiOjZ9',
    workspaceId: '3ddx-powerbi-workspace-live',
    datasetName: '3DDX_FY2026_Executive_Targets.pbix',
    refreshIntervalSec: 300,
  },
};

const STORAGE_KEY = '3ddx_cp_runtime_config_v1';

export function loadAppConfig(): AppConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      branding: { ...DEFAULT_APP_CONFIG.branding, ...parsed.branding },
      links: { ...DEFAULT_APP_CONFIG.links, ...parsed.links },
      theme: { ...DEFAULT_APP_CONFIG.theme, ...parsed.theme },
      features: { ...DEFAULT_APP_CONFIG.features, ...parsed.features },
      powerBi: { ...DEFAULT_APP_CONFIG.powerBi, ...parsed.powerBi },
    };
  } catch (e) {
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppConfig(newConfig: AppConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: newConfig }));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function resetAppConfig(): AppConfiguration {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: DEFAULT_APP_CONFIG }));
  } catch (e) {
    // ignore
  }
  return DEFAULT_APP_CONFIG;
}
