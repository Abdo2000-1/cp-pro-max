import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConvertibleNav } from './ConvertibleNav';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col w-full bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden">
      {/* 1. Clean Top Navbar (Logo, Language Switcher, Theme Toggle ONLY) */}
      <ConvertibleNav
        position="top"
        onChangePosition={() => {}}
        collapsed={false}
        onToggleCollapse={() => {}}
        isDraggingNav={false}
        setIsDraggingNav={() => {}}
      />

      {/* 2. Main Workspace (Teeth Chart Centered) */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto p-2 sm:p-4 md:p-6 custom-scrollbar">
        <div className="w-full max-w-[1920px] mx-auto min-w-0 flex items-center justify-center">
          <Outlet />
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
