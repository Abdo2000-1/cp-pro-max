import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts';
import { 
  Calendar, AlertCircle, FileText, ClipboardList, CheckCircle2, 
  Activity, ArrowUpRight, DollarSign, Clock, RefreshCw, ChevronRight, ChevronLeft, Bell,
  TrendingUp, BarChart3, LineChart as LineChartIcon, ScanLine, ShieldAlert, Sparkles,
  Layers, Filter, Download, ExternalLink, Maximize2, Minimize2, Check, Target, PieChart,
  SlidersHorizontal, Database
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, formatCurrency, timeAgo } from '@/utils/format';
import { sound } from '@/utils/sound';

// 3DDX Strictly Brand Colors
const BRAND_BLUE = '#0284c7';
const BRAND_ORANGE = '#ea580c';
const BRAND_ORANGE_LIGHT = '#f97316';
const BRAND_BLUE_LIGHT = '#38bdf8';

// Custom Power BI / 3DDX Glassmorphic Tooltip
const BrandChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-black/95 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs min-w-[170px] space-y-1.5 select-none">
        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
          <span className="font-extrabold text-slate-200">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0284c7]/20 text-sky-400 font-mono font-bold">
            Power BI
          </span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="font-semibold">{entry.name}:</span>
            </span>
            <span className="font-bold font-mono text-white text-xs">
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'powerbi' | 'telemetry'>('powerbi');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q4');
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const urgentScrollRef = useRef<HTMLDivElement>(null);

  const allOrders = useStore((s) => s.getOrders());
  const allCases = useStore((s) => s.getCases());
  const allNotifs = useStore((s) => s.getNotifications());
  const changeRequests = useStore((s) => s.getChangeRequests());

  const handleRefresh = () => {
    setRefreshing(true);
    sound.playPop?.();
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const scrollUrgent = (dir: 'left' | 'right') => {
    if (urgentScrollRef.current) {
      urgentScrollRef.current.scrollBy({
        left: dir === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
      sound.playClick?.();
    }
  };

  const urgentOrders = allOrders.filter((o) => o.priority === 'Urgent');
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Power BI Quarterly KPI Datasets (Strictly 3DDX Brand Identity)
  const quarterData = useMemo(() => {
    return [
      { month: 'Jul', actualRevenue: 245000, targetRevenue: 260000, guides: 1120, plans: 620, attainment: 94.2 },
      { month: 'Aug', actualRevenue: 278000, targetRevenue: 270000, guides: 1240, plans: 710, attainment: 102.9 },
      { month: 'Sep', actualRevenue: 289000, targetRevenue: 280000, guides: 1310, plans: 750, attainment: 103.2 },
      { month: 'Oct', actualRevenue: 295000, targetRevenue: 300000, guides: 1380, plans: 790, attainment: 98.3 },
      { month: 'Nov (Proj)', actualRevenue: 310000, targetRevenue: 310000, guides: 1450, plans: 830, attainment: 100.0 },
      { month: 'Dec (Proj)', actualRevenue: 335000, targetRevenue: 320000, guides: 1520, plans: 880, attainment: 104.6 },
    ];
  }, []);

  const serviceDistribution = [
    { name: 'Surgical Guides (SG)', units: 3420, revenue: 410400, color: BRAND_BLUE, share: '45%' },
    { name: 'Treatment Planning (TP)', units: 1890, revenue: 283500, color: BRAND_ORANGE, share: '31%' },
    { name: 'Model Work (MOD)', units: 980, revenue: 117600, color: '#0369a1', share: '13%' },
    { name: 'Temp/Final Restorations', units: 640, revenue: 96000, color: '#c2410c', share: '11%' },
  ];

  const regionalHubs = [
    { hub: '3DDX Boston Radiology Hub', target: 350000, actual: 342000, percent: 97.7, lead: 'Dr. Sarah Jenkins' },
    { hub: 'Align Chicago CAD Lab', target: 280000, actual: 289500, percent: 103.4, lead: 'Bishoy Mina' },
    { hub: 'Dallas Imaging & CAD Facility', target: 190000, actual: 181200, percent: 95.3, lead: 'Marcus Vance' },
    { hub: 'NYC Dental Diagnostics Hub', target: 150000, actual: 156800, percent: 104.5, lead: 'Elena Rostova' },
  ];

  return (
    <div className={`space-y-6 w-full min-w-0 select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-y-auto' : ''}`}>
      
      {/* Top Header & Brand Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#070b14] p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              CP PRO MAX Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white shadow-xs">
              Power BI Live
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#0284c7]" />
            {formatDate(new Date().toISOString())} • 3D Diagnostix Dental CAD/CAM & Co-Diagnostix Lab Intelligence
          </p>
        </div>

        {/* View Mode & Power BI Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Studio Tab Switcher */}
          <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('powerbi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'powerbi'
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={15} />
              <span>Power BI Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-gradient-to-r from-[#ea580c] to-[#c2410c] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity size={15} />
              <span>CAD Production Queue</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Power BI Full Screen Presentation'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh Power BI Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0284c7]' : ''}`} />
          </button>
        </div>
      </div>

      {/* RUSH CRITICAL ORDERS BAR */}
      {urgentOrders.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-rose-500" />
              <span>Critical Production Rush ({urgentOrders.length}):</span>
            </span>
          </div>

          <div
            ref={urgentScrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth py-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            {urgentOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(`/order-details?id=${order.id}`)}
                className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border border-rose-200 dark:border-rose-900/80 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="font-mono text-[#0284c7]">{order.orderNumber}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{order.patientName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500 text-white">
                  Due {formatDate(order.dueDate)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => scrollUrgent('left')}
              className="p-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-white/70 dark:bg-slate-900/70 text-rose-600"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => scrollUrgent('right')}
              className="p-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-white/70 dark:bg-slate-900/70 text-rose-600"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: POWER BI ENTERPRISE ANALYTICS & QUARTER TARGETS    */}
      {/* ========================================================= */}
      {activeTab === 'powerbi' && (
        <div className="space-y-6">
          
          {/* Power BI Workspace Header Ribbon */}
          <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#ea580c] flex items-center justify-center font-black text-sm text-white shadow-md">
                PBI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm tracking-tight text-white">
                    Power BI Embedded • Executive Quarter Targets Model
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Fabric Direct Lake Active
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Dataset: [3DDX_CP_PRO_MAX_DW].[v_QuarterlyTargetAttainment] • Refresh Rate: 15s
                </span>
              </div>
            </div>

            {/* Quarter Filter Slicers */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
              {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    selectedQuarter === q
                      ? 'bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Core Power BI DAX KPI Tiles (3DDX Brand Blue & Orange Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Quarter Revenue Target Attainment */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Q4 Target Attainment
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284c7]">
                  <Target size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">99.4%</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> +6.8% YoY
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0284c7] to-[#ea580c] rounded-full" style={{ width: '99.4%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Actual: $812,000</span>
                  <span>Target: $816,000</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Surgical Guides Quota */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Surgical Guides (SG)
                </span>
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c]">
                  <ClipboardList size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">3,420</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> +12.4%
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ea580c] rounded-full" style={{ width: '97.7%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Quota: 3,500</span>
                  <span>Gap: -80 units</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Co-Diagnostix Treatment Plans */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Co-Dx Plans (TP)
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284c7]">
                  <Activity size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">1,890</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> +105%
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0284c7] rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Quota: 1,800</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+90 Exceeded</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Lab Turnaround Velocity */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg. Turnaround Time
                </span>
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c]">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">2.1 Days</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <CheckCircle2 size={13} /> Within SLA
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0284c7] to-[#ea580c] rounded-full" style={{ width: '84%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Target SLA: &lt; 2.5d</span>
                  <span>QC Pass Rate: 99.1%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Main Power BI Analytical Charts (Area & Target Comparison) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Monthly Target vs Actual Revenue Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-[#0284c7]" size={18} />
                    <span>Quarter Target vs Actual Billed Revenue</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Co-Diagnostix CAD/CAM Production Trajectory ($ USD)
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-bold border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setChartView('area')}
                    className={`px-3 py-1 rounded-lg transition-colors ${chartView === 'area' ? 'bg-white dark:bg-slate-800 text-[#0284c7] shadow-xs' : 'text-slate-500'}`}
                  >
                    Smooth Area
                  </button>
                  <button
                    onClick={() => setChartView('bar')}
                    className={`px-3 py-1 rounded-lg transition-colors ${chartView === 'bar' ? 'bg-white dark:bg-slate-800 text-[#ea580c] shadow-xs' : 'text-slate-500'}`}
                  >
                    Target Bars
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'area' ? (
                    <AreaChart data={quarterData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="brandBlueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND_BLUE} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={BRAND_BLUE} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="brandOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<BrandChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="actualRevenue"
                        name="Actual Revenue"
                        stroke={BRAND_BLUE}
                        strokeWidth={3}
                        fill="url(#brandBlueGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="targetRevenue"
                        name="Target Quota"
                        stroke={BRAND_ORANGE}
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        fill="url(#brandOrangeGrad)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={quarterData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<BrandChartTooltip />} />
                      <Bar dataKey="actualRevenue" name="Actual Revenue" fill={BRAND_BLUE} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="targetRevenue" name="Target Quota" fill={BRAND_ORANGE} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                  <span className="text-slate-700 dark:text-slate-300">Actual Revenue ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ea580c]" />
                  <span className="text-slate-700 dark:text-slate-300">Quarter Target Quota ($)</span>
                </div>
              </div>
            </div>

            {/* Right Column: Service Revenue Contribution Matrix */}
            <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="text-[#ea580c]" size={18} />
                  <span>Service Line Share</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Production volume & yield by category
                </p>

                <div className="mt-5 space-y-3.5">
                  {serviceDistribution.map((item) => (
                    <div key={item.name} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                        <span className="font-mono font-black" style={{ color: item.color }}>
                          {item.share}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: item.share, backgroundColor: item.color }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
                        <span>{item.units} units fabricated</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/quarter-targets')}
                className="w-full mt-4 py-2.5 rounded-2xl bg-[#0284c7]/10 hover:bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#0284c7] dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Open Full Quarter Targets Matrix</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>

          {/* Regional Diagnostic Hubs & Quota Performance Table */}
          <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="text-[#0284c7]" size={18} />
                  <span>Regional Diagnostic Hubs Attainment</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Direct production quotas assigned to 3DDX Scan Centers
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-[#0284c7]">
                Active Hubs: 4
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px] pb-2">
                    <th className="py-2 px-3">Diagnostic Hub</th>
                    <th className="py-2 px-3">Lead Clinician</th>
                    <th className="py-2 px-3">Quarter Target</th>
                    <th className="py-2 px-3">Actual Achieved</th>
                    <th className="py-2 px-3">Attainment %</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold text-slate-800 dark:text-slate-200">
                  {regionalHubs.map((hub) => (
                    <tr key={hub.hub} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {hub.hub}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        {hub.lead}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {formatCurrency(hub.target)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0284c7] dark:text-sky-400">
                        {formatCurrency(hub.actual)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(hub.percent, 100)}%`,
                                backgroundColor: hub.percent >= 100 ? BRAND_ORANGE : BRAND_BLUE,
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs">{hub.percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hub.percent >= 100
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        }`}>
                          {hub.percent >= 100 ? 'Target Exceeded' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CAD TELEMETRY & PRODUCTION QUEUE                   */}
      {/* ========================================================= */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Recent Orders Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Live Intake Orders</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Cases queued across scan hubs
                </p>
              </div>
              <button
                onClick={() => navigate('/flow')}
                className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
              >
                <span>Open Master Flow Matrix</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px] pb-2">
                    <th className="py-2 px-3">Order #</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/order-details?id=${o.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0284c7] dark:text-sky-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white truncate max-w-[120px]">
                        {o.patientName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {o.restoration}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0284c7]/10 text-[#0284c7] dark:text-sky-300">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {timeAgo(o.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Workflow Activity Feed */}
          <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-[#ea580c]" />
                <span>PACS Audit Activity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Real-time doctor approvals & DICOM sync
              </p>

              <div className="mt-4 space-y-3.5">
                {allNotifs.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/flow')}
              className="w-full mt-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              Inspect Active Cases
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
