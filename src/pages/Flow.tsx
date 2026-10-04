import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
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
  Check,
  Wrench,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  ChevronUp,
  User,
  CreditCard,
  Plus,
  ShoppingCart,
  Table,
  LayoutGrid
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  MASTER_WORKFLOW_ORDERS,
  MasterWorkflowOrder,
  SubServiceItem
} from '@/data/flowMockData';

// Web Audio API helper for smooth, light swoosh sound effect on expand/collapse
function playSwooshSound(isExpanding: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (isExpanding) {
      // Gentle rapid upward swoosh (220Hz -> 540Hz in 50ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else {
      // Gentle rapid downward swoosh (500Hz -> 200Hz in 40ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Audio policy fallback
  }
}

// Source badge styling rules matching official specification:
// Sender Tools (Vatech, Planmeca, Jmorita, Prexion) -> Black badge
// CaseXchange -> White badge
// Via CP -> Purple badge
// Via Connect -> Magenta badge
export const getSourceBadgeStyle = (source: string) => {
  const s = (source || '').toLowerCase();
  if (
    s.includes('vatech') ||
    s.includes('planmeca') ||
    s.includes('jmorita') ||
    s.includes('prexion') ||
    s.includes('sender')
  ) {
    return 'bg-black text-white border border-slate-700 shadow-2xs font-extrabold';
  }
  if (s.includes('casexchange') || s.includes('xchange')) {
    return 'bg-white text-slate-900 border border-slate-300 dark:border-slate-600 shadow-2xs font-black';
  }
  if (s.includes('cp')) {
    return 'bg-purple-600 text-white shadow-2xs font-extrabold';
  }
  if (s.includes('connect')) {
    return 'bg-fuchsia-600 text-white shadow-2xs font-extrabold';
  }
  return 'bg-slate-700 text-white font-extrabold';
};

// Workflow status badge renderer matching official clinical workflow matrix:
// Both scans: IO/TP IN PROGRESS (Yellow), SG REVIEWING ORDER (Blue)
// No CBCT: TP NO SCANS (Red Alert Box), IO PENDING (Orange)
// No STL: TP IN PROGRESS (Yellow), IO NO SCANS (Red Alert Box)
// Sleeve/Guide design & printing: IN PROGRESS (Yellow)
export const renderActionStatusBadge = (
  label: string,
  isAlert: boolean,
  buttonText?: string,
  onAction?: (e: React.MouseEvent) => void
) => {
  if (isAlert) {
    return (
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 backdrop-blur-md text-white px-1.5 py-1 rounded-lg font-black text-[9px] leading-tight border border-red-400 shadow-xs shadow-red-500/25">
        <div>{label || 'No Scans'}</div>
        {buttonText && (
          <button
            type="button"
            onClick={onAction}
            className="mt-0.5 px-1 py-0.5 rounded bg-white/20 hover:bg-white/30 backdrop-blur-xs border border-white/40 text-amber-100 hover:text-white cursor-pointer block mx-auto text-[8px] font-bold transition-all shadow-2xs"
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  }

  const l = (label || '').toLowerCase();
  if (
    l.includes('in progress') ||
    l.includes('sleeve design') ||
    l.includes('guide design') ||
    l.includes('printing') ||
    l.includes('planning') ||
    l.includes('production')
  ) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-black text-[9px] bg-amber-300 dark:bg-amber-400 text-amber-950 border border-amber-400 shadow-2xs truncate max-w-full">
        {label}
      </span>
    );
  }

  if (l.includes('pending')) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-black text-[9px] bg-amber-500 text-white border border-amber-600 shadow-2xs truncate max-w-full">
        {label}
      </span>
    );
  }

  if (l.includes('review') || l.includes('reviewing') || l.includes('waiting confirmation')) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-black text-[9px] bg-sky-500 text-white border border-sky-600 shadow-2xs truncate max-w-full">
        {label}
      </span>
    );
  }

  if (
    l.includes('signed') ||
    l.includes('dispatched') ||
    l.includes('shipped') ||
    l.includes('complete') ||
    l.includes('delivered') ||
    l.includes('approved')
  ) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-black text-[9px] bg-emerald-500 text-white border border-emerald-600 shadow-2xs truncate max-w-full">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 truncate max-w-full">
      {label}
    </span>
  );
};

