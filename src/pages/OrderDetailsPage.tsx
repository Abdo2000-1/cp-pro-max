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
  Printer,
  Mail,
  Share2,
  Paperclip,
  CheckSquare,
  Radio
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { DicomMprViewer } from '@/components/dicom/DicomMprViewer';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { MASTER_WORKFLOW_ORDERS, MasterWorkflowOrder, SubServiceItem } from '@/data/flowMockData';
import type { OrderStatus, Priority } from '@/types';

export default function OrderDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // URL Params matching: OrderDetails.php?xid=1016;reg=1;u=1;modID=288004;ID=504901 or ?ID=504901
  const paramId = searchParams.get('ID') || searchParams.get('id') || '504901';
  const modId = searchParams.get('modID') || '288004';
  const xid = searchParams.get('xid') || '1016';

  // Find matching case in MASTER_WORKFLOW_ORDERS for complete realistic business data
  const flowOrder = MASTER_WORKFLOW_ORDERS.find(
    (o) =>
      o.orderNum === paramId ||
      o.id === paramId ||
      paramId.includes(o.orderNum) ||
      o.orderNum.includes(paramId)
  ) || MASTER_WORKFLOW_ORDERS[0];

  // The primary service title serves as the main hook
  const primaryService = flowOrder.services[0] || {
    title: 'Treatment Plan & Surgical Guide',
    format: 'coDiagnostiX',
    typeCode: 'TP',
    actionLabel: 'IN PROGRESS',
    amount: 200,
    billTo: 'California Diagnostics CC: Master, 9903'
  };

  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [activeTab, setActiveTab] = useState<'prescription' | '3dviewer' | 'suborders'>('prescription');

  // Form Fields matching Image 1
  const [drSpecialRequest, setDrSpecialRequest] = useState<string>('');
  const [scSpecialRequest, setScSpecialRequest] = useState<string>('General');
  const [scSpecialValue, setScSpecialValue] = useState<string>('0');
  const [clientNote, setClientNote] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<'option1' | 'option2'>('option1');
  const [specialPreShippingOld, setSpecialPreShippingOld] = useState<string>('Standard courier delivery to main clinic address.');
  const [specialPreShippingNew, setSpecialPreShippingNew] = useState<string>('');

  // Internal Case Note (Old) Table Data (Exact Image 1 columns)
  const [oldNotes, setOldNotes] = useState([
    {
      id: 1,
      by: 'shrouk',
      to: 'CS',
      timeSent: '2026/Sep/28 02:14',
      history: '@cs please call the dr to check for the office working hours',
      attach: 'View'
    },
    {
      id: 2,
      by: 'shrouk',
      to: 'CS',
      timeSent: '2026/Sep/28 02:13',
      history: 'test add IH',
      attach: '-'
    }
  ]);

  // Composer Form State for New Internal Case Note
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [mailToSelected, setMailToSelected] = useState<Set<string>>(new Set(['CS']));
  const [ihTaskSelected, setIhTaskSelected] = useState<string>('CS');
  const [isRushTask, setIsRushTask] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Departments for "Send mail to" (12 options from Image 1)
  const MAIL_DEPARTMENTS = [
    'CS', 'Sales', 'TP', 'Ops', 'Finance', 'Guides',
    'Restorations', 'Production', 'Boston', 'Scanning Techs', 'CAD/CAM', 'QMS'
  ];

  // Departments for "Send IH task" (11 options from Image 1)
  const IH_TASK_DEPARTMENTS = [
    'CS', 'Sales', 'TP', 'Ops', 'Finance', 'Guides assembly',
    'Restorations EG', 'Production', 'Boston', 'Scanning Techs', 'CAD/CAM'
  ];

  const toggleMailDept = (dept: string) => {
    setMailToSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const handlePostInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${now.toLocaleString('en', { month: 'short' })}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry = {
      id: Date.now(),
      by: 'Jessica Ruiz',
      to: ihTaskSelected,
      timeSent: formattedDate,
      history: `${isRushTask ? '[RUSH] ' : ''}${newInternalNote.trim()}`,
      attach: '-'
    };

    setOldNotes([newEntry, ...oldNotes]);
    setNewInternalNote('');
    setFeedbackMessage('Internal Case Note appended and dispatched successfully!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Uploading Files state
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [uploadedFilesList, setUploadedFilesList] = useState([
    { name: `${flowOrder.patientName.replace(/\s+/g, '_')}_CBCT_Raw.zip`, size: '142 MB', type: 'DICOM Archive' },
    { name: 'Maxilla_Optical_Scan.stl', size: '18 MB', type: 'STL Mesh' },
    { name: 'Mandible_Optical_Scan.stl', size: '16 MB', type: 'STL Mesh' }
  ]);

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileName) return;
    setUploadedFilesList([
      { name: selectedFileName, size: '24 MB', type: 'Clinical Upload' },
      ...uploadedFilesList
    ]);
    setSelectedFileName('');
    setFeedbackMessage('File uploaded and linked to order archives!');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="space-y-4 w-full min-w-0 pb-12 select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. PRIMARY EYE HOOK (أول حاجة تيجي عليها العين: اسم السيرفيس) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-sky-900/40 via-[#0b101d] to-slate-900/60 p-5 rounded-3xl border border-sky-500/30 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border border-sky-500/50 text-sky-400 bg-sky-500/10">
                PRIMARY SERVICE HOOK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-purple-500/50 text-purple-400 bg-transparent">
                {flowOrder.source}
              </span>
              {isRushTask && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black border border-rose-500 text-rose-500 bg-rose-500/10 animate-pulse">
                  ⚡ RUSH ORDER
                </span>
              )}
            </div>

            {/* Giant Service Name Hook */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {primaryService.title} <span className="text-sky-400 font-bold text-xl">({primaryService.format || 'coDiagnostiX™'})</span>
            </h1>

            {/* Sub-services pills row */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs font-bold text-slate-400">Included Modules:</span>
              {flowOrder.services.map((sub, sIdx) => (
                <span
                  key={sub.id || sIdx}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900/80 text-slate-200 flex items-center gap-1.5"
                >
                  <span className="text-sky-400 font-mono font-black text-[10px]">{sub.typeCode}</span>
                  <span>{sub.title}</span>
                  <span className="text-emerald-400 font-mono text-[10.5px]">${sub.amount}.00</span>
                </span>
              ))}
            </div>
          </div>

          {/* Quick Order ID & Clinician Pill */}
          <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-mono text-slate-400">Order Reference</div>
              <div className="text-2xl font-black font-mono text-amber-500">#{flowOrder.orderNum}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/flow')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-sky-500 text-slate-300 text-xs font-bold transition-all cursor-pointer bg-transparent"
            >
              <ArrowLeft size={13} />
              <span>Back to Flow</span>
            </button>
          </div>

        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. SECTION NAVIGATION TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] rounded-2xl p-1 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('prescription')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'prescription'
              ? 'border border-sky-500/60 text-sky-600 dark:text-sky-400 bg-sky-500/10'
              : 'border border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>Official Prescription & Case Dispatch (Image 1)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('3dviewer')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === '3dviewer'
              ? 'border border-sky-500/60 text-sky-600 dark:text-sky-400 bg-sky-500/10'
              : 'border border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Box size={15} />
          <span>3D DICOM CAD & Co-Diagnostix™ Viewer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suborders')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'suborders'
              ? 'border border-sky-500/60 text-sky-600 dark:text-sky-400 bg-sky-500/10'
              : 'border border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={15} />
          <span>Sub-Orders Matrix ({flowOrder.services.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: EXACT IMAGE 1 PRESCRIPTION & CASE DISPATCH WORKFLOW    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'prescription' && (
        <div className="space-y-4">
          
          {/* A. Core Case Prescription Specification Table (Exact Image 1 Style) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm text-xs">
            
            {/* Header Cyan Banner Rows */}
            <div className="bg-[#bfe6f2] dark:bg-[#0d2838] border-b border-slate-300 dark:border-slate-700 divide-y divide-slate-300/80 dark:divide-slate-700/80">
              <div className="grid grid-cols-12 py-2 px-3">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Order ID</div>
                <div className="col-span-9 font-mono font-black text-slate-900 dark:text-white">{flowOrder.orderNum}</div>
              </div>
              <div className="grid grid-cols-12 py-2 px-3">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Scanning Center</div>
                <div className="col-span-9 font-semibold text-slate-800 dark:text-slate-300">{flowOrder.scanCenter || 'None'}</div>
              </div>
              <div className="grid grid-cols-12 py-2 px-3">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Doctor</div>
                <div className="col-span-9 font-bold text-slate-900 dark:text-white">{flowOrder.doctorName}</div>
              </div>
              <div className="grid grid-cols-12 py-2 px-3">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Patient Name</div>
                <div className="col-span-9 font-bold text-slate-900 dark:text-white">{flowOrder.patientName}</div>
              </div>
            </div>

            {/* Form Fields: Dr Special Request, Sc Special Request, Client Note */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              
              {/* Dr. Special Request */}
              <div className="grid grid-cols-12 py-2.5 px-3 items-center">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Dr. Special Request</div>
                <div className="col-span-9">
                  <input
                    type="text"
                    value={drSpecialRequest}
                    onChange={(e) => setDrSpecialRequest(e.target.value)}
                    placeholder="Enter clinician specific surgical or restoration requests..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Sc. Special Request */}
              <div className="grid grid-cols-12 py-2.5 px-3 items-center">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Sc. Special Request</div>
                <div className="col-span-9 flex items-center gap-4">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{scSpecialRequest}</span>
                  <span className="text-slate-400">|</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{scSpecialValue}</span>
                </div>
              </div>

              {/* Client Note */}
              <div className="grid grid-cols-12 py-2.5 px-3 items-center">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Client Note</div>
                <div className="col-span-9">
                  <input
                    type="text"
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                    placeholder="Add client portal communication notes..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* B. Internal Case Note(Old) Table (Exact Image 1 layout) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm space-y-0 text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Internal Case Note(Old)</span>
              <span className="text-[11px] font-mono text-slate-400">{oldNotes.length} historical records</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black text-white font-extrabold text-[11px]">
                  <th className="py-2 px-3 w-[12%]">By</th>
                  <th className="py-2 px-3 w-[10%]">To</th>
                  <th className="py-2 px-3 w-[22%]">Time Sent</th>
                  <th className="py-2 px-3 w-[46%]">History</th>
                  <th className="py-2 px-3 w-[10%] text-center">Attach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
                {oldNotes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{n.by}</td>
                    <td className="py-2 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">{n.to}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{n.timeSent}</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{n.history}</td>
                    <td className="py-2 px-3 text-center">
                      {n.attach === 'View' ? (
                        <span className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer">
                          View
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* C. Internal Case Note & Task Dispatcher System (Exact Image 1 3-Column Box) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
              Internal Case Note & Task Dispatcher
            </div>

            <form onSubmit={handlePostInternalNote} className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 1. Left: Internal Case Note Textarea */}
                <div className="lg:col-span-5 space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block">
                    Internal Case Note
                  </label>
                  <textarea
                    rows={6}
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    placeholder="Type internal case instruction, doctor phone notes, or lab coordination message..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium"
                  />
                </div>

                {/* 2. Middle: Send mail to (Checkboxes) */}
                <div className="lg:col-span-4 border-l border-slate-200 dark:border-slate-800 pl-4 space-y-1.5">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300">
                    Send mail to
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {MAIL_DEPARTMENTS.map((dept) => {
                      const isChecked = mailToSelected.has(dept);
                      return (
                        <label key={dept} className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-sky-500">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMailDept(dept)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span>{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Right: Send IH task (Radios) & Priority RUSH */}
                <div className="lg:col-span-3 border-l border-slate-200 dark:border-slate-800 pl-4 space-y-2">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300">
                    Send IH task
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] max-h-40 overflow-y-auto pr-1">
                    {IH_TASK_DEPARTMENTS.map((dept) => (
                      <label key={dept} className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-sky-500">
                        <input
                          type="radio"
                          name="ihTaskTarget"
                          value={dept}
                          checked={ihTaskSelected === dept}
                          onChange={() => setIhTaskSelected(dept)}
                          className="border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">{dept}</span>
                      </label>
                    ))}
                  </div>

                  {/* Priority Checkbox: RUSH task in bold red */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-slate-500 text-[10px] font-bold uppercase">Priority:</div>
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={isRushTask}
                        onChange={(e) => setIsRushTask(e.target.checked)}
                        className="rounded border-rose-500 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-rose-600 dark:text-rose-400 font-black text-xs tracking-wide">
                        RUSH task
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Submit Dispatch Action */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-sky-500/60 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold text-xs transition-all cursor-pointer bg-transparent"
                >
                  <Send size={13} />
                  <span>Dispatch Note & Notify Departments</span>
                </button>
              </div>
            </form>
          </div>

          {/* D. Special Pre-Shipping Instructions (Old & New) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm p-4 space-y-3 text-xs">
            <div>
              <div className="font-extrabold text-slate-700 dark:text-slate-300">
                Special Pre Shipping Instruction (Old) :
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 mt-1 font-mono">
                {specialPreShippingOld}
              </div>
            </div>

            <div>
              <div className="font-extrabold text-slate-700 dark:text-slate-300">
                Special Pre Shipping Instruction
              </div>
              <textarea
                rows={3}
                value={specialPreShippingNew}
                onChange={(e) => setSpecialPreShippingNew(e.target.value)}
                placeholder="Specify sterile packaging instructions, delivery time constraints, or customs codes..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium mt-1"
              />
            </div>
          </div>

          {/* E. Registration Type (Option 1 / Option 2) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-[#0b101d] shadow-sm text-xs flex items-center gap-6">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">
              Registration Type :
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 font-bold">
                <input
                  type="radio"
                  name="registrationType"
                  value="option1"
                  checked={registrationType === 'option1'}
                  onChange={() => setRegistrationType('option1')}
                  className="border-slate-300 text-sky-600"
                />
                <span>Option 1</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 font-bold">
                <input
                  type="radio"
                  name="registrationType"
                  value="option2"
                  checked={registrationType === 'option2'}
                  onChange={() => setRegistrationType('option2')}
                  className="border-slate-300 text-sky-600"
                />
                <span>Option 2</span>
              </label>
            </div>
          </div>

          {/* F. Uploading Files Section (Exact Image 1) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-[#0b101d] shadow-sm text-xs space-y-3">
            <form onSubmit={handleFileUpload} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  * Uploading Files
                </span>
                <input
                  type="text"
                  placeholder="Select a File or enter file name..."
                  value={selectedFileName}
                  onChange={(e) => setSelectedFileName(e.target.value)}
                  className="flex-1 max-w-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-transparent text-slate-900 dark:text-white"
                />
              </div>

              {/* Green Upload File Button matching Image 1 */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Upload File
                </button>
              </div>
            </form>

            {/* List of Uploaded Assets */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Linked Archive Files</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {uploadedFilesList.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{f.type} • {f.size}</div>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded text-sky-500 hover:text-sky-600"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CLINICAL 3D DICOM CAD & CO-DIAGNOSTIX VIEWPORT         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === '3dviewer' && (
        <DicomMprViewer
          orderNumber={flowOrder.orderNum}
          patientName={flowOrder.patientName}
          implantSite="Tooth #19 (Mandibular 1st Molar)"
          implantModel="Straumann® BLT Ø4.1mm RC x 10mm"
          sleeveModel="T-Sleeve Straumann (Ø5.0mm, H: 5mm)"
          sleeveOffset={9.0}
          nerveClearance={3.2}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SUB-ORDERS MATRIX BREAKDOWN                           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'suborders' && (
        <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-[#0b101d] space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Case #{flowOrder.orderNum} Sub-Orders Breakdown
              </h3>
              <p className="text-xs text-slate-400">All services billed and tracked under this master order</p>
            </div>
            <span className="font-mono text-xs font-black text-emerald-500">
              Total: ${flowOrder.services.reduce((a, s) => a + s.amount, 0)}.00 USD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flowOrder.services.map((sub, srvIdx) => (
              <div
                key={sub.id || srvIdx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black border border-sky-500/50 text-sky-500 bg-transparent">
                      {sub.typeCode}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {sub.title}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-500">
                    ${sub.amount}.00
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>Format: <strong className="text-slate-700 dark:text-slate-300">{sub.format}</strong></div>
                  <div>Anatomical Jaws: <strong className="text-slate-700 dark:text-slate-300">Max: {sub.maxilla} • Mand: {sub.mandible}</strong></div>
                  <div>Bill To: <span className="text-slate-700 dark:text-slate-300 truncate block">{sub.billTo}</span></div>
                  <div>Received: <span className="font-mono text-[10px] text-slate-400">{sub.receivedTime}</span></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">CS Task: {sub.csTask.assignee || 'Unassigned'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-500/40 text-sky-500 bg-transparent">
                    {sub.actionLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
