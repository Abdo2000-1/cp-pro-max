import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Palette,
  Globe,
  Share2,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layout,
  Layers,
  BarChart3,
  Activity,
  Check
} from 'lucide-react';
import { useAppConfig } from '@/contexts/ConfigContext';
import { sound } from '@/utils/sound';
import { RESTORATION_TYPES, SERVICE_METADATA, RestorationType } from '@/components/ui/TeethChart';

export default function ConfigManager() {
  const { config, saveConfig, resetConfig } = useAppConfig();
  const [formState, setFormState] = useState(config);
  const [savedNotification, setSavedNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'theme' | 'links' | 'features' | 'powerbi' | 'dental'>('branding');

  const handleChange = (section: keyof typeof formState, field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
  };

  const handleToggleProcedure = (serviceId: string, procId: string) => {
    setFormState(prev => {
      const currentList = prev.serviceProcedures?.[serviceId] || [];
      const updatedList = currentList.includes(procId)
        ? currentList.filter(p => p !== procId)
        : [...currentList, procId];
      return {
        ...prev,
        serviceProcedures: {
          ...prev.serviceProcedures,
          [serviceId]: updatedList
        }
      };
    });
  };

  const handleSetAllProceduresForService = (serviceId: string, selectAll: boolean) => {
    setFormState(prev => ({
      ...prev,
      serviceProcedures: {
        ...prev.serviceProcedures,
        [serviceId]: selectAll ? RESTORATION_TYPES.map(r => r.id) : []
      }
    }));
  };

  const handleSave = () => {
    saveConfig(formState);
    sound.playSuccess();
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restore the factory default configuration?')) {
      resetConfig();
      sound.playClick();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 pb-16">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Configuration Management System (CMS)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 border border-sky-500/30">
                  Live Runtime Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized external administrative control over UI branding, themes, endpoints, and features
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-[#0284c7] hover:bg-sky-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer"
          >
            <Save size={14} />
            <span>Save & Apply Configuration</span>
          </button>
        </div>
      </div>

      {savedNotification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Configuration saved successfully! Changes are applied across the entire application immediately.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'branding', label: 'Company & Branding', icon: Layers },
          { key: 'theme', label: 'Theme & Appearance', icon: Palette },
          { key: 'links', label: 'Navigation & Support Links', icon: Share2 },
          { key: 'features', label: 'Feature Flags', icon: Layout },
          { key: 'powerbi', label: 'Power BI Embedded Gateway', icon: BarChart3 },
          { key: 'dental', label: 'Dental Services & Odontogram Matrix', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Company & Branding */}
      {activeTab === 'branding' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Branding & Versioning
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Application Full Name</label>
              <input
                type="text"
                value={formState.branding.appName}
                onChange={e => handleChange('branding', 'appName', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Short Brand Name</label>
              <input
                type="text"
                value={formState.branding.shortName}
                onChange={e => handleChange('branding', 'shortName', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Release Version</label>
              <input
                type="text"
                value={formState.branding.version}
                onChange={e => handleChange('branding', 'version', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Build Number</label>
              <input
                type="text"
                value={formState.branding.buildNumber}
                onChange={e => handleChange('branding', 'buildNumber', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
              <input
                type="text"
                value={formState.branding.tagline}
                onChange={e => handleChange('branding', 'tagline', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Copyright Holder Notice</label>
              <input
                type="text"
                value={formState.branding.copyrightHolder}
                onChange={e => handleChange('branding', 'copyrightHolder', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Theme & Appearance */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Design Tokens & Global Theme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formState.theme.primaryColor}
                  onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={formState.theme.primaryColor}
                  onChange={e => handleChange('theme', 'primaryColor', e.target.value)}
                  className="flex-1 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Accent Highlight (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formState.theme.accentColor}
                  onChange={e => handleChange('theme', 'accentColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={formState.theme.accentColor}
                  onChange={e => handleChange('theme', 'accentColor', e.target.value)}
                  className="flex-1 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Success Color</label>
              <input
                type="text"
                value={formState.theme.successColor}
                onChange={e => handleChange('theme', 'successColor', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Warning Color</label>
              <input
                type="text"
                value={formState.theme.warningColor}
                onChange={e => handleChange('theme', 'warningColor', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Navigation & Support Links */}
      {activeTab === 'links' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Company Official Links & Footer Targets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Website</label>
              <input
                type="url"
                value={formState.links.companyWebsite}
                onChange={e => handleChange('links', 'companyWebsite', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
              <input
                type="email"
                value={formState.links.supportEmail}
                onChange={e => handleChange('links', 'supportEmail', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Support Portal</label>
              <input
                type="url"
                value={formState.links.supportPortal}
                onChange={e => handleChange('links', 'supportPortal', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Status Page</label>
              <input
                type="url"
                value={formState.links.statusPageUrl}
                onChange={e => handleChange('links', 'statusPageUrl', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Privacy Policy URL</label>
              <input
                type="url"
                value={formState.links.privacyPolicyUrl}
                onChange={e => handleChange('links', 'privacyPolicyUrl', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Terms of Service URL</label>
              <input
                type="url"
                value={formState.links.termsOfServiceUrl}
                onChange={e => handleChange('links', 'termsOfServiceUrl', e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Features */}
      {activeTab === 'features' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Dynamic Feature Toggles
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Excel-like Table Column & Row Resizing</span>
                <span className="text-slate-400">Allow users to grab column separators and drag to expand width smoothly</span>
              </div>
              <input
                type="checkbox"
                checked={formState.features.enableTableExcelResize}
                onChange={e => handleChange('features', 'enableTableExcelResize', e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Sound Feedback Engine</span>
                <span className="text-slate-400">Audio feedback on row accordion expansion and filter actions</span>
              </div>
              <input
                type="checkbox"
                checked={formState.features.enableSoundEffects}
                onChange={e => handleChange('features', 'enableSoundEffects', e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Live Telemetry & DirectQuery Streams</span>
                <span className="text-slate-400">Continuous background polling for hardware scanner feeds and order updates</span>
              </div>
              <input
                type="checkbox"
                checked={formState.features.enableLiveTelemetry}
                onChange={e => handleChange('features', 'enableLiveTelemetry', e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Section 5: Power BI */}
      {activeTab === 'powerbi' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Microsoft Power BI Embedded Integration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure the live Power BI secure embed URL. The portal renders live reports from Microsoft Fabric & Azure AD directly into the dashboards.
          </p>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Secure Power BI / Fabric Embed URL</label>
              <input
                type="url"
                value={formState.powerBi.defaultEmbedUrl}
                onChange={e => handleChange('powerBi', 'defaultEmbedUrl', e.target.value)}
                placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Workspace ID</label>
                <input
                  type="text"
                  value={formState.powerBi.workspaceId}
                  onChange={e => handleChange('powerBi', 'workspaceId', e.target.value)}
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dataset PBIX Name</label>
                <input
                  type="text"
                  value={formState.powerBi.datasetName}
                  onChange={e => handleChange('powerBi', 'datasetName', e.target.value)}
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Dental Services & Odontogram Matrix */}
      {activeTab === 'dental' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090e18] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-sky-500" />
                <span>Dental Services & Odontogram Procedure Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure which restoration and surgical tools are enabled for each clinical CAD/CAM service. Updates apply immediately across all Teeth Charts.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(SERVICE_METADATA).map(([srvKey, srvMeta]) => {
              const activeProcs = formState.serviceProcedures?.[srvKey] || [];
              return (
                <div
                  key={srvKey}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        {srvMeta.code}
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {srvMeta.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {srvMeta.nameAr} • {activeProcs.length} of {RESTORATION_TYPES.length} procedures enabled
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSetAllProceduresForService(srvKey, true)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                      >
                        Enable All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllProceduresForService(srvKey, false)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        Disable All
                      </button>
                    </div>
                  </div>

                  {/* Procedures Checkbox Pills */}
                  <div className="flex flex-wrap gap-2">
                    {RESTORATION_TYPES.map(proc => {
                      const isEnabled = activeProcs.includes(proc.id);
                      return (
                        <button
                          key={proc.id}
                          type="button"
                          onClick={() => handleToggleProcedure(srvKey, proc.id)}
                          style={{
                            borderColor: isEnabled ? proc.color : undefined
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isEnabled
                              ? `${proc.bgColor} ${proc.textColor} ring-1 ring-current shadow-xs`
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: proc.color }}
                          />
                          <span>{proc.label}</span>
                          {isEnabled && <Check size={11} className="ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
