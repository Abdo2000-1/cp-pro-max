import React, { useState, useMemo } from 'react';
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
import { UIStateSwitcher, UIStateType } from '@/components/ui/UIStateSwitcher';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

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

// Sub-Service Item matching the exact columns in the user reference image
export interface SubServiceItem {
  id: string;
  type: 'Intra-Oral' | 'Treatment Plan' | 'Surgical Guide' | 'Temp Restoration' | 'Model Work' | 'Radiology Report';
  typeCode: 'IO' | 'TP' | 'SG' | 'FMP' | 'MOD' | 'RAD';
  title: string;              // e.g. "Intra-Oral" or "Treatment Plan"
  subtitle?: string;          // e.g. "Later"
  billTo: string;             // e.g. "Bishoy Mina CC: Master, 9903"
  maxilla: string;            // "Yes" | "Quadrant" | "None"
  mandible: string;           // "No" | "None" | "Mandible"
  format: string;             // "coDiagnostiX"
  amount: number;             // e.g. 0 or 200 or 575
  vouchers: string;           // "N/A"
  receivedTime: string;       // "Mon Sep 28 14.13.07 -0400"
  sentTime: string;           // "Not Yet"
  updateTime: string;         // "No Updates"
  chargedOn: string;          // "Not Yet"
  hasActionAlert: boolean;    // true for red alert box
  actionLabel: string;        // "No Scans Uploaded"
  actionButtonText?: string;  // "Upload IO File" or "Upload"
  changeRequest: string;      // "-" or "Revised"
  csTask: {
    status: 'Assign' | 'Assigned';
    assignee?: string;        // "shrouk"
    time?: string;            // "2026-09-28 14:14 -0400"
  };
}

