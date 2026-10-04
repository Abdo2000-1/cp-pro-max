import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Eye,
  Activity,
  FileCheck,
  Shield,
  Box,
  MessageSquare,
  Send,
  Zap,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Printer
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OrderStatus, Priority } from '@/types';

export default function OrderDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // URL Params matching: OrderDetails.php?xid=1016;reg=1;u=1;modID=288004;ID=677201 or ?id=ord-3
  const paramId = searchParams.get('ID') || searchParams.get('id') || 'ord-3';
  const modId = searchParams.get('modID') || '288004';
  const xid = searchParams.get('xid') || '1016';

  // Retrieve actual store orders dynamically
  const orders = useStore((s) => s.getOrders());
  const foundOrder = orders.find(
    (o) =>
      o.id.toLowerCase() === paramId.toLowerCase() ||
      o.orderNumber.toLowerCase() === paramId.toLowerCase() ||
      o.id.toLowerCase().includes(paramId.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(paramId.toLowerCase())
  );

  // Safe fallback if order is custom or not yet seeded
  const isCase504901 = paramId.includes('504901');
  const displayOrder = foundOrder || (isCase504901 ? {
    id: '504901',
    orderNumber: '#504901',
    patientName: 'Test Add order',
    doctorName: 'Dr. Bishoy Mina',
    clinicName: 'California Imaging Diagnostics Hub',
    restoration: 'coDiagnostiX Treatment Plan & Intra-Oral Scan',
    shade: 'Universal',
    status: 'Design' as OrderStatus,
    priority: 'Urgent' as Priority,
    dueDate: '2026-10-08',
    amount: 200,
    notes: 'Inter. 2026-09-28 • Urgent: No Scans Uploaded for Intra-Oral component. Waiting for IO file.',
    receivedAt: 'Mon Sep 28 14:13:07 -0400'
  } : {
    id: paramId,
    orderNumber: paramId.startsWith('ord-') ? `ORD-2024-${paramId.replace('ord-', '').padStart(3, '0')}` : `#${paramId}`,
    patientName: 'Alex Morgan',
    doctorName: 'Dr. Marcus Vance',
    clinicName: 'NY Smile Center (Align Chicago Hub)',
    restoration: 'Tooth-Supported Surgical Guide',
    shade: 'Universal',
    status: 'Design' as OrderStatus,
    priority: 'Urgent' as Priority,
    dueDate: '2026-10-08',
    amount: 485,
    notes: 'Verify nerve canal clearance at tooth #19 site. Use Straumann 3.5mm BLX sleeves.',
    receivedAt: '2026-09-28'
  });

  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [activeTab, setActiveTab] = useState<'overview' | 'suborders' | '3dviewer' | 'history'>('overview');

  // Interactive 3D / DICOM Multi-Planar Viewer controls
  const [sliceIndex, setSliceIndex] = useState(240);
  const [windowPreset, setWindowPreset] = useState<'bone' | 'soft' | 'enamel'>('bone');
  const [rotationAngle, setRotationAngle] = useState(45);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // Internal history & technician notes
  const [notes, setNotes] = useState([
    {
      id: 1,
      author: 'Alex M. (Operator #1016)',
      role: 'Senior CAD Specialist',
      date: '2 hours ago',
      text: displayOrder.notes || 'DICOM conversion completed. Tooth #14 bone density analyzed at 650 HU.'
    },
    {
      id: 2,
      author: displayOrder.doctorName,
      role: 'Prescribing Clinician',
      date: 'Yesterday, 16:40',
      text: 'Approved treatment plan revision 2. Sleeve offset calibrated to 9.0mm from implant head.'
    },
    {
      id: 3,
      author: 'System PACS Gateway',
      role: 'Automated Diagnostic Ingest',
      date: '3 days ago',
      text: `High-resolution CBCT slice archive uploaded from ${displayOrder.clinicName} (512 slices).`
    }
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([
      {
        id: Date.now(),
        author: 'Jessica Ruiz (Lab Director)',
        role: 'Current Operator',
        date: 'Just now',
        text: newNote
      },
      ...notes
    ]);
    setNewNote('');
  };

  const handleDownloadFile = (fileName: string) => {
    setDownloadNotification(`Preparing secure PACS download for "${fileName}"...`);
    setTimeout(() => {
      setDownloadNotification(null);
    }, 2800);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Header Bar with Back Button, Case Number, and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/flow')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Return to Production Flow"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Case {displayOrder.orderNumber}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0284c7]/10 text-[#0284c7] dark:text-sky-400 border border-[#0284c7]/25">
                modID: {modId} • Operator #{xid}
              </span>
              <StatusBadge status={displayOrder.status} />
              <PriorityBadge priority={displayOrder.priority} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Legacy Endpoint: <code className="text-[#0284c7] dark:text-sky-400 font-mono">OrderDetails.php?xid={xid};modID={modId};ID={paramId}</code>
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/edit-case?thisID=${paramId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit Case</span>
          </button>
        </div>
      </div>

      {/* Download Alert Toast */}
      <AnimatePresence>
        {downloadNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 size={15} />
            <span>{downloadNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated UI States (All 100% Functional) */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <LoadingState text={`Fetching 3D DICOM Slices & Sub-Orders for Case #${displayOrder.orderNumber}...`} />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <ErrorState
            title="Order Fetch Timeout (404 / 500)"
            message={`Unable to locate record for OrderID #${paramId} in secondary PACS cluster.`}
            code="ERR_ORDER_NOT_FOUND_404"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="Case Record Unassigned"
            description="This order has not yet been initialized with scanning center files or surgical parameters."
            action={
              <button
                onClick={() => setUiState('normal')}
                className="px-4 py-2 rounded-xl bg-[#0284c7] text-white font-bold text-xs"
              >
                Reload Live Record
              </button>
            }
          />
        </div>
      )}

      {/* Normal Live State */}
      {uiState === 'normal' && (
        <div className="space-y-4">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] rounded-t-2xl px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
            {[
              { id: 'overview', label: 'Order Overview & Clinician', icon: FileText },
              { id: 'suborders', label: 'Sub-Orders Matrix (Conv, TP, SG, Mod)', icon: Layers },
              { id: '3dviewer', label: '3D CAD / DICOM Multi-Planar Viewer', icon: Box },
              { id: 'history', label: `Internal History Notes (${notes.length})`, icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Left 2 Cols: Details Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Core Order Specification (OrderWithDetails)
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Received: {displayOrder.receivedAt || '2026-09-28'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{displayOrder.patientName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">ID: {displayOrder.id}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Treating Doctor</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{displayOrder.doctorName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{displayOrder.clinicName}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Scanning Facility</span>
                      <span className="font-bold text-[#0284c7] dark:text-sky-400 text-sm block mt-0.5">{displayOrder.clinicName.split('(')[0]}</span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">ScanID: #{modId}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Restoration / Guide Type</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{displayOrder.restoration}</span>
                      <span className="text-[10px] text-[#0284c7] dark:text-sky-400 block font-mono mt-0.5">Shade: {displayOrder.shade}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Surgical Protocol</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">Tooth-Supported</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Straumann VeloGuide</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Delivery Date</span>
                      <span className="font-bold text-amber-500 font-mono block mt-0.5">{displayOrder.dueDate}</span>
                      <span className="text-[10px] text-[#ea580c] block font-bold mt-0.5">⚡ {displayOrder.priority} SLA</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Progress Timeline */}
                <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Production Lifecycle & QC Milestones
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { step: '1. Scans Received', done: true, time: 'Ingested & Verified' },
                      { step: '2. DICOM Conv.', done: true, time: 'Segmentation Complete' },
                      { step: '3. Co-Diagnostix TP', current: displayOrder.status === 'Design', done: displayOrder.status === 'Completed', time: 'Virtual Implant Planning' },
                      { step: '4. Guide 3D CAM', current: displayOrder.status === 'Production', done: displayOrder.status === 'Completed', time: 'CAM Nesting & Print' },
                      { step: '5. Lab Dispatch', done: displayOrder.status === 'Completed', time: `Due ${displayOrder.dueDate}` },
                    ].map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs ${
                          m.done
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : m.current
                            ? 'bg-sky-500/15 border-sky-500/50 text-[#0284c7] dark:text-sky-300 font-black shadow-xs ring-1 ring-sky-400/40'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{m.step}</div>
                        <div className="text-[10px] mt-1 opacity-80">{m.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Attached Files & Download links */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Clinical File Assets</span>
                    <Download size={15} className="text-[#0284c7]" />
                  </h3>

                  <div className="space-y-2">
                    {[
                      { name: `${displayOrder.patientName.replace(' ', '_')}_CBCT_Scan.zip`, size: '142 MB', type: 'DICOM Archive' },
                      { name: 'Maxilla_Optical_Intraoral.stl', size: '18 MB', type: 'STL Mesh' },
                      { name: 'Co-Diagnostix_Plan_V2.pts', size: '4.2 MB', type: 'Planning Project' },
                      { name: 'Surgical_Protocol_Report.pdf', size: '1.8 MB', type: 'PDF Document' },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {f.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {f.type} • {f.size}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(f.name)}
                          className="p-1.5 rounded-lg bg-[#0284c7]/10 text-[#0284c7] dark:text-sky-400 hover:bg-[#0284c7] hover:text-white transition-colors cursor-pointer"
                          title="Download File"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voucher & Financial Status */}
                <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-xs space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Billing & Voucher Invoicing</div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Voucher Credit:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">Linked (#VCH-9921)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Total Order Cost:</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white font-mono">${displayOrder.amount}.00 USD</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SUB-ORDERS MATRIX */}
          {activeTab === 'suborders' && (
            <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sub-Orders Component Breakdown (taskOrderDetails.php)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Order #{displayOrder.orderNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Conversion Sub-Order', id: 'convID: 1044', status: 'Completed', op: 'Omar H.', file: '1016_conv.zip', badge: 'bg-emerald-500/10 text-emerald-600' },
                  { name: 'Treatment Planning (TP)', id: 'tpID: 8812', status: displayOrder.status === 'New' ? 'Pending' : 'Active In-Progress', op: 'Sarah K.', file: '1016_tp.pts', badge: 'bg-sky-500/10 text-sky-600' },
                  { name: 'Surgical Guide (SG)', id: 'sgID: 5502', status: displayOrder.status === 'Completed' ? 'Printed' : 'Queued for CAM', op: 'Jessica L.', file: '1016_guide.stl', badge: 'bg-orange-500/10 text-orange-600' },
                  { name: 'Model Work (MOD)', id: `modID: ${modId}`, status: 'Verified & Inspected', op: 'Alex M.', file: '1016_model.stl', badge: 'bg-purple-500/10 text-purple-600' },
                ].map((so, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{so.name}</div>
                    <div className="text-[10px] font-mono text-[#0284c7] dark:text-sky-400">{so.id}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${so.badge}`}>{so.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Operator: <strong>{so.op}</strong></div>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span>Asset: {so.file}</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(so.file)}
                        className="text-[#0284c7] hover:underline cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 3D CAD & DICOM MULTI-PLANAR VIEWER */}
          {activeTab === '3dviewer' && (
            <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Box size={16} className="text-[#0284c7]" />
                    <span>Interactive Co-Diagnostix & DICOM Multi-Planar Reconstruction</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live slice scroll, HU density inspection, and surgical guide surface alignment
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-[#0284c7] dark:text-sky-400 font-bold border border-sky-500/20">
                    512 x 512 x 480 Voxel Matrix
                  </span>
                </div>
              </div>

              {/* Viewer Control Strip */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Slice Slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                    Slice: <strong className="font-mono text-slate-900 dark:text-white">#{sliceIndex}/512</strong>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="512"
                    value={sliceIndex}
                    onChange={(e) => setSliceIndex(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                  />
                </div>

                {/* Window Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-bold mr-1">Window:</span>
                  {(['bone', 'soft', 'enamel'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWindowPreset(w)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        windowPreset === w
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {w === 'bone' ? 'Bone (HU 850)' : w === 'soft' ? 'Soft Tissue' : 'Enamel / Teeth'}
                    </button>
                  ))}
                </div>

                {/* 3D Rotation & Zoom */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRotationAngle((a) => (a + 45) % 360)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                    title="Rotate 3D Guide"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">{zoomLevel}%</span>
                </div>
              </div>

              {/* 3-View Multi-Planar Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Axial Slice View */}
                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-sky-400 bg-slate-900/80 px-2 py-0.5 rounded border border-sky-500/30">
                    Axial Plane (Z: {sliceIndex * 0.25}mm)
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                    Density: {windowPreset === 'bone' ? '780 HU' : '45 HU'}
                  </div>
                  {/* Visual Slice Graphic */}
                  <div
                    className="w-36 h-36 rounded-full border border-sky-500/40 flex items-center justify-center transition-transform"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-sky-400/60 animate-pulse flex items-center justify-center text-[10px] text-sky-300 font-mono">
                      Arch #{displayOrder.orderNumber}
                    </div>
                  </div>
                </div>

                {/* 2. Sagittal / Cross-Section View */}
                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-[#ea580c] bg-slate-900/80 px-2 py-0.5 rounded border border-orange-500/30">
                    Sagittal Cross-Section (X: 88mm)
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                    Sleeve Offset: 9.0mm
                  </div>
                  {/* Implant Silhouette */}
                  <div
                    className="w-24 h-32 border-2 border-emerald-500/60 rounded-xl flex flex-col items-center justify-center text-[10px] text-emerald-300 font-mono transition-transform"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    <div className="w-12 h-6 border-b-2 border-emerald-400/80 text-center text-[9px]">Sleeve</div>
                    <div className="w-8 h-16 bg-emerald-500/20 border border-emerald-400/50 rounded-b mt-1 flex items-center justify-center text-[9px]">
                      3.5x10
                    </div>
                  </div>
                </div>

                {/* 3. 3D Surface Surgical Guide Mesh */}
                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-purple-400 bg-slate-900/80 px-2 py-0.5 rounded border border-purple-500/30">
                    3D Surface Guide Mesh (STL)
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                    Angle: {rotationAngle}°
                  </div>
                  <div
                    className="w-36 h-24 bg-gradient-to-tr from-sky-600/30 via-indigo-600/30 to-purple-600/30 border border-sky-400/50 rounded-2xl flex flex-col items-center justify-center text-[10px] text-white font-bold transition-all"
                    style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)` }}
                  >
                    <Box size={22} className="text-sky-300 mb-1" />
                    <span>Surgical Guide STL</span>
                    <span className="text-[9px] font-mono text-sky-200">12,450 Triangles</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERNAL HISTORY NOTES */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Internal History Audit Trail (OrdersInternalHistory)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Case #{displayOrder.orderNumber}
                </span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Append clinical observation, CAD feedback, or doctor instructions..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  <Send size={13} />
                  <span>Post Note</span>
                </button>
              </form>

              {/* Note Stream */}
              <div className="space-y-2.5">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{n.author}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-[#0284c7] dark:text-sky-400 font-bold border border-sky-500/20">
                          {n.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{n.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