export interface ServiceFilterState {
  rep: boolean;
  mod: boolean;
  conv: boolean;
  tp: boolean;
  sg: boolean;
  soft: boolean;
  vr: boolean;
  misc: boolean;
  restTemp: boolean;
  restFinal: boolean;
  other: boolean;
  GFMR: boolean;
  FMP: boolean;
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

  // UI state (normal, loading, empty, error)
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [servicesFilter, setServicesFilter] = useState<ServiceFilterState>(DEFAULT_FILTERS);
  const [viewFilter, setViewFilter] = useState<'all' | 'multi-tp' | 'action-required'>('all');

  // Closed / Collapsed by default as requested: "وعايز مقفول بالافتراضي"
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Quick View Drawer Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<any | null>(null);
  const [subOrderViewMode, setSubOrderViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Toggle single order expansion with swoosh sound
  const toggleOrderExpand = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(orderId);
      if (isExpanding) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      playSwooshSound(isExpanding);
      return next;
    });
  };

  // Expand all or collapse all rows with sound
  const handleToggleExpandAll = () => {
    const isExpandingAll = expandedOrders.size !== filteredOrders.length;
    playSwooshSound(isExpandingAll);
    if (isExpandingAll) {
      setExpandedOrders(new Set(filteredOrders.map((o) => o.id)));
    } else {
      setExpandedOrders(new Set());
    }
  };

  const toggleService = (key: keyof ServiceFilterState) => {
    setServicesFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllServices = (val: boolean) => {
    const updated: any = {};
    Object.keys(DEFAULT_FILTERS).forEach((k) => {
      updated[k] = val;
    });
    setServicesFilter(updated);
  };

  const activeServicesCount = Object.values(servicesFilter).filter(Boolean).length;

  // Use complete 36-case dataset representing all sender tools, CaseXchange, CP, Connect, and clinical workflows
  const enrichedOrders: MasterWorkflowOrder[] = MASTER_WORKFLOW_ORDERS;

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewFilter, servicesFilter]);

  // Filtered orders according to search and view modes
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          order.orderNum.toLowerCase().includes(q) ||
          order.patientName.toLowerCase().includes(q) ||
          order.doctorName.toLowerCase().includes(q) ||
          order.scanCenter.toLowerCase().includes(q) ||
          order.services.some(s => s.title.toLowerCase().includes(q) || s.billTo.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (viewFilter === 'multi-tp') {
        const tpCount = order.services.filter(s => s.typeCode === 'TP').length;
        if (tpCount < 2) return false;
      } else if (viewFilter === 'action-required') {
        const hasAlert = order.services.some(s => s.hasActionAlert);
        if (!hasAlert) return false;
      }

      return true;
    });
  }, [enrichedOrders, search, viewFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Top Bar */}
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
            Exact 22 Columns from Specification • Collapsed by Default with Smooth Slide-Down & Sound Effect • Multi-TP Support
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* 2. Redesigned Service Filter Bar */}
      <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
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
              className="text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
            >
              {t('action.selectAll', 'Select All')}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setAllServices(false)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
            >
              {t('action.clearAll', 'Clear All')}
            </button>
          </div>
        </div>

        {/* Categorized Filter Buttons */}
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

        {/* Search & Architecture Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Patient, Doctor, ID, or Scan Center..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setViewFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                viewFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Orders
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('multi-tp')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                viewFilter === 'multi-tp'
                  ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-[#0284c7] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30'
              }`}
            >
              <span>Multi-TP Cases</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">2+ TP</span>
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('action-required')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                viewFilter === 'action-required'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Needs Scans (Action)</span>
            </button>
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
                onClick={() => { setAllServices(true); setViewFilter('all'); setSearch(''); }}
                className="px-4 py-2 rounded-xl bg-[#0284c7] text-white font-bold text-xs cursor-pointer"
              >
                Reset All Filters
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

      {/* 4. EXACT 22 COLUMNS TABLE WITH STATIONARY ROW, CONCISE-TO-DETAILED ACCORDION & ZERO HORIZONTAL SCROLLING */}
      {uiState === 'normal' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
          
          {/* Table Header Bar with Expand All Toggle & View Mode */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0284c7] text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {expandedOrders.size === filteredOrders.length ? (
                  <>
                    <ChevronUp size={14} className="text-[#0284c7]" />
                    <span>Collapse All Cases</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="text-[#0284c7]" />
                    <span>Expand All Cases ({filteredOrders.length})</span>
                  </>
                )}
              </button>
              <span className="text-slate-500 font-normal hidden md:inline text-[11px]">
                Click row or ▶ arrow to expand details (Stationary master row • Smooth slide-down & slide-up)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSubOrderViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    subOrderViewMode === 'matrix'
                      ? 'bg-white dark:bg-[#0284c7] text-[#0284c7] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="22-Column Specification Matrix Table"
                >
                  <Table size={12} />
                  <span>22-Col Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubOrderViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    subOrderViewMode === 'cards'
                      ? 'bg-white dark:bg-[#0284c7] text-[#0284c7] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="22-Field Comprehensive Cards"
                >
                  <LayoutGrid size={12} />
                  <span>22-Field Cards</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                All 22 Columns • 0 Horizontal Scroll
              </span>
            </div>
          </div>

          {/* Table Container - Strict overflow-hidden with table-fixed to guarantee ZERO horizontal scrollbar */}
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs border-collapse table-fixed select-none">
              <thead>
                {/* EXACT 22 HEADERS FROM SPECIFICATION - 100% SUMMED PERCENTAGE WIDTHS */}
                <tr className="bg-[#d1d5db] dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-[10.5px]">
                  <th className="py-2.5 px-1.5 text-center w-[4.5%]"># tl</th>
                  <th className="py-2.5 px-1.5 w-[6.5%]">Scan Center</th>
                  <th className="py-2.5 px-1.5 w-[6.5%]">Doctor</th>
                  <th className="py-2.5 px-1.5 w-[6.5%]">Patient</th>
                  <th className="py-2.5 px-1 text-center w-[3.5%]">Lock</th>
                  <th className="py-2.5 px-1 text-center w-[3.5%]">Notes</th>
                  <th className="py-2.5 px-1 text-center w-[4.5%]">Archive</th>
                  <th className="py-2.5 px-0.5 text-center w-[2%]">...</th>
                  <th className="py-2.5 px-2 w-[9%]">Order</th>
                  <th className="py-2.5 px-1.5 w-[6%]">Bill To</th>
                  <th className="py-2.5 px-1 text-center w-[3%]">Max.</th>
                  <th className="py-2.5 px-1 text-center w-[3%]">Mand.</th>
                  <th className="py-2.5 px-1 text-center w-[4%]">Format</th>
                  <th className="py-2.5 px-1.5 text-right w-[4.5%]">Amount</th>
                  <th className="py-2.5 px-1 text-center w-[3%]">Vouch.</th>
                  <th className="py-2.5 px-1.5 w-[6%]">Received</th>
                  <th className="py-2.5 px-1 text-center w-[4.5%]">Sent</th>
                  <th className="py-2.5 px-1 text-center w-[4.5%]">Update</th>
                  <th className="py-2.5 px-1 text-center w-[4.5%]">Charged</th>
                  <th className="py-2.5 px-1.5 text-center w-[7.5%]">Action</th>
                  <th className="py-2.5 px-1 text-center w-[3.5%]">CR</th>
                  <th className="py-2.5 px-1 text-center w-[5%]">CS-Task</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={22} className="py-12 text-center text-slate-500 font-bold">
                      No matching cases in this production queue.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const tpCount = order.services.filter((s) => s.typeCode === 'TP').length;
                    const hasActionAlert = order.services.some((s) => s.hasActionAlert);
                    const totalCaseAmount = order.services.reduce((acc, s) => acc + s.amount, 0);
                    const primaryService = order.services[0];
                    const alertService = order.services.find((s) => s.hasActionAlert);

                    return (
                      <React.Fragment key={order.id}>
                        {/* 1. MASTER ORDER ROW (STATIONARY: ALL 22 COLUMNS PRESENT WITH CONCISE SUMMARY BEFORE EXPANDING) */}
                        <tr
                          onClick={() => toggleOrderExpand(order.id)}
                          className={`group transition-colors cursor-pointer font-medium border-b border-slate-200 dark:border-slate-800 ${
                            isExpanded
                              ? 'bg-sky-50/80 dark:bg-sky-950/30 border-l-4 border-l-[#0284c7]'
                              : 'hover:bg-slate-50/90 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          {/* 1. # tl */}
                          <td className="py-2.5 px-1.5 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <span
                                onClick={(e) => toggleOrderExpand(order.id, e)}
                                className={`p-0.5 rounded transition-transform duration-200 cursor-pointer ${
                                  isExpanded
                                    ? 'text-[#0284c7] rotate-90'
                                    : 'text-slate-400 group-hover:text-[#0284c7]'
                                }`}
                                title={isExpanded ? 'Collapse case' : 'Expand full 22-column breakdown'}
                              >
                                <ChevronRight size={14} className="stroke-[3]" />
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="font-mono font-black text-amber-600 dark:text-amber-500 text-[11px]">
                                  {order.orderNum}
                                </span>
                                <span className={`inline-block px-1 py-0.5 rounded text-[8px] tracking-wider uppercase ${getSourceBadgeStyle(order.source)}`}>
                                  {order.source}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Scan Center tl */}
                          <td className="py-2.5 px-1.5 font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]" title={order.scanCenter}>
                            {order.scanCenter}
                          </td>

                          {/* 3. Doctor tl */}
                          <td className="py-2.5 px-1.5 text-[11px]">
                            <div className="font-bold text-[#ea580c] dark:text-orange-400 truncate" title={order.doctorName}>
                              {order.doctorName}
                            </div>
                            <div className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold truncate">
                              {order.doctorSub}
                            </div>
                          </td>

                          {/* 4. Patient Name tl */}
                          <td className="py-2.5 px-1.5 text-[11px]">
                            <div className="font-bold text-slate-900 dark:text-white truncate" title={order.patientName}>
                              {order.patientName}
                            </div>
                            <div className="text-[9px] text-amber-600 dark:text-amber-500 font-bold truncate">
                              {order.patientSub}
                            </div>
                          </td>

                          {/* 5. Is Locked (?) */}
                          <td className="py-2.5 px-1 text-center">
                            <div className="flex flex-col items-center">
                              {order.isLocked ? (
                                <div className="w-3.5 h-3.5 rotate-45 bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                  <span className="-rotate-45">?</span>
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rotate-45 bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                  <span className="-rotate-45">?</span>
                                </div>
                              )}
                              <span className="text-[8px] text-slate-500 font-bold mt-0.5">
                                {order.isLocked ? 'Lock' : 'Sales'}
                              </span>
                            </div>
                          </td>

                          {/* 6. Notes */}
                          <td className="py-2.5 px-1 text-center text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                            <span className="underline cursor-pointer truncate block" title={order.notes}>
                              {order.notes}
                            </span>
                          </td>

                          {/* 7. Archive Date */}
                          <td className="py-2.5 px-1 text-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                            <div className="flex items-center justify-center gap-0.5">
                              <span>{order.archiveDate}</span>
                              <ShoppingCart size={10} className="text-emerald-500 inline" />
                            </div>
                          </td>

                          {/* 8. ... */}
                          <td className="py-2.5 px-0.5 text-center" onClick={(e) => { e.stopPropagation(); navigate(`/order-details?ID=${order.orderNum}`); }}>
                            <MoreHorizontal size={13} className="text-slate-400 hover:text-[#0284c7] mx-auto cursor-pointer" />
                          </td>

                          {/* 9. Order (Concise summary pills before expanding) */}
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                {order.services.length} Srv. ({tpCount >= 2 ? `${tpCount}x TP` : '1x TP'})
                              </span>
                              {!isExpanded && (
                                <span className="text-[9px] text-[#0284c7] font-bold">
                                  ▶ Expand
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 10. Bill To */}
                          <td className="py-2.5 px-1.5 text-slate-700 dark:text-slate-300 text-[10.5px] truncate" title={primaryService?.billTo}>
                            {primaryService?.billTo}
                          </td>

                          {/* 11. Max. */}
                          <td className="py-2.5 px-1 text-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.maxilla || '-'}
                          </td>

                          {/* 12. Mand. */}
                          <td className="py-2.5 px-1 text-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.mandible || '-'}
                          </td>

                          {/* 13. Format */}
                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                            {primaryService?.format || 'STL'}
                          </td>

                          {/* 14. Amount Billed */}
                          <td className="py-2.5 px-1.5 text-right font-mono font-black text-slate-900 dark:text-white text-[11px]">
                            ${totalCaseAmount}.00
                          </td>

                          {/* 15. Vouchers */}
                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-500">
                            {primaryService?.vouchers || '0'}
                          </td>

                          {/* 16. Received Time */}
                          <td className="py-2.5 px-1.5 font-mono text-[9.5px] text-slate-600 dark:text-slate-400 truncate">
                            {primaryService?.receivedTime}
                          </td>

                          {/* 17. Sent Time */}
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 truncate">
                            {primaryService?.sentTime}
                          </td>

                          {/* 18. Update Time */}
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 truncate">
                            {primaryService?.updateTime}
                          </td>

                          {/* 19. Charged On */}
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 truncate">
                            {primaryService?.chargedOn}
                          </td>

                          {/* 20. Action */}
                          <td className="py-2.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                            {renderActionStatusBadge(
                              hasActionAlert ? (alertService?.actionLabel || 'No Scans') : (primaryService?.actionLabel || 'In Progress'),
                              hasActionAlert,
                              alertService?.actionButtonText || 'Upload',
                              (e) => {
                                e.stopPropagation();
                                navigate(`/order-details?ID=${order.orderNum}`);
                              }
                            )}
                          </td>

                          {/* 21. Change Request */}
                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-rose-600 font-bold">
                            {primaryService?.changeRequest || '-'}
                          </td>

                          {/* 22. CS-Task */}
                          <td className="py-2.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[#ea580c] font-black text-[10px] hover:underline cursor-pointer">
                              {primaryService?.csTask?.assignee ? primaryService.csTask.assignee : 'Assign'}
                            </span>
                          </td>
                        </tr>

                        {/* 2. EXPANDED ACCORDION: SMOOTH SLIDE-DOWN & SLIDE-UP VIA ANIMATEPRESENCE (ZERO ABRUPTNESS) */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr key={`expanded-row-${order.id}`} className="bg-slate-100/60 dark:bg-slate-950/60">
                              <td colSpan={22} className="p-0 border-b-2 border-[#0284c7]/40 dark:border-sky-500/30">
                                <motion.div
                                  key={`detail-anim-${order.id}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1.0] }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3.5 space-y-3 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-[#070b14] dark:to-[#090d18] border-l-4 border-l-[#0284c7]">
                                    
                                    {/* Encapsulated Case Overview Ribbon */}
                                    <div className="p-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-2 py-0.5 rounded-md bg-[#0284c7] text-white font-mono font-black text-xs">
                                          Case #{order.orderNum} Details
                                        </span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          Center: <strong>{order.scanCenter}</strong>
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          Doctor: <strong className="text-[#ea580c]">{order.doctorName}</strong> ({order.doctorSub})
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          Patient: <strong>{order.patientName}</strong>
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          Archive: <strong className="font-mono">{order.archiveDate}</strong>
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                          {tpCount >= 2 ? `Multi-TP Supported (${tpCount} Plans)` : 'Standard Case'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                                        >
                                          <span>Full Record</span>
                                          <ExternalLink size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* VIEW MODE 1: COMPLETE 22-COL DETAILED MATRIX TABLE (ZERO HORIZONTAL SCROLL) */}
                                    {subOrderViewMode === 'matrix' ? (
                                      <div className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0b101d] overflow-hidden shadow-xs">
                                        <table className="w-full text-left text-xs border-collapse table-fixed">
                                          <thead>
                                            <tr className="bg-slate-200/90 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black text-[10px]">
                                              <th className="py-2 px-1 text-center w-[4.5%]">#</th>
                                              <th className="py-2 px-1.5 w-[6.5%]">Scan Center</th>
                                              <th className="py-2 px-1.5 w-[6.5%]">Doctor</th>
                                              <th className="py-2 px-1.5 w-[6.5%]">Patient</th>
                                              <th className="py-2 px-1 text-center w-[3.5%]">Lock</th>
                                              <th className="py-2 px-1 text-center w-[3.5%]">Notes</th>
                                              <th className="py-2 px-1 text-center w-[4.5%]">Archive</th>
                                              <th className="py-2 px-0.5 text-center w-[2%]">...</th>
                                              <th className="py-2 px-2 w-[9%]">Order (Service)</th>
                                              <th className="py-2 px-1.5 w-[6%]">Bill To</th>
                                              <th className="py-2 px-1 text-center w-[3%]">Max.</th>
                                              <th className="py-2 px-1 text-center w-[3%]">Mand.</th>
                                              <th className="py-2 px-1 text-center w-[4%]">Format</th>
                                              <th className="py-2 px-1.5 text-right w-[4.5%]">Amount</th>
                                              <th className="py-2 px-1 text-center w-[3%]">Vouch.</th>
                                              <th className="py-2 px-1.5 w-[6%]">Received</th>
                                              <th className="py-2 px-1 text-center w-[4.5%]">Sent</th>
                                              <th className="py-2 px-1 text-center w-[4.5%]">Update</th>
                                              <th className="py-2 px-1 text-center w-[4.5%]">Charged</th>
                                              <th className="py-2 px-1.5 text-center w-[7.5%]">Action</th>
                                              <th className="py-2 px-1 text-center w-[3.5%]">CR</th>
                                              <th className="py-2 px-1 text-center w-[5%]">CS-Task</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {order.services.map((sub, srvIdx) => (
                                              <tr
                                                key={sub.id}
                                                className={`text-xs font-medium transition-colors ${
                                                  sub.typeCode === 'IO'
                                                    ? 'bg-amber-300/35 dark:bg-yellow-500/20 backdrop-blur-md border-y border-amber-400/60 shadow-xs text-slate-900 dark:text-yellow-100 font-bold hover:bg-amber-300/50 dark:hover:bg-yellow-500/30'
                                                    : 'bg-white/90 dark:bg-[#0b101d]/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                                }`}
                                              >
                                                {/* 1. Sub index */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-500">
                                                  ↳ #{srvIdx + 1}
                                                </td>

                                                {/* 2-8. Inherited case metadata in sub-row */}
                                                <td className="py-2.5 px-1.5 text-[10px] text-slate-500 italic truncate">
                                                  {order.scanCenter}
                                                </td>
                                                <td className="py-2.5 px-1.5 text-[10px] text-slate-500 italic truncate">
                                                  <span className="text-[#ea580c] font-bold">{order.doctorName}</span>
                                                </td>
                                                <td className="py-2.5 px-1.5 text-[10px] text-slate-500 italic truncate">
                                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{order.patientName}</span>
                                                </td>
                                                <td className="py-2.5 px-1 text-center text-[9px]">
                                                  {order.isLocked ? (
                                                    <span className="inline-block w-3 h-3 rotate-45 bg-emerald-500 text-white text-[7px] leading-3 text-center shadow-xs">🔒</span>
                                                  ) : (
                                                    <span className="inline-block w-3 h-3 rotate-45 bg-rose-600 text-white text-[7px] leading-3 text-center shadow-xs">🔓</span>
                                                  )}
                                                </td>
                                                <td className="py-2.5 px-1 text-center text-[9px] text-slate-500 truncate" title={order.notes}>
                                                  {order.notes}
                                                </td>
                                                <td className="py-2.5 px-1 text-center text-[9px] font-mono text-slate-500 truncate">
                                                  {order.archiveDate}
                                                </td>
                                                <td className="py-2.5 px-0.5 text-center text-slate-400">
                                                  •
                                                </td>

                                                {/* 9. Order Name & Icon (100% Match with Screenshot) */}
                                                <td className="py-2.5 px-2">
                                                  <div className="flex flex-col items-start gap-0.5">
                                                    <span className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                                                      {sub.title}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[9.5px] font-mono">
                                                      {sub.typeCode === 'IO' && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/25 dark:bg-yellow-400/20 text-amber-900 dark:text-yellow-200 font-extrabold flex items-center gap-1 border border-amber-500/40 shadow-xs">
                                                          <Wrench size={10} className="text-amber-800 dark:text-yellow-300" />
                                                          <span>IO Scan</span>
                                                        </span>
                                                      )}
                                                      {sub.typeCode === 'TP' && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-400/20 text-cyan-800 dark:text-cyan-300 font-bold flex items-center gap-1 border border-cyan-500/30">
                                                          <span>🛠️</span>
                                                          <span>{sub.subtitle || 'coDiagnostiX'}</span>
                                                        </span>
                                                      )}
                                                      {sub.typeCode === 'FMP' && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500/15 dark:bg-orange-400/20 text-orange-800 dark:text-orange-300 font-bold flex items-center gap-1 border border-orange-500/30">
                                                          <Sparkles size={10} />
                                                          <span>FMP</span>
                                                        </span>
                                                      )}
                                                      {sub.typeCode === 'SG' && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                                                          <CheckCircle2 size={10} />
                                                          <span>CAM Print</span>
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </td>

                                                {/* 10. Bill To */}
                                                <td className="py-2.5 px-1.5 text-[10px] text-slate-700 dark:text-slate-300 truncate" title={sub.billTo}>
                                                  {sub.billTo}
                                                </td>

                                                {/* 11. Max. */}
                                                <td className="py-2.5 px-1 text-center font-bold text-[10px]">
                                                  <span className={sub.maxilla === 'Yes' || sub.maxilla === 'Quadrant' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}>
                                                    {sub.maxilla}
                                                  </span>
                                                </td>

                                                {/* 12. Mand. */}
                                                <td className="py-2.5 px-1 text-center font-bold text-[10px]">
                                                  <span className={sub.mandible === 'Yes' || sub.mandible === 'Mandible' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}>
                                                    {sub.mandible}
                                                  </span>
                                                </td>

                                                {/* 13. Format */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate" title={sub.format}>
                                                  {sub.format}
                                                </td>

                                                {/* 14. Amount */}
                                                <td className="py-2.5 px-1.5 text-right font-mono font-black text-[11px] text-slate-900 dark:text-white">
                                                  ${sub.amount}.00
                                                </td>

                                                {/* 15. Vouchers */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-500">
                                                  {sub.vouchers}
                                                </td>

                                                {/* 16. Received Time */}
                                                <td className="py-2.5 px-1.5 font-mono text-[9px] leading-tight text-slate-600 dark:text-slate-400 truncate" title={sub.receivedTime}>
                                                  {sub.receivedTime}
                                                </td>

                                                {/* 17. Sent Time */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[9px] text-slate-500 truncate">
                                                  {sub.sentTime}
                                                </td>

                                                {/* 18. Update Time */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[9px] text-slate-500 truncate">
                                                  {sub.updateTime}
                                                </td>

                                                {/* 19. Charged On */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[9px] text-slate-500 truncate">
                                                  {sub.chargedOn}
                                                </td>

                                                {/* 20. Action */}
                                                <td className="py-2 px-1 text-center">
                                                  {renderActionStatusBadge(
                                                    sub.actionLabel,
                                                    sub.hasActionAlert,
                                                    sub.actionButtonText,
                                                    (e) => {
                                                      e.stopPropagation();
                                                      navigate(`/order-details?ID=${order.orderNum}`);
                                                    }
                                                  )}
                                                </td>

                                                {/* 21. Change Request */}
                                                <td className="py-2.5 px-1 text-center font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                                  {sub.changeRequest}
                                                </td>

                                                {/* 22. CS-Task */}
                                                <td className="py-2.5 px-1 text-center">
                                                  {sub.csTask.status === 'Assigned' ? (
                                                    <div className="text-[9px] leading-tight">
                                                      <div className="text-[#ea580c] font-black">Assign</div>
                                                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                        by {sub.csTask.assignee}
                                                      </div>
                                                      <span className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer block text-[8px]">
                                                        Undo
                                                      </span>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      className="text-[#ea580c] font-bold text-[9px] hover:underline cursor-pointer"
                                                    >
                                                      Assign
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      /* VIEW MODE 2: 22-FIELD COMPREHENSIVE SERVICE CARDS */
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {order.services.map((sub, srvIdx) => (
                                          <div
                                            key={sub.id}
                                            className={`p-3.5 rounded-xl border shadow-xs space-y-2.5 ${
                                              sub.typeCode === 'IO'
                                                ? 'bg-[#ffff88]/40 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-900/50'
                                                : 'bg-white dark:bg-[#0c1222] border-slate-200 dark:border-slate-800'
                                            }`}
                                          >
                                            {/* Card Top: Service Header & Action */}
                                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                                  Sub #{srvIdx + 1}
                                                </span>
                                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                                  {sub.title}
                                                </span>
                                                {sub.subtitle && (
                                                  <span className="text-[10px] text-cyan-600 font-bold">
                                                    ({sub.subtitle})
                                                  </span>
                                                )}
                                              </div>

                                              {/* Action Alert */}
                                              {renderActionStatusBadge(
                                                sub.actionLabel,
                                                sub.hasActionAlert,
                                                sub.actionButtonText,
                                                (e) => {
                                                  e.stopPropagation();
                                                  navigate(`/order-details?ID=${order.orderNum}`);
                                                }
                                              )}
                                            </div>

                                            {/* 22 Fields Categorized Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Bill To</div>
                                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{sub.billTo}</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Format</div>
                                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{sub.format}</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Maxilla</div>
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">{sub.maxilla}</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Mandible</div>
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">{sub.mandible}</div>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Amount Billed</div>
                                                <div className="font-mono font-black text-slate-900 dark:text-white">${sub.amount}.00</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Vouchers</div>
                                                <div className="font-mono text-slate-600 dark:text-slate-400">{sub.vouchers}</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">Change Request</div>
                                                <div className="font-bold text-rose-600">{sub.changeRequest}</div>
                                              </div>
                                              <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60">
                                                <div className="text-slate-400 font-bold text-[9px] uppercase">CS-Task</div>
                                                <div className="font-bold text-[#ea580c]">{sub.csTask.assignee ? `by ${sub.csTask.assignee}` : 'Assign'}</div>
                                              </div>
                                            </div>

                                            {/* Timeline Strip */}
                                            <div className="p-2 rounded bg-slate-100/70 dark:bg-slate-900/80 font-mono text-[9.5px] flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-400">
                                              <span><strong>Rec:</strong> {sub.receivedTime}</span>
                                              <span><strong>Sent:</strong> {sub.sentTime}</span>
                                              <span><strong>Upd:</strong> {sub.updateTime}</span>
                                              <span><strong>Charged:</strong> {sub.chargedOn}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Accessible Modern Pagination */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 dark:text-slate-200">
                Showing <strong className="text-sky-600 dark:text-sky-400">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong className="text-sky-600 dark:text-sky-400">{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> Cases
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={36}>All (36)</option>
              </select>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
