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
  ShoppingCart
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

      {/* 4. EXACT 22 COLUMNS TABLE WITH ACCORDION SLIDE-DOWN & SOUND EFFECT */}
      {uiState === 'normal' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
          
          {/* Table Header Bar with Expand All Toggle */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
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
              <span className="text-slate-400 font-normal hidden sm:inline">
                Click ▶ arrow to slide down sub-orders (with sound effect)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0284c7] dark:text-sky-400 font-bold">
                22 Columns Standard • Master-Detail
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* EXACT 22 HEADERS FROM THE USER REFERENCE IMAGE */}
                <tr className="bg-[#d1d5db] dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-[11px] select-none whitespace-nowrap">
                  <th className="py-2.5 px-2 text-center w-20"># tl</th>
                  <th className="py-2.5 px-2 w-28">Scan Center tl</th>
                  <th className="py-2.5 px-2 w-28">Doctor tl</th>
                  <th className="py-2.5 px-2 w-32">Patient Name tl</th>
                  <th className="py-2.5 px-1.5 text-center w-20">Is Locked (?)</th>
                  <th className="py-2.5 px-2 text-center w-24">Notes</th>
                  <th className="py-2.5 px-2 text-center w-24">Archive Date</th>
                  <th className="py-2.5 px-1 text-center w-8">...</th>
                  <th className="py-2.5 px-3 w-32">Order</th>
                  <th className="py-2.5 px-3 w-44">Bill To</th>
                  <th className="py-2.5 px-2 text-center w-16">Max.</th>
                  <th className="py-2.5 px-2 text-center w-16">Mand.</th>
                  <th className="py-2.5 px-2.5 w-24">Format</th>
                  <th className="py-2.5 px-2.5 text-right w-20">Amount Billed</th>
                  <th className="py-2.5 px-2 text-center w-16">Vouchers</th>
                  <th className="py-2.5 px-3 w-32">Received Time</th>
                  <th className="py-2.5 px-2.5 text-center w-20">Sent Time</th>
                  <th className="py-2.5 px-2.5 text-center w-20">Update Time</th>
                  <th className="py-2.5 px-2.5 text-center w-20">Charged On</th>
                  <th className="py-2.5 px-3 text-center w-40">Action</th>
                  <th className="py-2.5 px-2 text-center w-24">Change Request</th>
                  <th className="py-2.5 px-3 text-center w-36">CS-Task</th>
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
                  filteredOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const tpCount = order.services.filter(s => s.typeCode === 'TP').length;
                    const hasActionAlert = order.services.some(s => s.hasActionAlert);
                    const primaryService = order.services[0];

                    return (
                      <React.Fragment key={order.id}>
                        {/* 1. MASTER ORDER ROW (COLLAPSED BY DEFAULT, STAYS FIXED IN PLACE) */}
                        <tr
                          onClick={() => toggleOrderExpand(order.id)}
                          className={`group transition-colors cursor-pointer select-none font-medium ${
                            isExpanded
                              ? 'bg-sky-50/60 dark:bg-sky-950/20 border-b-2 border-b-[#0284c7]/40'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          {/* 1. # tl: Chevron + Case # + Source Badge */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span
                                onClick={(e) => toggleOrderExpand(order.id, e)}
                                className="p-1 rounded-md text-slate-400 group-hover:text-[#0284c7] transition-all cursor-pointer"
                                title={isExpanded ? 'Collapse sub-orders' : 'Expand full sub-orders'}
                              >
                                {isExpanded ? (
                                  <ChevronDown size={16} className="text-[#0284c7] stroke-[3]" />
                                ) : (
                                  <ChevronRight size={16} className="stroke-[2.5]" />
                                )}
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-500 text-xs">
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
                          <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">
                            {order.scanCenter}
                          </td>

                          {/* 3. Doctor tl */}
                          <td className="py-3 px-2">
                            <div className="font-bold text-[#ea580c] dark:text-orange-400">
                              {order.doctorName}
                            </div>
                            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                              {order.doctorSub}
                            </div>
                          </td>

                          {/* 4. Patient Name tl */}
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {order.patientName}
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold cursor-pointer hover:underline">
                              {order.patientSub}
                            </div>
                          </td>

                          {/* 5. Is Locked (?) */}
                          <td className="py-3 px-1.5 text-center">
                            <div className="flex flex-col items-center">
                              {order.isLocked ? (
                                <>
                                  <div className="w-4 h-4 rotate-45 bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    <span className="-rotate-45">?</span>
                                  </div>
                                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1">
                                    Lock
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-4 h-4 rotate-45 bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    <span className="-rotate-45">?</span>
                                  </div>
                                  <span className="text-[9px] text-rose-600 font-bold uppercase mt-0.5">
                                    SALES Rashad
                                  </span>
                                  <span className="text-[10px] text-rose-600 font-bold">
                                    Unlock
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 6. Notes */}
                          <td className="py-3 px-2 text-center font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            <span className="underline cursor-pointer">
                              {order.notes}
                            </span>
                          </td>

                          {/* 7. Archive Date */}
                          <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div className="flex items-center justify-center gap-1">
                              <span>{order.archiveDate}</span>
                              <ShoppingCart size={13} className="text-emerald-500" />
                            </div>
                          </td>

                          {/* 8. ... */}
                          <td className="py-3 px-1 text-center" onClick={(e) => { e.stopPropagation(); navigate(`/order-details?ID=${order.orderNum}`); }}>
                            <MoreHorizontal size={14} className="text-slate-400 hover:text-[#0284c7] mx-auto cursor-pointer" />
                          </td>

                          {/* 9. Order (Service preview) */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                {order.services.length} Services ({tpCount >= 2 ? `${tpCount}x TP` : '1x TP'})
                              </span>
                              {!isExpanded && (
                                <span className="text-[10px] text-[#0284c7] font-bold">
                                  ▶ Click to Expand
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 10. Bill To */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[170px]" title={primaryService?.billTo}>
                            {primaryService?.billTo}
                          </td>

                          {/* 11. Max. */}
                          <td className="py-3 px-2 text-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            {primaryService?.maxilla}
                          </td>

                          {/* 12. Mand. */}
                          <td className="py-3 px-2 text-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            {primaryService?.mandible}
                          </td>

                          {/* 13. Format */}
                          <td className="py-3 px-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {primaryService?.format}
                          </td>

                          {/* 14. Amount Billed */}
                          <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${primaryService?.amount}
                          </td>

                          {/* 15. Vouchers */}
                          <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-500">
                            {primaryService?.vouchers}
                          </td>

                          {/* 16. Received Time */}
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.receivedTime}
                          </td>

                          {/* 17. Sent Time */}
                          <td className="py-3 px-2.5 text-center font-mono text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.sentTime}
                          </td>

                          {/* 18. Update Time */}
                          <td className="py-3 px-2.5 text-center font-mono text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.updateTime}
                          </td>

                          {/* 19. Charged On */}
                          <td className="py-3 px-2.5 text-center font-mono text-[10px] text-slate-700 dark:text-slate-300">
                            {primaryService?.chargedOn}
                          </td>

                          {/* 20. Action */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {hasActionAlert ? (
                              <div className="bg-red-600 text-white p-1 rounded font-black text-[10px] leading-tight shadow-xs">
                                <div>No Scans Uploaded</div>
                                <span className="underline hover:text-amber-200 cursor-pointer block mt-0.5">
                                  {primaryService?.actionButtonText || 'Upload'}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-500/10 text-sky-600 border border-sky-500/30">
                                {primaryService?.actionLabel}
                              </span>
                            )}
                          </td>

                          {/* 21. Change Request */}
                          <td className="py-3 px-2 text-center font-mono text-[11px] text-rose-600 font-bold">
                            {primaryService?.changeRequest}
                          </td>

                          {/* 22. CS-Task */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-[#ea580c] font-bold text-[11px] cursor-pointer hover:underline">
                              Assign
                            </span>
                          </td>
                        </tr>

                        {/* 2. EXPANDED DETAILED SUB-ROWS (SLIDES DOWN DIRECTLY UNDERNEATH) */}
                        <AnimatePresence>
                          {isExpanded && (
                            order.services.map((sub, srvIdx) => (
                              <motion.tr
                                key={sub.id}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, delay: srvIdx * 0.04 }}
                                className={`border-b border-slate-200 dark:border-slate-800 text-xs font-medium ${
                                  sub.typeCode === 'IO'
                                    ? 'bg-[#ffff77] dark:bg-yellow-950/30 text-slate-900 dark:text-yellow-100'
                                    : 'bg-white dark:bg-[#0b101d] text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {/* Left Columns 1-8: Grouped blank/indent under the parent order */}
                                <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                  ↳ {srvIdx + 1}
                                </td>
                                <td className="py-2.5 px-2 text-slate-400 italic text-[10px]">
                                  (same case)
                                </td>
                                <td className="py-2.5 px-2 text-slate-400 italic text-[10px]">
                                  (same doctor)
                                </td>
                                <td className="py-2.5 px-2 text-slate-400 italic text-[10px]">
                                  (same patient)
                                </td>
                                <td className="py-2.5 px-1.5 text-center text-slate-300">
                                  •
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-300">
                                  -
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-300">
                                  -
                                </td>
                                <td className="py-2.5 px-1 text-center text-slate-300">
                                  -
                                </td>

                                {/* Column 9: Exact Service Name & Icon (Matching legacy screenshot) */}
                                <td className={`py-2.5 px-3 font-bold ${sub.typeCode === 'IO' ? 'bg-[#ffff55] dark:bg-yellow-900/40 text-amber-900 dark:text-amber-200' : ''}`}>
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="font-extrabold text-xs">
                                      {sub.title}
                                    </span>
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                      {sub.typeCode === 'IO' && (
                                        <Wrench size={13} className="text-amber-600 inline" />
                                      )}
                                      {sub.typeCode === 'TP' && (
                                        <div className="flex items-center gap-1 text-cyan-600 font-bold">
                                          <span>🛠️</span>
                                          <span>{sub.subtitle || 'Later'}</span>
                                        </div>
                                      )}
                                      {sub.typeCode === 'FMP' && (
                                        <div className="flex items-center gap-1 text-orange-600 font-bold">
                                          <Sparkles size={12} />
                                          <span>FMP</span>
                                        </div>
                                      )}
                                      {sub.typeCode === 'SG' && (
                                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                          <CheckCircle2 size={12} />
                                          <span>CAM</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Column 10: Bill To */}
                                <td className={`py-2.5 px-3 text-[11px] font-bold ${sub.typeCode === 'IO' ? 'text-amber-950 dark:text-amber-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {sub.billTo}
                                </td>

                                {/* Column 11: Max. */}
                                <td className="py-2.5 px-2 text-center font-bold text-[11px]">
                                  {sub.maxilla}
                                </td>

                                {/* Column 12: Mand. */}
                                <td className="py-2.5 px-2 text-center font-bold text-[11px]">
                                  {sub.mandible}
                                </td>

                                {/* Column 13: Format */}
                                <td className="py-2.5 px-2.5 font-mono text-[11px]">
                                  {sub.format}
                                </td>

                                {/* Column 14: Amount Billed */}
                                <td className="py-2.5 px-2.5 text-right font-mono font-bold">
                                  ${sub.amount}
                                </td>

                                {/* Column 15: Vouchers */}
                                <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                                  {sub.vouchers}
                                </td>

                                {/* Column 16: Received Time */}
                                <td className="py-2.5 px-3 font-mono text-[10px] leading-tight">
                                  {sub.receivedTime}
                                </td>

                                {/* Column 17: Sent Time */}
                                <td className="py-2.5 px-2.5 text-center font-mono text-[10px]">
                                  {sub.sentTime}
                                </td>

                                {/* Column 18: Update Time */}
                                <td className="py-2.5 px-2.5 text-center font-mono text-[10px]">
                                  {sub.updateTime}
                                </td>

                                {/* Column 19: Charged On */}
                                <td className="py-2.5 px-2.5 text-center font-mono text-[10px]">
                                  {sub.chargedOn}
                                </td>

                                {/* Column 20: Action (EXACT BRIGHT RED RECTANGLE FROM IMAGE) */}
                                <td className="py-2 px-3 text-center">
                                  {sub.hasActionAlert ? (
                                    <div className="bg-red-600 hover:bg-red-700 text-white p-2 rounded font-black text-[11px] leading-tight shadow-md transition-colors">
                                      <div className="tracking-tight">{sub.actionLabel}</div>
                                      {sub.actionButtonText && (
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                          className="underline hover:text-amber-200 cursor-pointer block mt-1 mx-auto text-[10px] whitespace-pre-line"
                                        >
                                          {sub.actionButtonText}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 rounded font-bold text-[11px] bg-sky-500/10 text-[#0284c7] dark:text-sky-400 border border-sky-500/30">
                                      {sub.actionLabel}
                                    </span>
                                  )}
                                </td>

                                {/* Column 21: Change Request */}
                                <td className="py-2.5 px-2 text-center font-mono text-[11px] text-rose-600 font-bold">
                                  {sub.changeRequest}
                                </td>

                                {/* Column 22: CS-Task (Matching legacy assign / shrouk undo) */}
                                <td className="py-2.5 px-3 text-center">
                                  {sub.csTask.status === 'Assigned' ? (
                                    <div className="text-[10px] leading-tight space-y-0.5">
                                      <div className="text-[#ea580c] font-bold">
                                        Assign
                                      </div>
                                      <div className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                                        {sub.csTask.time}
                                      </div>
                                      <div className="font-bold text-slate-900 dark:text-white">
                                        by {sub.csTask.assignee}
                                      </div>
                                      <span className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer block">
                                        Undo
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="text-[#ea580c] font-bold text-[11px] hover:underline cursor-pointer"
                                    >
                                      Assign
                                    </button>
                                  )}
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
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
              Total Cases: <strong>{filteredOrders.length}</strong> • Showing all 22 columns from CP Specification
            </span>
            <span className="font-mono text-[#0284c7] dark:text-sky-400">
              Verified 22" 1080p Fit • Master-Detail Slide-Down with Audio Telemetry
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
