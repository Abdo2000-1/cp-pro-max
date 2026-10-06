import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LifeBuoy,
  FileText,
  Shield,
  Activity,
  ExternalLink,
  Code2,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { useAppConfig } from '@/contexts/ConfigContext';

export function Footer() {
  const { config } = useAppConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white/95 dark:bg-[#070b14]/95 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto py-6 px-4 sm:px-6 lg:px-8 text-xs select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand, Logo & Versioning */}
        <div className="flex flex-wrap items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="h-7 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center shadow-xs">
              <img
                src={config.branding.logoLight}
                alt={config.branding.appName}
                className="h-4 w-auto object-contain"
              />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
              {config.branding.appName}
            </span>
          </NavLink>

          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {config.branding.version} ({config.branding.buildNumber})
          </span>

          <span className="text-slate-400 text-[11px] hidden sm:inline">
            © {currentYear} {config.branding.copyrightHolder}
          </span>
        </div>

        {/* Real Links & Support Section */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
          <NavLink
            to="/config-manager"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-400 font-bold hover:underline border border-sky-200 dark:border-sky-800"
            title="Open Configuration CMS Engine"
          >
            <Sliders size={12} />
            <span>Admin CMS</span>
          </NavLink>

          <a
            href={`mailto:${config.links.supportEmail}`}
            className="hover:text-[#0284c7] transition-colors flex items-center gap-1"
            title="Email 3DDX Technical Support"
          >
            <LifeBuoy size={12} />
            <span>Support</span>
          </a>

          <a
            href={config.links.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0284c7] transition-colors flex items-center gap-1"
          >
            <FileText size={12} />
            <span>Docs</span>
            <ExternalLink size={10} className="opacity-60" />
          </a>

          <a
            href={config.links.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Status</span>
          </a>

          <a
            href={config.links.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0284c7] transition-colors"
          >
            Privacy
          </a>

          <a
            href={config.links.termsOfServiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0284c7] transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
