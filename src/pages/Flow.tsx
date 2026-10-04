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
  Plus
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { UIStateSwitcher, UIStateType } from '@/components/ui/UIStateSwitcher';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';

// Detailed Sub-Service Item matching the exact columns from the user's legacy screenshot
export interface SubServiceItem {
  id: string;
  type: 'Intra-Oral' | 'Treatment Plan' | 'Surgical Guide' | 'Temp Restoration' | 'Model Work' | 'Radiology Report';
  typeCode: 'IO' | 'TP' | 'SG' | 'FMP' | 'MOD' | 'RAD';
  title: string;              // e.g. "Treatment Plan #1 (Maxilla)"
  statusTag?: string;         // e.g. "Later"
  billTo: string;             // e.g. "Bishoy Mina CC: Master, 9903"
  maxilla: string;            // "Yes" | "No" | "Quadrant" | "None"
  mandible: string;           // "Yes" | "No" | "Mandible" | "None"
  format: string;             // "coDiagnostiX"
  amount: number;             // e.g. 200
  vouchers: string;           // "N/A" or "1"
  receivedTime: string;       // "Mon Sep 28 14.13.07"
  sentTime: string;           // "Not Yet" or "Sep 29 16:30"
  updateTime: string;         // "No Updates"
  chargedOn: string;          // "Not Yet"
  hasActionAlert: boolean;    // true if red alert "No Scans Uploaded"
  actionLabel: string;        // "No Scans Uploaded - Upload IO File"
  actionButtonText?: string;  // "Upload IO File"
  changeRequest: string;      // "Revised", "CR-104", "-"
  csTask: {
    status: 'Assign' | 'Assigned';
    assignee?: string;        // "shrouk"
    time?: string;            // "2026-09-28 14:14"
  };
}

// Master Order enriched with its multiple sub-services
export interface MasterWorkflowOrder {
  id: string;
  serial: number;
  orderNum: string;
  source: 'Via CP' | 'Via Connect';
  scanCenter: string;
  doctorName: string;
  patientName: string;
  isLocked: boolean;
  notes: string;
  archiveDate: string;
  status: string;
  priority: string;
  totalAmount: number;
  services: SubServiceItem[];
}