// Master Order containing its metadata and linked services
export interface MasterWorkflowOrder {
  id: string;
  serial: number;
  orderNum: string;
  source: 'Via CP' | 'Via Connect';
  scanCenter: string;
  doctorName: string;
  doctorSub: string;         // e.g. "TE"
  patientName: string;
  patientSub: string;        // e.g. "Add SG Date"
  isLocked: boolean;
  notes: string;             // e.g. "Inter. 2026-09-28"
  archiveDate: string;       // e.g. "2026-09-28"
  services: SubServiceItem[];
}

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

  // UI state switcher (normal, loading, empty, error)
  const [uiState, setUiState] = useState<UIStateType>('normal');

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

  // Build authentic multi-service workflow orders matching Image 1 exact screenshot
  const enrichedOrders: MasterWorkflowOrder[] = useMemo(() => {
    return [
      // 1. Exact Order 504901 from User Image (Via CP, Bishoy Mina, Intra-Oral + 2x TP)
      {
        id: '504901',
        serial: 1,
        orderNum: '504901',
        source: 'Via CP',
        scanCenter: 'None',
        doctorName: 'Bishoy Mina',
        doctorSub: 'TE',
        patientName: 'Test Add order',
        patientSub: 'Add SG Date',
        isLocked: true,
        notes: 'Inter. 2026-09-28',
        archiveDate: '2026-09-28',
        services: [
          {
            id: 'srv-101',
            type: 'Intra-Oral',
            typeCode: 'IO',
            title: 'Intra-Oral',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'Yes',
            mandible: 'No',
            format: 'coDiagnostiX',
            amount: 0,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07 -0400',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: true,
            actionLabel: 'No Scans Uploaded',
            actionButtonText: 'Upload IO File',
            changeRequest: '-',
            csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-09-28 14:14 -0400' }
          },
          {
            id: 'srv-102',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan',
            subtitle: 'Later',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'Quadrant',
            mandible: 'None',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07 -0400',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: true,
            actionLabel: 'No Scans Uploaded',
            actionButtonText: 'Upload',
            changeRequest: 'Revised',
            csTask: { status: 'Assign' }
          },
          {
            id: 'srv-103',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan #2 (Mandible)',
            subtitle: 'Later',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'None',
            mandible: 'Quadrant',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07 -0400',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: false,
            actionLabel: 'In Planning',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          }
        ]
      },

      // 2. Exact Order 504900 from User Image (Via Connect, Rashad Hussein, Temp Restoration FMP)
      {
        id: '504900',
        serial: 2,
        orderNum: '504900',
        source: 'Via Connect',
        scanCenter: 'None',
        doctorName: 'Rashad Hussein',
        doctorSub: 'Add SG Date',
        patientName: 'patient RH',
        patientSub: 'Unlock',
        isLocked: false,
        notes: 'SALES Rashad',
        archiveDate: '2026-09-22',
        services: [
          {
            id: 'srv-201',
            type: 'Temp Restoration',
            typeCode: 'FMP',
            title: 'Temp Restoration',
            subtitle: 'FMP',
            billTo: 'Rashad Hussein CC: VISA, 9903',
            maxilla: 'None',
            mandible: 'Mandible',
            format: 'None',
            amount: 575,
            vouchers: 'N/A',
            receivedTime: 'Tue Sep 22 15:52:43 -0400',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: true,
            actionLabel: 'No Scans Uploaded',
            actionButtonText: 'Upload scans\nFill FMP Form',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          },
          {
            id: 'srv-202',
            type: 'Surgical Guide',
            typeCode: 'SG',
            title: 'Surgical Guide',
            subtitle: 'CAM Print',
            billTo: 'Rashad Hussein CC: VISA, 9903',
            maxilla: 'None',
            mandible: 'Mandible',
            format: 'coDiagnostiX',
            amount: 285,
            vouchers: 'N/A',
            receivedTime: 'Tue Sep 22 15:52:43 -0400',
            sentTime: 'Not Yet',
            updateTime: 'Sep 23 10:15',
            chargedOn: 'Not Yet',
            hasActionAlert: false,
            actionLabel: 'Queued for CAM Print',
            changeRequest: '-',
            csTask: { status: 'Assigned', assignee: 'omar', time: '2026-09-23 09:30' }
          }
        ]
      },

      // 3. Order ORD-2024-003 (Dr. Marcus Vance, Multi-TP + Surgical Guide)
      {
        id: 'ord-3',
        serial: 3,
        orderNum: 'ORD-2024-003',
        source: 'Via CP',
        scanCenter: 'Align Chicago Hub',
        doctorName: 'Dr. Marcus Vance',
        doctorSub: 'NY Smile Center',
        patientName: 'Arthur Pendelton',
        patientSub: 'Add SG Date',
        isLocked: false,
        notes: 'Bone density 650 HU',
        archiveDate: '2026-10-15',
        services: [
          {
            id: 'srv-301',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan #1 (Maxilla)',
            subtitle: 'Co-Dx Plan',
            billTo: 'NY Smile Center (Account #1428)',
            maxilla: 'Yes',
            mandible: 'No',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: '1',
            receivedTime: 'Sep 28 09:30',
            sentTime: 'Sep 28 14:15',
            updateTime: 'Sep 28 17:00',
            chargedOn: 'Sep 28 18:30',
            hasActionAlert: false,
            actionLabel: 'Plan Approved',
            changeRequest: 'CR-104',
            csTask: { status: 'Assigned', assignee: 'Sarah K.', time: '2026-09-28 11:00' }
          },
          {
            id: 'srv-302',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan #2 (Mandible)',
            subtitle: 'Dual TP',
            billTo: 'NY Smile Center (Account #1428)',
            maxilla: 'No',
            mandible: 'Yes',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: 'N/A',
            receivedTime: 'Sep 28 09:30',
            sentTime: 'Not Yet',
            updateTime: 'Sep 29 11:20',
            chargedOn: 'Not Yet',
            hasActionAlert: false,
            actionLabel: 'In Planning',
            changeRequest: '-',
            csTask: { status: 'Assigned', assignee: 'Alex M.', time: '2026-09-29 09:15' }
          },
          {
            id: 'srv-303',
            type: 'Surgical Guide',
            typeCode: 'SG',
            title: 'Surgical Guide (VeloGuide)',
            subtitle: 'Tooth-Supported',
            billTo: 'NY Smile Center (Account #1428)',
            maxilla: 'Yes',
            mandible: 'No',
            format: 'coDiagnostiX / STL',
            amount: 85,
            vouchers: 'N/A',
            receivedTime: 'Sep 28 09:30',
            sentTime: 'Not Yet',
            updateTime: 'Sep 29 12:00',
            chargedOn: 'Not Yet',
            hasActionAlert: false,
            actionLabel: 'CAM 3D Print',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          }
        ]
      },

      // 4. Order 504895 (Dr. Sarah Connor, Radiology Report + Models)
      {
        id: '504895',
        serial: 4,
        orderNum: '504895',
        source: 'Via CP',
        scanCenter: 'Boston Diagnostics',
        doctorName: 'Dr. Sarah Connor',
        doctorSub: 'TE',
        patientName: 'Emma Watson',
        patientSub: 'Add SG Date',
        isLocked: true,
        notes: 'Impaction review',
        archiveDate: '2026-10-02',
        services: [
          {
            id: 'srv-401',
            type: 'Radiology Report',
            typeCode: 'RAD',
            title: 'Full Radiology Report',
            subtitle: 'CBCT Review',
            billTo: 'Boston Diagnostics Lab',
            maxilla: 'Yes',
            mandible: 'Yes',
            format: 'PDF Report',
            amount: 170,
            vouchers: 'N/A',
            receivedTime: 'Sep 25 10:00',
            sentTime: 'Sep 25 15:45',
            updateTime: 'Sep 25 16:00',
            chargedOn: 'Sep 25 17:00',
            hasActionAlert: false,
            actionLabel: 'Report Signed',
            changeRequest: '-',
            csTask: { status: 'Assigned', assignee: 'Dr. Radiologist', time: '2026-09-25 14:00' }
          },
          {
            id: 'srv-402',
            type: 'Model Work',
            typeCode: 'MOD',
            title: '3D Printed Study Models',
            subtitle: 'Model Work',
            billTo: 'Boston Diagnostics Lab',
            maxilla: 'Yes',
            mandible: 'Yes',
            format: 'STL 3D Print',
            amount: 150,
            vouchers: 'N/A',
            receivedTime: 'Sep 25 10:00',
            sentTime: 'Sep 26 09:00',
            updateTime: 'Sep 26 10:00',
            chargedOn: 'Sep 26 11:00',
            hasActionAlert: false,
            actionLabel: 'Dispatched',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          }
        ]
      }
    ];
  }, []);

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

      {/* 4. ENCAPSULATED MASTER TABLE WITH STATIONARY ROW & ZERO HORIZONTAL SCROLLING */}
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
                Click row or ▶ arrow to slide down sub-orders (Zero displacement, stays fixed in place)
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
                100% Fit • 0 Horizontal Scroll
              </span>
            </div>
          </div>

          {/* Table Container - Strict overflow-hidden to prevent horizontal scrolling */}
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                {/* ENCAPSULATED MASTER TABLE HEADER - 100% FIT, ZERO SCROLLBAR */}
                <tr className="bg-[#d1d5db] dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-[11px] select-none">
                  <th className="py-2.5 px-2 text-center w-[9%]"># tl</th>
                  <th className="py-2.5 px-2 w-[12%]">Scan Center tl</th>
                  <th className="py-2.5 px-2 w-[13%]">Doctor tl</th>
                  <th className="py-2.5 px-2 w-[13%]">Patient Name tl</th>
                  <th className="py-2.5 px-1 text-center w-[7%]">Lock</th>
                  <th className="py-2.5 px-2 text-center w-[8%]">Notes & Date</th>
                  <th className="py-2.5 px-3 w-[21%]">Order / Services (Encapsulated)</th>
                  <th className="py-2.5 px-2 text-right w-[7%]">Amount</th>
                  <th className="py-2.5 px-2 text-center w-[9%]">Action</th>
                  <th className="py-2.5 px-1 text-center w-[5%]">CS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                      No matching cases in this production queue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const tpCount = order.services.filter((s) => s.typeCode === 'TP').length;
                    const hasActionAlert = order.services.some((s) => s.hasActionAlert);
                    const totalCaseAmount = order.services.reduce((acc, s) => acc + s.amount, 0);
                    const primaryService = order.services[0];
                    const alertService = order.services.find((s) => s.hasActionAlert);

                    return (
                      <React.Fragment key={order.id}>
                        {/* 1. MASTER ORDER ROW (STATIONARY: NEVER DISPLACES OR MOVES UP!) */}
                        <tr
                          onClick={() => toggleOrderExpand(order.id)}
                          className={`group transition-colors cursor-pointer select-none font-medium border-b border-slate-200 dark:border-slate-800 ${
                            isExpanded
                              ? 'bg-sky-50/80 dark:bg-sky-950/30 border-l-4 border-l-[#0284c7]'
                              : 'hover:bg-slate-50/90 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          {/* 1. # tl: Chevron + Order # + Source Badge */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span
                                onClick={(e) => toggleOrderExpand(order.id, e)}
                                className={`p-1 rounded-md transition-transform duration-200 cursor-pointer ${
                                  isExpanded
                                    ? 'text-[#0284c7] rotate-90'
                                    : 'text-slate-400 group-hover:text-[#0284c7]'
                                }`}
                                title={isExpanded ? 'Collapse sub-orders' : 'Expand full 22-column breakdown'}
                              >
                                <ChevronRight size={16} className="stroke-[3]" />
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="font-mono font-black text-amber-600 dark:text-amber-500 text-xs">
                                  {order.orderNum}
                                </span>
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                                  order.source === 'Via CP'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-purple-700 text-white'
                                }`}>
                                  {order.source}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Scan Center tl */}
                          <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200 truncate" title={order.scanCenter}>
                            {order.scanCenter}
                          </td>

                          {/* 3. Doctor tl */}
                          <td className="py-3 px-2">
                            <div className="font-bold text-[#ea580c] dark:text-orange-400 truncate" title={order.doctorName}>
                              {order.doctorName}
                            </div>
                            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold truncate">
                              {order.doctorSub}
                            </div>
                          </td>

                          {/* 4. Patient Name tl */}
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-900 dark:text-white truncate" title={order.patientName}>
                              {order.patientName}
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold truncate">
                              {order.patientSub}
                            </div>
                          </td>

                          {/* 5. Is Locked (?) */}
                          <td className="py-3 px-1 text-center">
                            <div className="flex flex-col items-center">
                              {order.isLocked ? (
                                <>
                                  <div className="w-3.5 h-3.5 rotate-45 bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                    <span className="-rotate-45">?</span>
                                  </div>
                                  <span className="text-[9px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                                    Lock
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-3.5 h-3.5 rotate-45 bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                    <span className="-rotate-45">?</span>
                                  </div>
                                  <span className="text-[8px] text-rose-600 font-bold uppercase mt-0.5">
                                    SALES
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 6. Notes & Archive Date */}
                          <td className="py-3 px-2 text-center text-[10px]">
                            <div className="font-bold text-slate-700 dark:text-slate-300 underline cursor-pointer truncate" title={order.notes}>
                              {order.notes}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-slate-500 font-mono mt-0.5">
                              <span>{order.archiveDate}</span>
                              <ShoppingCart size={11} className="text-emerald-500" />
                            </div>
                          </td>

                          {/* 7. Order / Services (ENCAPSULATED: Clear pills representing all services inside) */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {order.services.map((s, idx) => (
                                  <span
                                    key={s.id || idx}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                      s.typeCode === 'IO'
                                        ? 'bg-[#ffff77] text-amber-900 border-amber-300'
                                        : s.typeCode === 'TP'
                                        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300'
                                        : s.typeCode === 'SG'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                        : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300'
                                    }`}
                                  >
                                    {s.typeCode === 'IO' && '🔧 IO'}
                                    {s.typeCode === 'TP' && (idx === 1 && tpCount > 1 ? '🛠️ TP #1' : idx === 2 && tpCount > 1 ? '🛠️ TP #2' : '🛠️ TP')}
                                    {s.typeCode === 'SG' && '✓ SG'}
                                    {s.typeCode === 'FMP' && '✨ FMP'}
                                    {s.typeCode === 'MOD' && 'MOD'}
                                    {s.typeCode === 'RAD' && 'RAD'}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-[#0284c7] dark:text-sky-400">
                                {isExpanded ? '▲ Click to collapse' : `▶ ${order.services.length} Services (Inspect 22-Col Specs)`}
                              </span>
                            </div>
                          </td>

                          {/* 8. Total Amount Billed */}
                          <td className="py-3 px-2 text-right font-mono font-black text-slate-900 dark:text-white text-xs">
                            ${totalCaseAmount}.00
                          </td>

                          {/* 9. Case Action */}
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            {hasActionAlert ? (
                              <div className="bg-red-600 hover:bg-red-700 text-white p-1 rounded font-black text-[10px] leading-tight shadow-xs">
                                <div>No Scans Uploaded</div>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                  className="underline hover:text-amber-200 cursor-pointer block mt-0.5 mx-auto text-[9px]"
                                >
                                  {alertService?.actionButtonText || 'Upload'}
                                </button>
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 truncate max-w-full">
                                {primaryService?.actionLabel || 'In Progress'}
                              </span>
                            )}
                          </td>

                          {/* 10. CS-Task & More */}
                          <td className="py-3 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[#ea580c] font-black text-[10px] hover:underline cursor-pointer">
                                {primaryService?.csTask?.assignee ? primaryService.csTask.assignee : 'Assign'}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                className="text-slate-400 hover:text-[#0284c7] cursor-pointer"
                                title="Open full details"
                              >
                                <MoreHorizontal size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 2. EXPANDED DETAIL CONTAINER (SLIDES DOWN DIRECTLY UNDERNEATH, PUSHING BELOW ROWS) */}
                        {isExpanded && (
                          <tr key={`expanded-${order.id}`} className="bg-slate-100/60 dark:bg-slate-950/60">
                            <td colSpan={10} className="p-0 border-b-2 border-[#0284c7]/40 dark:border-sky-500/30">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.26, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-3.5 space-y-3 bg-gradient-to-b from-sky-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-[#070b14] dark:to-[#090d18] border-l-4 border-l-[#0284c7]">
                                  
                                  {/* Encapsulated Case Overview Ribbon */}
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="px-2 py-0.5 rounded-md bg-[#0284c7] text-white font-mono font-black text-xs">
                                        Case #{order.orderNum}
                                      </span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        Scan Center: <strong className="text-slate-900 dark:text-white">{order.scanCenter}</strong>
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        Doctor: <strong className="text-[#ea580c]">{order.doctorName}</strong> ({order.doctorSub})
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        Patient: <strong className="text-slate-900 dark:text-white">{order.patientName}</strong>
                                      </span>
                                      <span className="text-slate-400">•</span>
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
                                        <span>Full Case Record</span>
                                        <ExternalLink size={11} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* VIEW MODE 1: THE COMPLETE 22-COL SPECIFICATION MATRIX TABLE (ZERO HORIZONTAL SCROLL) */}
                                  {subOrderViewMode === 'matrix' ? (
                                    <div className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0b101d] overflow-hidden shadow-xs">
                                      <table className="w-full text-left text-xs border-collapse table-fixed">
                                        <thead>
                                          <tr className="bg-slate-200/90 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black text-[10.5px]">
                                            <th className="py-2 px-2 text-center w-[5%]">#</th>
                                            <th className="py-2 px-3 w-[18%]">Order (Service & Specification)</th>
                                            <th className="py-2 px-2.5 w-[14%]">Bill To</th>
                                            <th className="py-2 px-2 text-center w-[9%]">Max. / Mand.</th>
                                            <th className="py-2 px-2 w-[8%]">Format</th>
                                            <th className="py-2 px-2 text-right w-[7%]">Amount</th>
                                            <th className="py-2 px-1 text-center w-[5%]">Vouchers</th>
                                            <th className="py-2 px-2 w-[15%]">Timeline (Rec/Sent/Upd/Chg)</th>
                                            <th className="py-2 px-2 text-center w-[11%]">Action</th>
                                            <th className="py-2 px-1 text-center w-[4%]">CR</th>
                                            <th className="py-2 px-2 text-center w-[7%]">CS-Task</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                          {order.services.map((sub, srvIdx) => (
                                            <tr
                                              key={sub.id}
                                              className={`text-xs font-medium transition-colors ${
                                                sub.typeCode === 'IO'
                                                  ? 'bg-[#ffff77] dark:bg-yellow-950/40 text-slate-900 dark:text-yellow-100 font-bold'
                                                  : 'bg-white dark:bg-[#0b101d] text-slate-800 dark:text-slate-200'
                                              }`}
                                            >
                                              {/* 1. Sub-Order Index */}
                                              <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                ↳ #{srvIdx + 1}
                                              </td>

                                              {/* 2. Order Name & Icon (100% Match with Screenshot) */}
                                              <td className="py-2.5 px-3">
                                                <div className="flex flex-col items-start gap-0.5">
                                                  <span className="font-extrabold text-xs">
                                                    {sub.title}
                                                  </span>
                                                  <div className="flex items-center gap-1 text-[10.5px] font-mono">
                                                    {sub.typeCode === 'IO' && (
                                                      <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                                                        <Wrench size={12} className="text-amber-700" />
                                                        <span>Intra-Oral Scan</span>
                                                      </span>
                                                    )}
                                                    {sub.typeCode === 'TP' && (
                                                      <span className="text-cyan-700 dark:text-cyan-400 font-bold flex items-center gap-1">
                                                        <span>🛠️</span>
                                                        <span>{sub.subtitle || 'Later'}</span>
                                                      </span>
                                                    )}
                                                    {sub.typeCode === 'FMP' && (
                                                      <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                                                        <Sparkles size={11} />
                                                        <span>Temp Rest. (FMP)</span>
                                                      </span>
                                                    )}
                                                    {sub.typeCode === 'SG' && (
                                                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={11} />
                                                        <span>Surgical Guide (CAM)</span>
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </td>

                                              {/* 3. Bill To */}
                                              <td className="py-2.5 px-2.5 text-[11px] truncate" title={sub.billTo}>
                                                {sub.billTo}
                                              </td>

                                              {/* 4. Max. & Mand. */}
                                              <td className="py-2.5 px-2 text-center text-[10.5px]">
                                                <div className="flex items-center justify-center gap-1 font-bold">
                                                  <span className={sub.maxilla === 'Yes' || sub.maxilla === 'Quadrant' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                    Mx: {sub.maxilla}
                                                  </span>
                                                  <span className="text-slate-300">/</span>
                                                  <span className={sub.mandible === 'Yes' || sub.mandible === 'Mandible' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                    Md: {sub.mandible}
                                                  </span>
                                                </div>
                                              </td>

                                              {/* 5. Format */}
                                              <td className="py-2.5 px-2 font-mono text-[10.5px] truncate" title={sub.format}>
                                                {sub.format}
                                              </td>

                                              {/* 6. Amount */}
                                              <td className="py-2.5 px-2 text-right font-mono font-black text-xs">
                                                ${sub.amount}.00
                                              </td>

                                              {/* 7. Vouchers */}
                                              <td className="py-2.5 px-1 text-center font-mono text-[10.5px] text-slate-500">
                                                {sub.vouchers}
                                              </td>

                                              {/* 8. Timestamps (Stacked for 0 horizontal scroll) */}
                                              <td className="py-2 px-2 font-mono text-[9.5px] leading-tight text-slate-600 dark:text-slate-400">
                                                <div><strong className="text-slate-700 dark:text-slate-300">Rec:</strong> {sub.receivedTime}</div>
                                                <div><strong className="text-slate-500">Sent:</strong> {sub.sentTime} • <strong className="text-slate-500">Upd:</strong> {sub.updateTime}</div>
                                                <div><strong className="text-slate-500">Chg:</strong> {sub.chargedOn}</div>
                                              </td>

                                              {/* 9. Action (Exact Red Alert Box) */}
                                              <td className="py-2 px-2 text-center">
                                                {sub.hasActionAlert ? (
                                                  <div className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded font-black text-[10px] leading-tight shadow-xs">
                                                    <div>{sub.actionLabel}</div>
                                                    {sub.actionButtonText && (
                                                      <button
                                                        type="button"
                                                        onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                                        className="underline hover:text-amber-200 cursor-pointer block mt-0.5 mx-auto text-[9px]"
                                                      >
                                                        {sub.actionButtonText}
                                                      </button>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 truncate max-w-full">
                                                    {sub.actionLabel}
                                                  </span>
                                                )}
                                              </td>

                                              {/* 10. Change Request */}
                                              <td className="py-2.5 px-1 text-center font-mono text-[10.5px] text-rose-600 font-bold">
                                                {sub.changeRequest}
                                              </td>

                                              {/* 11. CS-Task */}
                                              <td className="py-2.5 px-2 text-center">
                                                {sub.csTask.status === 'Assigned' ? (
                                                  <div className="text-[9.5px] leading-tight">
                                                    <div className="text-[#ea580c] font-black">Assign</div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                      by {sub.csTask.assignee}
                                                    </div>
                                                    <span className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer block">
                                                      Undo
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    className="text-[#ea580c] font-bold text-[10px] hover:underline cursor-pointer"
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
                                            {sub.hasActionAlert ? (
                                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px]">
                                                {sub.actionLabel}
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 font-bold text-[10px]">
                                                {sub.actionLabel}
                                              </span>
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
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              Total Cases: <strong>{filteredOrders.length}</strong> • Encapsulated Master View
            </span>
            <span className="font-mono text-[#0284c7] dark:text-sky-400">
              Stationary Rows • 100% Fit • Zero Horizontal Scroll
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
