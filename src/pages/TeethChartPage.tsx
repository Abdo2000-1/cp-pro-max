import React, { useState } from 'react';
import { 
  TeethChart, 
  type DentalServiceId, 
  SERVICE_METADATA 
} from '@/components/ui/TeethChart';
import { Sparkles, Layers, CheckCircle2 } from 'lucide-react';

export default function TeethChartPage() {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([14, 15, 16]);
  const [restorations, setRestorations] = useState<Record<number, string>>({
    14: 'implant',
    15: 'crown',
    16: 'crown'
  });
  const [activeService, setActiveService] = useState<DentalServiceId | 'all'>('sg');

  const servicesList: { id: DentalServiceId | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Procedures (17)', icon: '🌟' },
    { id: 'sg', label: SERVICE_METADATA.sg.name, icon: SERVICE_METADATA.sg.icon },
    { id: 'tp', label: SERVICE_METADATA.tp.name, icon: SERVICE_METADATA.tp.icon },
    { id: 'restFinal', label: SERVICE_METADATA.restFinal.name, icon: SERVICE_METADATA.restFinal.icon },
    { id: 'restTemp', label: SERVICE_METADATA.restTemp.name, icon: SERVICE_METADATA.restTemp.icon },
    { id: 'ortho', label: SERVICE_METADATA.ortho.name, icon: SERVICE_METADATA.ortho.icon },
    { id: 'conv', label: SERVICE_METADATA.conv.name, icon: SERVICE_METADATA.conv.icon },
    { id: 'rep', label: SERVICE_METADATA.rep.name, icon: SERVICE_METADATA.rep.icon },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="w-full max-w-5xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise 3DDX Clinical Odontogram v2.5.0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Anatomical Dental Teeth Chart
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 mt-1 max-w-2xl">
              Photorealistic dental anatomy, dynamic service-driven procedure filtering, dual arch quick select, and independent per-tooth clinical history.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Active Service Mapping</span>
          </div>
        </div>

        {/* Live Service Switcher Pills */}
        <div className="mt-5 pt-4 border-t border-white/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200 block mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Filter by Prescribed Dental Service:
          </span>
          <div className="flex flex-wrap gap-2">
            {servicesList.map(srv => {
              const isActive = activeService === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setActiveService(srv.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md scale-105 ring-2 ring-white/50 font-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <span>{srv.icon}</span>
                  <span>{srv.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Teeth Chart Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#0b101d] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-lg shadow-cyan-950/5">
        <TeethChart
          selected={selectedTeeth}
          toothRestorations={restorations}
          activeServices={activeService === 'all' ? undefined : [activeService]}
          onSelectionChange={(newSelected, newRestorations) => {
            setSelectedTeeth(newSelected);
            setRestorations(newRestorations);
          }}
          showToolbar={true}
        />
      </div>
    </div>
  );
}
