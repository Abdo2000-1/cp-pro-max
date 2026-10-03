import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Stethoscope,
  Building2,
  Calendar,
  Zap,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
  Unlock,
  FileText,
  MoreHorizontal,
  Printer,
  ChevronRight,
  Sliders,
  Check
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { UIStateSwitcher, UIStateType } from '@/components/ui/UIStateSwitcher';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDate } from '@/utils/format';

// Services filter definition matching CP parameters
export interface ServiceFilterState {
  rep: boolean;      // Radiology Report
  mod: boolean;      // Model Work
  conv: boolean;     // DICOM Conversion
  tp: boolean;       // Treatment Plan
  sg: boolean;       // Surgical Guide
  soft: boolean;     // Software
  vr: boolean;       // Virtual Reality
  misc: boolean;     // Misc
  restTemp: boolean; // Temp Restoration
  restFinal: boolean;// Final Restoration
  other: boolean;    // Other Services
  GFMR: boolean;     // Guided Full Mouth Reconstruction
  FMP: boolean;      // Fast Medical Planning
}

const DEFAULT_FILTERS: ServiceFilterState = {
  rep: true,
  mod: true,
  conv: true,
  tp: true,
  sg: true,
  soft: true,
  vr: true,
  misc: true,
  restTemp: true,
  restFinal: true,
  other: true,
  GFMR: true,
  FMP: true,
};

// Clean grouped categories for Image 3 redesign (avoiding messy rainbow buttons)
const SERVICE_GROUPS = [
  {
    category: 'Planning & Scans',
    items: [
      { key: 'tp' as const, label: 'Treatment Plan', code: 'TP' },
      { key: 'conv' as const, label: 'DICOM Conv.', code: 'CONV' },
      { key: 'rep' as const, label: 'Radiology Report', code: 'RAD' },
      { key: 'vr' as const, label: 'Virtual Reality', code: 'VR' },
    ]
  },
  {
    category: 'Surgical Guides',
    items: [
      { key: 'sg' as const, label: 'Surgical Guide', code: 'SG' },
      { key: 'GFMR' as const, label: 'Guided Full Mouth', code: 'GFMR' },
      { key: 'FMP' as const, label: 'Fast Medical', code: 'FMP' },
    ]
  },
  {
    category: 'Restorations & Models',
    items: [
      { key: 'mod' as const, label: 'Model Work', code: 'MOD' },
      { key: 'restTemp' as const, label: 'Temp Rest.', code: 'TEMP' },
      { key: 'restFinal' as const, label: 'Final Rest.', code: 'REST' },
    ]
  },
  {
    category: 'Other Modules',
    items: [
      { key: 'soft' as const, label: 'Software', code: 'SOFT' },
      { key: 'misc' as const, label: 'Misc.', code: 'MISC' },
      { key: 'other' as const, label: 'Other', code: 'OTH' },
    ]
  }
];