// Service Filter definitions
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

  // Expand / Collapse state: Set of order IDs currently expanded
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set(['504901'])); // Default first order open for immediate visual discovery!

  // Quick View Drawer Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<any | null>(null);

  // Toggle single order expansion
  const toggleOrderExpand = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Expand all or collapse all rows
  const handleToggleExpandAll = () => {
    if (expandedOrders.size === filteredOrders.length) {
      setExpandedOrders(new Set());
    } else {
      setExpandedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // Toggle single service filter
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
      // 1. Exact Order 504901 from User Reference Image (has 2 TPs and Intra-Oral)
      {
        id: '504901',
        serial: 1,
        orderNum: '504901',
        source: 'Via CP',
        scanCenter: 'None',
        doctorName: 'Bishoy Mina',
        patientName: 'Test Add order',
        isLocked: true,
        notes: 'Inter. 2026-09-28',
        archiveDate: '2026-09-28',
        status: 'Action Required',
        priority: 'Urgent',
        totalAmount: 200,
        services: [
          {
            id: 'srv-101',
            type: 'Intra-Oral',
            typeCode: 'IO',
            title: 'Intra-Oral Scanning (IO)',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'Yes',
            mandible: 'No',
            format: 'coDiagnostiX',
            amount: 0,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: true,
            actionLabel: 'No Scans Uploaded',
            actionButtonText: 'Upload IO File',
            changeRequest: '-',
            csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-09-28 14:14' }
          },
          {
            id: 'srv-102',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan #1 (Maxilla)',
            statusTag: 'Later',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'Quadrant',
            mandible: 'None',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07',
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
            title: 'Treatment Plan #2 (Mandible - Multi-TP Design)',
            statusTag: 'Later',
            billTo: 'Bishoy Mina CC: Master, 9903',
            maxilla: 'None',
            mandible: 'Quadrant',
            format: 'coDiagnostiX',
            amount: 200,
            vouchers: 'N/A',
            receivedTime: 'Mon Sep 28 14.13.07',
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

      // 2. Exact Order 504900 from User Reference Image (Via Connect, Temp Restoration FMP)
      {
        id: '504900',
        serial: 2,
        orderNum: '504900',
        source: 'Via Connect',
        scanCenter: 'None',
        doctorName: 'Rashad Hussein',
        patientName: 'patient RH',
        isLocked: false,
        notes: 'SALES Rashad',
        archiveDate: '2026-09-22',
        status: 'Action Required',
        priority: 'Normal',
        totalAmount: 575,
        services: [
          {
            id: 'srv-201',
            type: 'Temp Restoration',
            typeCode: 'FMP',
            title: 'Temp Restoration (FMP)',
            billTo: 'Rashad Hussein CC: VISA, 9903',
            maxilla: 'None',
            mandible: 'Mandible',
            format: 'coDiagnostiX',
            amount: 575,
            vouchers: 'N/A',
            receivedTime: 'Tue Sep 22 15:52:43',
            sentTime: 'Not Yet',
            updateTime: 'No Updates',
            chargedOn: 'Not Yet',
            hasActionAlert: true,
            actionLabel: 'No Scans Uploaded',
            actionButtonText: 'Fill FMP Form',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          },
          {
            id: 'srv-202',
            type: 'Surgical Guide',
            typeCode: 'SG',
            title: 'Surgical Guide (Tooth-Supported)',
            billTo: 'Rashad Hussein CC: VISA, 9903',
            maxilla: 'None',
            mandible: 'Mandible',
            format: 'STL / CAM',
            amount: 285,
            vouchers: '1',
            receivedTime: 'Tue Sep 22 15:52:43',
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

      // 3. Clinical Multi-Service Case: Co-Diagnostix Dual TP + Surgical Guide
      {
        id: 'ord-3',
        serial: 3,
        orderNum: 'ORD-2024-003',
        source: 'Via CP',
        scanCenter: 'Align Chicago Hub',
        doctorName: 'Dr. Marcus Vance',
        patientName: 'Arthur Pendelton',
        isLocked: false,
        notes: 'Bone density 650 HU • Verify nerve canal',
        archiveDate: '2026-10-15',
        status: 'Design',
        priority: 'Urgent',
        totalAmount: 485,
        services: [
          {
            id: 'srv-301',
            type: 'Treatment Plan',
            typeCode: 'TP',
            title: 'Treatment Plan #1 (Maxilla Anterior)',
            statusTag: 'Co-Dx Plan',
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
            title: 'Treatment Plan #2 (Mandible Molar Site #19)',
            statusTag: 'Dual TP',
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
            title: 'Surgical Guide (Straumann VeloGuide)',
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
            actionLabel: 'Nesting for 3D Print',
            changeRequest: '-',
            csTask: { status: 'Assign' }
          }
        ]
      },

      // 4. Case 504895: Radiology Report + Conversion
      {
        id: '504895',
        serial: 4,
        orderNum: '504895',
        source: 'Via CP',
        scanCenter: 'Boston Diagnostics',
        doctorName: 'Dr. Sarah Connor',
        patientName: 'Emma Watson',
        isLocked: true,
        notes: 'Impaction review for lower third molars',
        archiveDate: '2026-10-02',
        status: 'Completed',
        priority: 'Normal',
        totalAmount: 320,
        services: [
          {
            id: 'srv-401',
            type: 'Radiology Report',
            typeCode: 'RAD',
            title: 'Full Radiology Report (CBCT)',
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

  // Filtered orders according to search, status, and view mode
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      // 1. Search Query
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

      // 2. Status Filter
      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
        return false;
      }

      // 3. View Filter: Multiple TPs or Action Required
      if (viewFilter === 'multi-tp') {
        const tpCount = order.services.filter(s => s.typeCode === 'TP').length;
        if (tpCount < 2) return false;
      } else if (viewFilter === 'action-required') {
        const hasAlert = order.services.some(s => s.hasActionAlert);
        if (!hasAlert) return false;
      }

      return true;
    });
  }, [enrichedOrders, search, selectedStatus, viewFilter]);

  // Helper to render service badge with appropriate color
  const renderServiceBadge = (service: SubServiceItem) => {
    switch (service.typeCode) {
      case 'IO':
        return (
          <span key={service.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-300/30 text-amber-800 dark:text-amber-300 border border-amber-400/40">
            <Wrench size={10} />
            <span>IO</span>
          </span>
        );
      case 'TP':
        return (
          <span key={service.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/15 text-[#0284c7] dark:text-sky-300 border border-sky-500/30">
            <FileText size={10} />
            <span>TP</span>
          </span>
        );
      case 'SG':
        return (
          <span key={service.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 size={10} />
            <span>SG</span>
          </span>
        );
      case 'FMP':
        return (
          <span key={service.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#ea580c]/15 text-[#ea580c] dark:text-orange-300 border border-[#ea580c]/30">
            <Sparkles size={10} />
            <span>FMP</span>
          </span>
        );
      default:
        return (
          <span key={service.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <span>{service.typeCode}</span>
          </span>
        );
    }
  };

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
            Expandable Master-Detail Architecture • Full Sub-Orders (TP, SG, IO, FMP) with Multi-TP capability • Zero horizontal scrolling
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

      {/* 2. Redesigned Service Filter Bar */}
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

        {/* Clean Categorized Groups */}
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

        {/* Quick Filter & Architecture View Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Case #, Patient, Doctor, Sub-Service..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Action Required">Action Required</option>
              <option value="Design">In Design / Planning</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Architecture Special Filters: Multi-TP & Actions */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">View:</span>
            <button
              type="button"
              onClick={() => setViewFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                viewFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Cases
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
              <span>Multi-TP Cases (2+ TP)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">New DB</span>
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
              <span>Needs Scans (Action Required)</span>
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

      {/* 4. EXPANDABLE MASTER-DETAIL WORKFLOW TABLE (NO HORIZONTAL SCROLL) */}
      {uiState === 'normal' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
          
          {/* Table Header Bar with Expand All Toggle */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0284c7] text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer shadow-xs"
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
                Click any case row or arrow to reveal full sub-orders (TP, SG, IO, FMP)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0284c7] dark:text-sky-400">
                22" Zero Horizontal Scroll Standard
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-hidden">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-[#e5e7eb] dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-[11px] select-none">
                  <th className="py-2.5 px-2 text-center w-12">#</th>
                  <th className="py-2.5 px-2 w-28">Case / Source</th>
                  <th className="py-2.5 px-2 w-36">Scan Center</th>
                  <th className="py-2.5 px-2 w-36">Doctor</th>
                  <th className="py-2.5 px-2 w-40">Patient Name</th>
                  <th className="py-2.5 px-2">Sub-Services Breakdown</th>
                  <th className="py-2.5 px-2 text-center w-28">Lock / Archive</th>
                  <th className="py-2.5 px-2 text-right w-24">Billed</th>
                  <th className="py-2.5 px-2 text-center w-28">Status</th>
                  <th className="py-2.5 px-2 text-center w-20">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                      No matching cases in this production queue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const tpCount = order.services.filter(s => s.typeCode === 'TP').length;
                    const hasActionAlert = order.services.some(s => s.hasActionAlert);

                    return (
                      <React.Fragment key={order.id}>
                        {/* MASTER ROW (CLEAN, ELEGANT, ZERO HORIZONTAL SCROLL) */}
                        <tr
                          onClick={() => toggleOrderExpand(order.id)}
                          className={`group transition-colors cursor-pointer select-none ${
                            isExpanded
                              ? 'bg-sky-50/70 dark:bg-sky-950/30 border-l-4 border-l-[#0284c7]'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          {/* 1. Expand Chevron & Serial */}
                          <td className="py-3 px-2 text-center font-mono text-slate-500">
                            <div className="flex items-center justify-center gap-1">
                              <span className="p-1 rounded-md text-slate-400 group-hover:text-[#0284c7] transition-transform">
                                {isExpanded ? (
                                  <ChevronDown size={15} className="text-[#0284c7] stroke-[3]" />
                                ) : (
                                  <ChevronRight size={15} className="stroke-[2.5]" />
                                )}
                              </span>
                              <span className="text-[11px] font-bold">{order.serial}</span>
                            </div>
                          </td>

                          {/* 2. Case # & Source (matching user image badge) */}
                          <td className="py-3 px-2">
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-[#0284c7] dark:text-sky-400 text-sm">
                                {order.orderNum}
                              </span>
                              <span className={`inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit ${
                                order.source === 'Via CP'
                                  ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                  : 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                              }`}>
                                {order.source}
                              </span>
                            </div>
                          </td>

                          {/* 3. Scan Center */}
                          <td className="py-3 px-2 truncate font-semibold text-slate-800 dark:text-slate-200" title={order.scanCenter}>
                            {order.scanCenter}
                          </td>

                          {/* 4. Doctor */}
                          <td className="py-3 px-2 truncate font-bold text-slate-900 dark:text-white" title={order.doctorName}>
                            {order.doctorName}
                          </td>

                          {/* 5. Patient Name */}
                          <td className="py-3 px-2 truncate font-black text-slate-950 dark:text-white" title={order.patientName}>
                            {order.patientName}
                          </td>

                          {/* 6. Services Breakdown Summary (Shows TP Count & Alerts) */}
                          <td className="py-3 px-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Distinct Service Badges */}
                              {order.services.map((s) => renderServiceBadge(s))}

                              {/* Multi-TP Highlight Badge */}
                              {tpCount >= 2 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0284c7] text-white shadow-xs">
                                  <span>2x TP Plans</span>
                                </span>
                              )}

                              {/* Red Alert Pill if Action Required (matching image) */}
                              {hasActionAlert && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse shadow-xs">
                                  <AlertTriangle size={10} />
                                  <span>Action Needed</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Lock & Archive Date */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {order.isLocked ? (
                                <span title="Case Locked by Lab Operator">
                                  <Lock size={13} className="text-emerald-500" />
                                </span>
                              ) : (
                                <span title="Unlocked">
                                  <Unlock size={13} className="text-slate-300 dark:text-slate-600" />
                                </span>
                              )}
                              <span className="font-mono text-[11px] text-slate-500">
                                {order.archiveDate}
                              </span>
                            </div>
                          </td>

                          {/* 8. Total Amount Billed */}
                          <td className="py-3 px-2 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                            ${order.totalAmount}.00
                          </td>

                          {/* 9. Master Status */}
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                              order.status === 'Action Required'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                : order.status === 'Completed'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/15 text-[#0284c7] dark:text-sky-300 border border-sky-500/30'
                            }`}>
                              {order.status}
                            </span>
                          </td>

                          {/* 10. Quick Action */}
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-[#0284c7] hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Open Full Case Details"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED SUB-SERVICES ACCORDION PANEL (FULL LEGACY COLUMNS INTEGRATED) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="p-0 bg-slate-50/90 dark:bg-[#090d18] border-y border-slate-200 dark:border-slate-800">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="p-4 sm:p-5 space-y-3"
                              >
                                {/* Sub-Services Panel Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 rounded-md bg-[#0284c7]/10 text-[#0284c7]">
                                      <Layers size={14} />
                                    </span>
                                    <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                      Linked Clinical Services for Case #{order.orderNum}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {order.services.length} Services ({tpCount} Treatment Plans)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                                    >
                                      <span>Full 3D / DICOM Inspector →</span>
                                    </button>
                                  </div>
                                </div>

                                {/* NESTED SERVICES SUB-TABLE (REPRODUCING EXACT LEGACY COLUMNS CLEANLY) */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-white dark:bg-[#0b101d]">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                                        <th className="py-2 px-3 w-48">Service / Sub-Order</th>
                                        <th className="py-2 px-3 w-48">Bill To & Payment</th>
                                        <th className="py-2 px-2 text-center w-16">Maxilla</th>
                                        <th className="py-2 px-2 text-center w-16">Mandible</th>
                                        <th className="py-2 px-2.5 w-24">Format</th>
                                        <th className="py-2 px-2.5 text-right w-20">Amount</th>
                                        <th className="py-2 px-2.5 text-center w-16">Vouchers</th>
                                        <th className="py-2 px-3 w-36">Timestamps</th>
                                        <th className="py-2 px-3 text-center w-48">Clinical Action</th>
                                        <th className="py-2 px-2 text-center w-20">CR</th>
                                        <th className="py-2 px-3 text-center w-36">CS-Task</th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                      {order.services.map((srv, idx) => (
                                        <tr
                                          key={srv.id}
                                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors ${
                                            srv.typeCode === 'IO'
                                              ? 'bg-amber-50/30 dark:bg-amber-950/10'
                                              : idx % 2 === 1
                                              ? 'bg-slate-50/30 dark:bg-slate-900/20'
                                              : ''
                                          }`}
                                        >
                                          {/* 1. Service Type & Sub-Title (with legacy icons) */}
                                          <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {srv.typeCode === 'IO' ? (
                                                  <Wrench size={13} className="text-amber-600" />
                                                ) : srv.typeCode === 'TP' ? (
                                                  <FileText size={13} className="text-[#0284c7]" />
                                                ) : srv.typeCode === 'FMP' ? (
                                                  <Sparkles size={13} className="text-[#ea580c]" />
                                                ) : (
                                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                                )}
                                              </span>
                                              <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                  {srv.title}
                                                </div>
                                                {srv.statusTag && (
                                                  <span className="text-[10px] font-mono text-slate-400 block">
                                                    Status: {srv.statusTag}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </td>

                                          {/* 2. Bill To & CC */}
                                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1 font-semibold text-[11px]">
                                              <CreditCard size={12} className="text-slate-400 shrink-0" />
                                              <span className="truncate">{srv.billTo}</span>
                                            </div>
                                          </td>

                                          {/* 3. Maxilla */}
                                          <td className="py-2.5 px-2 text-center font-bold text-[11px]">
                                            {srv.maxilla === 'Yes' || srv.maxilla === 'Quadrant' ? (
                                              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                                {srv.maxilla}
                                              </span>
                                            ) : (
                                              <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                          </td>

                                          {/* 4. Mandible */}
                                          <td className="py-2.5 px-2 text-center font-bold text-[11px]">
                                            {srv.mandible === 'Yes' || srv.mandible === 'Mandible' || srv.mandible === 'Quadrant' ? (
                                              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                                {srv.mandible}
                                              </span>
                                            ) : (
                                              <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                          </td>

                                          {/* 5. Format */}
                                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                            {srv.format}
                                          </td>

                                          {/* 6. Amount */}
                                          <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            ${srv.amount}.00
                                          </td>

                                          {/* 7. Vouchers */}
                                          <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-500">
                                            {srv.vouchers}
                                          </td>

                                          {/* 8. Timestamps (Stacked for zero horizontal scroll) */}
                                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 leading-tight">
                                            <div>Rec: <span className="text-slate-700 dark:text-slate-300">{srv.receivedTime}</span></div>
                                            <div>Sent: <span className="text-slate-400">{srv.sentTime}</span></div>
                                          </td>

                                          {/* 9. Action (Exact Red Alert Box matching legacy image) */}
                                          <td className="py-2.5 px-3 text-center">
                                            {srv.hasActionAlert ? (
                                              <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-sm space-y-1">
                                                <div className="font-black text-[10px] tracking-tight uppercase flex items-center justify-center gap-1">
                                                  <AlertTriangle size={11} />
                                                  <span>{srv.actionLabel}</span>
                                                </div>
                                                {srv.actionButtonText && (
                                                  <button
                                                    type="button"
                                                    onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                                    className="w-full py-0.5 px-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded text-[10px] font-black transition-colors cursor-pointer"
                                                  >
                                                    {srv.actionButtonText}
                                                  </button>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500/10 text-[#0284c7] dark:text-sky-400 border border-sky-500/30">
                                                {srv.actionLabel}
                                              </span>
                                            )}
                                          </td>

                                          {/* 10. Change Request */}
                                          <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                                            {srv.changeRequest !== '-' ? (
                                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                                {srv.changeRequest}
                                              </span>
                                            ) : (
                                              <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                          </td>

                                          {/* 11. CS-Task Delegation (with shrouk assignee / Undo button matching image) */}
                                          <td className="py-2.5 px-3 text-center">
                                            {srv.csTask.status === 'Assigned' ? (
                                              <div className="text-[10px] leading-tight space-y-0.5">
                                                <div className="font-mono text-slate-700 dark:text-slate-300">
                                                  by <strong>{srv.csTask.assignee}</strong>
                                                </div>
                                                <span className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                                                  Undo
                                                </span>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                className="px-2 py-0.5 rounded text-[10px] font-bold text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
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
              Total Cases: <strong>{filteredOrders.length}</strong> • Showing Master-Detail Accordion
            </span>
            <span className="font-mono text-[#0284c7] dark:text-sky-400">
              Verified 22" 1080p Fit • Full Information • Zero Crowding
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
