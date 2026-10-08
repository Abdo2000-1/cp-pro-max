import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  FilePlus2,
  FileText,
  TrendingUp,
  Boxes,
  LayoutDashboard,
  Users2,
  FileEdit,
  GripVertical,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  PanelLeftClose,
  PanelRightClose,
  PanelTopClose,
  PanelBottomClose,
  Check,
  ChevronDown,
  Compass,
  UserCheck
} from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { useStore } from '@/hooks/useStore';
import { ProfileModal } from './ProfileModal';

export type NavPosition = 'top' | 'left' | 'right' | 'bottom';

interface ConvertibleNavProps {
  position: NavPosition;
  onChangePosition: (pos: NavPosition) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isDraggingNav: boolean;
  setIsDraggingNav: (dragging: boolean) => void;
  onOpenMobile?: () => void;
}

export function ConvertibleNav({
  position,
  onChangePosition,
  collapsed,
  onToggleCollapse,
  isDraggingNav,
  setIsDraggingNav,
}: ConvertibleNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeContext();
  const { language, setLanguage, currentOption, t } = useLanguage();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [dockPickerOpen, setDockPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [opsMenuOpen, setOpsMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const dockPickerRef = useRef<HTMLDivElement>(null);
  const opsMenuRef = useRef<HTMLDivElement>(null);

  const profile = useStore((s) => s.getProfile());

  // 8 Target Pages from 3DDX CP (Strictly Clean - No colored badges per Image 3)
  const targetNavItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'flow',
      label: t('nav.flow', 'Master Orders Flow'),
      path: '/flow',
      icon: Layers,
    },
    {
      id: 'addCase',
      label: t('nav.addCase', 'Add New Case'),
      path: '/add-case',
      icon: FilePlus2,
    },
    {
      id: 'orderDetails',
      label: t('nav.orderDetails', 'Order Details'),
      path: '/order-details',
      icon: FileText,
    },
    {
      id: 'quarterTargets',
      label: t('nav.quarterTargets', 'Quarter Targets'),
      path: '/quarter-targets',
      icon: TrendingUp,
    },
    {
      id: 'task47',
      label: t('nav.task47', 'Task 47: Models'),
      path: '/task-47',
      icon: Boxes,
    },
    {
      id: 'task31',
      label: t('nav.task31', 'Task 31: Staff Targets'),
      path: '/task-31',
      icon: Users2,
    },
    {
      id: 'editCase',
      label: t('nav.editCase', 'Edit Case'),
      path: '/edit-case',
      icon: FileEdit,
    },
  ];

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (dockPickerRef.current && !dockPickerRef.current.contains(e.target as Node)) {
        setDockPickerOpen(false);
      }
      if (opsMenuRef.current && !opsMenuRef.current.contains(e.target as Node)) {
        setOpsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // HTML5 Drag Handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', position);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingNav(true);
  };

  const handleDragEnd = () => {
    setIsDraggingNav(false);
  };

  // Pointer drag for instant hand-dragging without native browser drag quirks
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingNav(true);

    const onPointerMove = (moveEvt: PointerEvent) => {
      // Broadcast drag event or allow layout to catch position
      const clientX = moveEvt.clientX;
      const clientY = moveEvt.clientY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      // Check docking proximity
      if (clientY < 80) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'top' }));
      } else if (clientY > winH - 80) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'bottom' }));
      } else if (clientX < 140) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'left' }));
      } else if (clientX > winW - 140) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'right' }));
      } else {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: null }));
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setIsDraggingNav(false);

      const clientX = upEvt.clientX;
      const clientY = upEvt.clientY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (clientY < 100) {
        onChangePosition('top');
      } else if (clientY > winH - 100) {
        onChangePosition('bottom');
      } else if (clientX < 160) {
        onChangePosition('left');
      } else if (clientX > winW - 160) {
        onChangePosition('right');
      }
      window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: null }));
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const isVertical = position === 'left' || position === 'right';

  // ==========================================
  // RENDER: HORIZONTAL BAR (TOP OR BOTTOM)
  // ==========================================
  if (!isVertical) {
    return (
      <>
        <header
          className={`w-full border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md shadow-xs select-none transition-all duration-200 z-40 ${
            position === 'top' ? 'sticky top-0 border-b' : 'fixed bottom-0 left-0 right-0 border-t shadow-2xl'
          }`}
        >
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Left: Company Logo ONLY */}
            <NavLink to="/teeth-chart" className="flex items-center group" title="3D Diagnostix">
              <div className="h-10 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center shadow-xs hover:border-[#0284c7] transition-colors">
                <img
                  src="/logo-3ddx-full.png"
                  alt="3D Diagnostix"
                  className="h-7 w-auto object-contain"
                />
              </div>
            </NavLink>

            {/* Right: Language Switcher & Day/Night Theme Toggle ONLY */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Change System Language"
                >
                  <span className="text-base">{currentOption.flag}</span>
                  <span className="font-extrabold text-xs uppercase">{currentOption.nativeName}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-slide-up">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      {language === 'ar' ? 'اختر اللغة' : 'Select Language'}
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          language === lang.code
                            ? 'bg-[#0284c7]/15 text-[#0284c7] dark:text-sky-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </div>
                        {language === lang.code && <Check size={14} className="text-[#0284c7]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Day / Night Theme Toggle */}
              <button
                onClick={toggleTheme}
                type="button"
                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0284c7] border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title={theme === 'dark' ? (language === 'ar' ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode') : (language === 'ar' ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode')}
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                ) : (
                  <Moon size={18} className="text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </header>
      </>
    );
  }

  // ==========================================
  // RENDER: VERTICAL SIDEBAR (LEFT OR RIGHT)
  // ==========================================
  return (
    <>
      <aside
        className={`hidden lg:flex flex-col h-screen shrink-0 bg-white dark:bg-[#070b14] select-none transition-all duration-200 relative z-40 ${
          position === 'left' ? 'border-r' : 'border-l order-last'
        } border-slate-200/80 dark:border-slate-800/80 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header & Logo */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src="/logo-3ddx-full.png"
                alt="3DDX"
                className="h-6 w-auto object-contain"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  CP PRO MAX
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-xs font-black tracking-tight text-[#0284c7]">3DDX</span>
            </div>
          )}

          {/* Drag Handle to dock anywhere */}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDownDrag}
            title={t('action.dragHandle', 'Click & drag with hand/mouse to dock at any edge')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripHorizontal size={18} />
          </div>
        </div>

        {/* Dock Switcher / Collapse Bar */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-2' : 'justify-between px-3 py-1.5'} border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50`}>
          {/* Toggle back to Top Navbar */}
          <button
            onClick={() => onChangePosition('top')}
            type="button"
            title="Dock as Top Navbar"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#0284c7] hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          >
            <PanelTopClose size={12} className="text-[#0284c7]" />
            {!collapsed && <span>Dock Top</span>}
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            type="button"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Target Nav Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {targetNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/flow' && (location.pathname === '/orders' || location.pathname === '/flow'));
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0284c7]/20 to-[#ea580c]/10 text-[#0284c7] dark:text-sky-300 border-l-2 border-[#0284c7] shadow-xs'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-[#0284c7] dark:text-sky-400 drop-shadow-[0_0_6px_rgba(2,132,199,0.5)]' : 'text-slate-400 group-hover:text-[#0284c7]'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer: Profile, Language & Theme */}
        <div className={`p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 ${collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
          
          {/* Profile Trigger Button in Sidebar */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-1.5' : 'gap-2 px-2 py-1.5'} rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer`}
            title="Technician Profile"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#ea580c] text-[10px] font-black text-white shrink-0">
              {profile?.avatarInitials || '3D'}
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                </span>
                <span className="text-[9px] text-[#ea580c] font-bold">CP Specialist</span>
              </div>
            )}
          </button>

          <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'justify-between px-1'}`}>
            <button
              onClick={() => {
                const nextIndex = (LANGUAGES.findIndex((l) => l.code === language) + 1) % LANGUAGES.length;
                setLanguage(LANGUAGES[nextIndex].code);
              }}
              className="flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-black"
              title={`Language: ${currentOption.nativeName}`}
            >
              <span>{currentOption.flag}</span>
              {!collapsed && <span>{currentOption.code.toUpperCase()}</span>}
            </button>

            <button
              onClick={toggleTheme}
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-[#0284c7]"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Interactive Profile Credentials Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