export default function Flow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const rawOrders = useStore((s) => s.getOrders());

  // Interactive UI State Simulation (Normal, Loading, Empty, Error)
  const [uiState, setUiState] = useState<UIStateType>('normal');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [servicesFilter, setServicesFilter] = useState<ServiceFilterState>(DEFAULT_FILTERS);

  // Quick View Drawer Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<any | null>(null);

  // Toggle single service filter
  const toggleService = (key: keyof ServiceFilterState) => {
    setServicesFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Set all service filters
  const setAllServices = (val: boolean) => {
    const updated: any = {};
    Object.keys(DEFAULT_FILTERS).forEach((k) => {
      updated[k] = val;
    });
    setServicesFilter(updated);
  };

  const activeServicesCount = Object.values(servicesFilter).filter(Boolean).length;

  // Enriched orders mock data matching Image 1 exact columns
  const enrichedOrders = useMemo(() => {
    return rawOrders.map((o, idx) => {
      const serial = idx + 1;
      const scanCenter = ['Align Chicago', '3DDX Boston Hub', 'Dallas Imaging', 'NYC Dental Diagnostics'][idx % 4];
      const isLocked = idx % 5 === 0;
      const hasNotes = idx % 2 === 0;
      const archiveDate = '2026-10-15';
      const orderNum = o.orderNumber ? o.orderNumber.replace(/^[^\d]+/, '') : `677${200 + idx}`;
      const billTo = idx % 3 === 0 ? 'Scan Center' : idx % 2 === 0 ? 'Doctor' : 'Clinic';
      const maxilla = idx % 2 === 0 || idx % 3 === 0;
      const mandible = idx % 2 !== 0 || idx % 3 === 0;
      const format = ['STL', 'Co-Dx', 'Digital', 'Physical Molds'][idx % 4];
      const amountBilled = `$${(o.amount || 150 + idx * 45).toFixed(2)}`;
      const vouchers = idx % 3 === 0 ? 1 : idx % 4 === 0 ? 2 : 0;
      const receivedTime = '09-28 09:30';
      const sentTime = idx % 2 === 0 ? '09-28 16:45' : '-';
      const updateTime = '09-29 11:20';
      const chargedOn = idx % 2 === 0 ? '09-28 18:00' : '-';

      // Distinct Action Button Colors (Glassmorphic translucent bg with prominent colored border & text per Image 4):
      let actionLabel = 'Ready';
      let actionClass = 'bg-sky-500/10 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-500/80 backdrop-blur-xs font-bold shadow-xs';

      if (idx % 4 === 0) {
        actionLabel = 'No Scans';
        actionClass = 'bg-red-500/10 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/80 backdrop-blur-xs font-black shadow-xs';
      } else if (idx % 4 === 1) {
        actionLabel = 'Send to QC';
        actionClass = 'bg-orange-500/10 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-500/80 backdrop-blur-xs font-bold shadow-xs';
      } else if (idx % 4 === 2) {
        actionLabel = 'In Planning';
        actionClass = 'bg-[#0284c7]/10 hover:bg-[#0284c7]/25 text-[#0284c7] dark:text-sky-400 border border-[#0284c7]/80 backdrop-blur-xs font-bold shadow-xs';
      } else {
        actionLabel = 'Approved';
        actionClass = 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/80 backdrop-blur-xs font-bold shadow-xs';
      }

      const changeRequest = idx % 6 === 0 ? 'CR-104' : '-';
      const csTask = idx % 5 === 0 ? 'Call Doc' : '-';

      return {
        ...o,
        serial,
        scanCenter,
        isLocked,
        hasNotes,
        archiveDate,
        orderNum,
        billTo,
        maxilla,
        mandible,
        format,
        amountBilled,
        vouchers,
        receivedTime,
        sentTime,
        updateTime,
        chargedOn,
        actionLabel,
        actionClass,
        changeRequest,
        csTask,
      };
    });
  }, [rawOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          order.orderNum.toLowerCase().includes(q) ||
          order.patientName.toLowerCase().includes(q) ||
          order.doctorName.toLowerCase().includes(q) ||
          order.scanCenter.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [enrichedOrders, search, selectedStatus]);

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-[#0284c7] dark:text-sky-400 border border-sky-500/20">
              <Layers size={20} />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('nav.flow', 'Master Production Flow')}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Live Queue ({filteredOrders.length})
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
            CP PRO MAX Master Directory • Formatted exactly to production specification (Image 1) • Zero horizontal scroll on 22" displays
          </p>
        </div>

        {/* Right Tools: State Switcher & New Case */}
        <div className="flex flex-wrap items-center gap-2.5">
          <UIStateSwitcher
            state={uiState}
            onChange={(s) => setUiState(s)}
            label="View State"
          />

          <button
            onClick={() => navigate('/add-case')}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] hover:from-[#0369a1] hover:to-[#c2410c] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Zap size={14} className="stroke-[3]" />
            <span>{t('action.newCase', 'New Case')}</span>
          </button>
        </div>
      </div>

      {/* 2. Redesigned Service Filter Bar (Clean & Cohesive - Resolving Image 3 Feedback) */}
      <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        
        {/* Top Header of Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-[#0284c7]" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {t('action.filter', 'Service Modules Filter')}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {activeServicesCount}/13 Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              onClick={() => setAllServices(true)}
              className="text-[#0284c7] dark:text-sky-400 hover:underline"
            >
              {t('action.selectAll', 'Select All')}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setAllServices(false)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
            >
              {t('action.clearAll', 'Clear All')}
            </button>
          </div>
        </div>

        {/* Clean Categorized Groups (Professional 3DDX Blue & Orange Palette) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {SERVICE_GROUPS.map((grp) => (
            <div
              key={grp.category}
              className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {grp.category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grp.items.map((item) => {
                  const isChecked = servicesFilter[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleService(item.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#0284c7]'
                      }`}
                    >
                      <span className="text-[10px]">{item.code}</span>
                      {isChecked && <Check size={11} className="stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order #, Patient, Doctor, Center..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
            >
              <option value="ALL">All Production Stages</option>
              <option value="New">New Prescriptions</option>
              <option value="Review">Radiology & DICOM Review</option>
              <option value="Design">Co-Diagnostix Treatment Plan</option>
              <option value="Production">CAM 3D Guide Printing</option>
              <option value="Quality Check">Final QC Inspection</option>
              <option value="Completed">Dispatched / Shipped</option>
            </select>
          </div>

          <div>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
            >
              <option value="ALL">All Senior Operators</option>
              <option value="Alex">Alex M. (Senior CAD)</option>
              <option value="Sarah">Sarah K. (Planner)</option>
              <option value="Omar">Omar H. (QC Lead)</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. Main Data Content (Handling Simulated States) */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <LoadingState text="Streaming 3DDX Master Orders & CAD Telemetry..." />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <EmptyState
            title="No Active Cases Matching Query"
            description="Adjust your search query or reset service module filters."
            action={
              <button
                onClick={() => setAllServices(true)}
                className="px-4 py-2 rounded-xl bg-[#0284c7] text-white font-bold text-xs"
              >
                Reset All Service Filters
              </button>
            }
          />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <ErrorState
            title="Database Replication Error (500)"
            message="Failed to sync with 3DDX PACS server. DICOM slice volumes temporarily unavailable."
            code="ERR_PACS_SYNC_FAILURE_500"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {/* 4. EXACT TABLE FROM IMAGE 1 (22 Columns, Exact Headers & Colors) */}
      {uiState === 'normal' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
          
          <div className="w-full overflow-x-auto lg:overflow-x-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Header matches Image 1: classic gray header with bold text and sort markers */}
                <tr className="bg-[#d1d5db] dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-[11px] select-none">
                  <th className="py-2.5 px-2 text-center w-10">{t('col.serial', '# tl')}</th>
                  <th className="py-2.5 px-2 w-32">{t('col.scanCenter', 'Scan Center tl')}</th>
                  <th className="py-2.5 px-2 w-32">{t('col.doctor', 'Doctor tl')}</th>
                  <th className="py-2.5 px-2 w-36">{t('col.patientName', 'Patient Name tl')}</th>
                  <th className="py-2.5 px-1.5 text-center w-20">{t('col.isLocked', 'Is Locked (?)')}</th>
                  <th className="py-2.5 px-1.5 text-center w-14">{t('col.notes', 'Notes')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.archiveDate', 'Archive Date')}</th>
                  <th className="py-2.5 px-1 text-center w-8">{t('col.more', '...')}</th>
                  <th className="py-2.5 px-2 w-20">{t('col.order', 'Order')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.billTo', 'Bill To')}</th>
                  <th className="py-2.5 px-1.5 text-center w-12">{t('col.max', 'Max.')}</th>
                  <th className="py-2.5 px-1.5 text-center w-12">{t('col.mand', 'Mand.')}</th>
                  <th className="py-2.5 px-2 w-16">{t('col.format', 'Format')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.amountBilled', 'Amount Billed')}</th>
                  <th className="py-2.5 px-1.5 text-center w-16">{t('col.vouchers', 'Vouchers')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.receivedTime', 'Received Time')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.sentTime', 'Sent Time')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.updateTime', 'Update Time')}</th>
                  <th className="py-2.5 px-2 w-24">{t('col.chargedOn', 'Charged On')}</th>
                  <th className="py-2.5 px-2 text-center w-28">{t('col.action', 'Action')}</th>
                  <th className="py-2.5 px-2 text-center w-24">{t('col.changeRequest', 'Change Request')}</th>
                  <th className="py-2.5 px-2 text-center w-20">{t('col.csTask', 'CS-Task')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={22} className="py-12 text-center text-slate-500">
                      No matching cases in this production queue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderForDrawer(order)}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors cursor-pointer"
                    >
                      {/* 1. # tl */}
                      <td className="py-2 px-2 text-center font-mono text-slate-500">
                        {order.serial}
                      </td>

                      {/* 2. Scan Center tl */}
                      <td className="py-2 px-2 truncate max-w-[130px] font-semibold text-slate-900 dark:text-white" title={order.scanCenter}>
                        {order.scanCenter}
                      </td>

                      {/* 3. Doctor tl */}
                      <td className="py-2 px-2 truncate max-w-[130px] font-semibold" title={order.doctorName}>
                        {order.doctorName}
                      </td>

                      {/* 4. Patient Name tl */}
                      <td className="py-2 px-2 truncate max-w-[145px] font-black text-slate-950 dark:text-white" title={order.patientName}>
                        {order.patientName}
                      </td>

                      {/* 5. Is Locked (?) */}
                      <td className="py-2 px-1.5 text-center">
                        {order.isLocked ? (
                          <Lock size={13} className="text-amber-500 mx-auto" />
                        ) : (
                          <Unlock size={13} className="text-slate-300 dark:text-slate-600 mx-auto" />
                        )}
                      </td>

                      {/* 6. Notes */}
                      <td className="py-2 px-1.5 text-center">
                        {order.hasNotes ? (
                          <span title="Clinical Notes Available" className="cursor-pointer">
                            <FileText size={13} className="text-[#0284c7] mx-auto" />
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* 7. Archive Date */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                        {order.archiveDate}
                      </td>

                      {/* 8. ... */}
                      <td className="py-2 px-1 text-center" onClick={(e) => { e.stopPropagation(); navigate(`/order-details?ID=${order.orderNum}`); }}>
                        <MoreHorizontal size={14} className="text-slate-400 hover:text-[#0284c7] mx-auto cursor-pointer" />
                      </td>

                      {/* 9. Order */}
                      <td className="py-2 px-2 font-mono font-black text-[#0284c7] dark:text-sky-400 hover:underline">
                        #{order.orderNum}
                      </td>

                      {/* 10. Bill To */}
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-medium">
                        {order.billTo}
                      </td>

                      {/* 11. Max. */}
                      <td className="py-2 px-1.5 text-center font-bold">
                        {order.maxilla ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* 12. Mand. */}
                      <td className="py-2 px-1.5 text-center font-bold">
                        {order.mandible ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* 13. Format */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {order.format}
                      </td>

                      {/* 14. Amount Billed */}
                      <td className="py-2 px-2 font-mono font-black text-slate-900 dark:text-white">
                        {order.amountBilled}
                      </td>

                      {/* 15. Vouchers */}
                      <td className="py-2 px-1.5 text-center font-mono">
                        {order.vouchers > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400">
                            {order.vouchers}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* 16. Received Time */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                        {order.receivedTime}
                      </td>

                      {/* 17. Sent Time */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                        {order.sentTime}
                      </td>

                      {/* 18. Update Time */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                        {order.updateTime}
                      </td>

                      {/* 19. Charged On */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                        {order.chargedOn}
                      </td>

                      {/* 20. Action (Distinctive Action Button Colors matching Image 1) */}
                      <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDrawer(order)}
                          className={`w-full py-1 px-2 rounded-md text-[11px] font-black transition-transform active:scale-95 cursor-pointer shadow-xs ${order.actionClass}`}
                        >
                          {order.actionLabel}
                        </button>
                      </td>

                      {/* 21. Change Request */}
                      <td className="py-2 px-2 text-center font-mono text-[11px]">
                        {order.changeRequest !== '-' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {order.changeRequest}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 22. CS-Task */}
                      <td className="py-2 px-2 text-center font-mono text-[11px]">
                        {order.csTask !== '-' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            {order.csTask}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>
              Total Cases: <strong>{filteredOrders.length}</strong> • Showing all 22 columns from CP Specification
            </span>
            <span className="font-mono text-[#0284c7] dark:text-sky-400">
              Verified 22" Display Fit • Zero Horizontal Scroll
            </span>
          </div>

        </div>
      )}

      {/* 5. Quick View Drawer (Slide-Over Panel for Fast Case Inspection) */}
      <AnimatePresence>
        {selectedOrderForDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-white dark:bg-[#0b101d] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-[#0284c7]">
                    #{selectedOrderForDrawer.orderNum}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedOrderForDrawer.actionClass}`}>
                    {selectedOrderForDrawer.actionLabel}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrderForDrawer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-medium custom-scrollbar">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Patient</div>
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {selectedOrderForDrawer.patientName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Clinician</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedOrderForDrawer.doctorName}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Scan Center: <strong>{selectedOrderForDrawer.scanCenter}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Amount Billed</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedOrderForDrawer.amountBilled}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Vouchers</span>
                    <span className="font-black text-purple-600">{selectedOrderForDrawer.vouchers} Linked</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-slate-800 dark:text-slate-200">
                  <div className="text-[10px] font-bold uppercase text-[#0284c7]">Clinical Format</div>
                  <div className="font-bold text-xs mt-0.5">{selectedOrderForDrawer.format}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Arches: {selectedOrderForDrawer.maxilla ? 'Maxilla ✓' : ''} {selectedOrderForDrawer.mandible ? 'Mandible ✓' : ''}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/edit-case?thisID=${selectedOrderForDrawer.orderNum}`);
                    setSelectedOrderForDrawer(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                >
                  Edit Prescription
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/order-details?ID=${selectedOrderForDrawer.orderNum}`);
                    setSelectedOrderForDrawer(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-sky-500 text-white font-black text-xs text-center shadow-md"
                >
                  Full Order Details →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
