import React, { useState } from 'react';
import { 
  ToothOdontoData, 
  RestorationType, 
  ToothSystem, 
  ODONTO_DATABASE, 
  RESTORATION_TYPES 
} from './TeethChart';

export interface RealisticToothData {
  num: number;
  fdi: number;
  name: string;
  nameAr: string;
  category: 'molar' | 'premolar' | 'canine' | 'incisor_lat' | 'incisor_cen';
  arch: 'upper' | 'lower';
  quadrant: 'UR' | 'UL' | 'LL' | 'LR';
  isAnterior: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  badgeX: number;
  badgeY: number;
}

export const REALISTIC_TEETH_DATA: RealisticToothData[] = [
  // Upper Arch (1 to 16) - Roots reach UP, crowns reach DOWN
  { num: 1,  fdi: 18, name: 'Upper Right 3rd Molar (Wisdom)', nameAr: 'ضرس العقل العلوي الأيمن', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false, x: 9, y: 109, w: 42, h: 215, badgeX: 30, badgeY: 231 },
  { num: 2,  fdi: 17, name: 'Upper Right 2nd Molar', nameAr: 'الضرس الثاني العلوي الأيمن', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false, x: 45, y: 65, w: 52, h: 259, badgeX: 66, badgeY: 242 },
  { num: 3,  fdi: 16, name: 'Upper Right 1st Molar', nameAr: 'الضرس الأول العلوي الأيمن', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false, x: 91, y: 57, w: 63, h: 267, badgeX: 122, badgeY: 252 },
  { num: 4,  fdi: 15, name: 'Upper Right 2nd Premolar', nameAr: 'الضاحك الثاني العلوي الأيمن', category: 'premolar', arch: 'upper', quadrant: 'UR', isAnterior: false, x: 148, y: 68, w: 65, h: 256, badgeX: 181, badgeY: 260 },
  { num: 5,  fdi: 14, name: 'Upper Right 1st Premolar', nameAr: 'الضاحك الأول العلوي الأيمن', category: 'premolar', arch: 'upper', quadrant: 'UR', isAnterior: false, x: 207, y: 56, w: 74, h: 268, badgeX: 240, badgeY: 257 },
  { num: 6,  fdi: 13, name: 'Upper Right Canine (Cuspid)', nameAr: 'الناب العلوي الأيمن', category: 'canine', arch: 'upper', quadrant: 'UR', isAnterior: true, x: 275, y: 19, w: 78, h: 305, badgeX: 317, badgeY: 257 },
  { num: 7,  fdi: 12, name: 'Upper Right Lateral Incisor', nameAr: 'القاطع الجانبي العلوي الأيمن', category: 'incisor_lat', arch: 'upper', quadrant: 'UR', isAnterior: true, x: 347, y: 30, w: 78, h: 278, badgeX: 384, badgeY: 258 },
  { num: 8,  fdi: 11, name: 'Upper Right Central Incisor', nameAr: 'القاطع المركزي العلوي الأيمن', category: 'incisor_cen', arch: 'upper', quadrant: 'UR', isAnterior: true, x: 419, y: 54, w: 88, h: 256, badgeX: 461, badgeY: 257 },
  { num: 9,  fdi: 21, name: 'Upper Left Central Incisor', nameAr: 'القاطع المركزي العلوي الأيسر', category: 'incisor_cen', arch: 'upper', quadrant: 'UL', isAnterior: true, x: 501, y: 57, w: 88, h: 252, badgeX: 548, badgeY: 257 },
  { num: 10, fdi: 22, name: 'Upper Left Lateral Incisor', nameAr: 'القاطع الجانبي العلوي الأيسر', category: 'incisor_lat', arch: 'upper', quadrant: 'UL', isAnterior: true, x: 583, y: 41, w: 78, h: 264, badgeX: 625, badgeY: 258 },
  { num: 11, fdi: 23, name: 'Upper Left Canine (Cuspid)', nameAr: 'الناب العلوي الأيسر', category: 'canine', arch: 'upper', quadrant: 'UL', isAnterior: true, x: 655, y: 14, w: 73, h: 310, badgeX: 691, badgeY: 256 },
  { num: 12, fdi: 24, name: 'Upper Left 1st Premolar', nameAr: 'الضاحك الأول العلوي الأيسر', category: 'premolar', arch: 'upper', quadrant: 'UL', isAnterior: false, x: 722, y: 57, w: 70, h: 267, badgeX: 759, badgeY: 254 },
  { num: 13, fdi: 25, name: 'Upper Left 2nd Premolar', nameAr: 'الضاحك الثاني العلوي الأيسر', category: 'premolar', arch: 'upper', quadrant: 'UL', isAnterior: false, x: 786, y: 60, w: 69, h: 264, badgeX: 819, badgeY: 254 },
  { num: 14, fdi: 26, name: 'Upper Left 1st Molar', nameAr: 'الضرس الأول العلوي الأيسر', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false, x: 849, y: 59, w: 72, h: 265, badgeX: 886, badgeY: 248 },
  { num: 15, fdi: 27, name: 'Upper Left 2nd Molar', nameAr: 'الضرس الثاني العلوي الأيسر', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false, x: 915, y: 64, w: 61, h: 260, badgeX: 950, badgeY: 236 },
  { num: 16, fdi: 28, name: 'Upper Left 3rd Molar (Wisdom)', nameAr: 'ضرس العقل العلوي الأيسر', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false, x: 970, y: 87, w: 45, h: 237, badgeX: 997, badgeY: 229 },

  // Lower Arch (17 to 32) - Roots reach DOWN, crowns reach UP
  { num: 17, fdi: 38, name: 'Lower Left 3rd Molar (Wisdom)', nameAr: 'ضرس العقل السفلي الأيسر', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false, x: 17, y: 300, w: 59, h: 226, badgeX: 48, badgeY: 363 },
  { num: 18, fdi: 37, name: 'Lower Left 2nd Molar', nameAr: 'الضرس الثاني السفلي الأيسر', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false, x: 70, y: 300, w: 60, h: 244, badgeX: 98, badgeY: 377 },
  { num: 19, fdi: 36, name: 'Lower Left 1st Molar', nameAr: 'الضرس الأول السفلي الأيسر', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false, x: 124, y: 300, w: 64, h: 261, badgeX: 156, badgeY: 387 },
  { num: 20, fdi: 35, name: 'Lower Left 2nd Premolar', nameAr: 'الضاحك الثاني السفلي الأيسر', category: 'premolar', arch: 'lower', quadrant: 'LL', isAnterior: false, x: 182, y: 300, w: 63, h: 264, badgeX: 214, badgeY: 396 },
  { num: 21, fdi: 34, name: 'Lower Left 1st Premolar', nameAr: 'الضاحك الأول السفلي الأيسر', category: 'premolar', arch: 'lower', quadrant: 'LL', isAnterior: false, x: 239, y: 300, w: 65, h: 281, badgeX: 270, badgeY: 400 },
  { num: 22, fdi: 33, name: 'Lower Left Canine (Cuspid)', nameAr: 'الناب السفلي الأيسر', category: 'canine', arch: 'lower', quadrant: 'LL', isAnterior: true, x: 298, y: 300, w: 73, h: 314, badgeX: 333, badgeY: 414 },
  { num: 23, fdi: 32, name: 'Lower Left Lateral Incisor', nameAr: 'القاطع الجانبي السفلي الأيسر', category: 'incisor_lat', arch: 'lower', quadrant: 'LL', isAnterior: true, x: 365, y: 300, w: 75, h: 295, badgeX: 404, badgeY: 405 },
  { num: 24, fdi: 31, name: 'Lower Left Central Incisor', nameAr: 'القاطع المركزي السفلي الأيسر', category: 'incisor_cen', arch: 'lower', quadrant: 'LL', isAnterior: true, x: 434, y: 300, w: 74, h: 287, badgeX: 471, badgeY: 401 },
  { num: 25, fdi: 41, name: 'Lower Right Central Incisor', nameAr: 'القاطع المركزي السفلي الأيمن', category: 'incisor_cen', arch: 'lower', quadrant: 'LR', isAnterior: true, x: 502, y: 300, w: 76, h: 284, badgeX: 540, badgeY: 403 },
  { num: 26, fdi: 42, name: 'Lower Right Lateral Incisor', nameAr: 'القاطع الجانبي السفلي الأيمن', category: 'incisor_lat', arch: 'lower', quadrant: 'LR', isAnterior: true, x: 572, y: 300, w: 75, h: 286, badgeX: 610, badgeY: 400 },
  { num: 27, fdi: 43, name: 'Lower Right Canine (Cuspid)', nameAr: 'الناب السفلي الأيمن', category: 'canine', arch: 'lower', quadrant: 'LR', isAnterior: true, x: 641, y: 300, w: 70, h: 309, badgeX: 679, badgeY: 413 },
  { num: 28, fdi: 44, name: 'Lower Right 1st Premolar', nameAr: 'الضاحك الأول السفلي الأيمن', category: 'premolar', arch: 'lower', quadrant: 'LR', isAnterior: false, x: 705, y: 300, w: 64, h: 284, badgeX: 738, badgeY: 401 },
  { num: 29, fdi: 45, name: 'Lower Right 2nd Premolar', nameAr: 'الضاحك الثاني السفلي الأيمن', category: 'premolar', arch: 'lower', quadrant: 'LR', isAnterior: false, x: 763, y: 300, w: 65, h: 258, badgeX: 794, badgeY: 394 },
  { num: 30, fdi: 46, name: 'Lower Right 1st Molar', nameAr: 'الضرس الأول السفلي الأيمن', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false, x: 822, y: 300, w: 76, h: 251, badgeX: 856, badgeY: 388 },
  { num: 31, fdi: 47, name: 'Lower Right 2nd Molar', nameAr: 'الضرس الثاني السفلي الأيمن', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false, x: 892, y: 300, w: 74, h: 239, badgeX: 935, badgeY: 375 },
  { num: 32, fdi: 48, name: 'Lower Right 3rd Molar (Wisdom)', nameAr: 'ضرس العقل السفلي الأيمن', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false, x: 960, y: 305, w: 56, h: 203, badgeX: 991, badgeY: 363 },
];

export interface TeethChartRealisticProps {
  selected: number[];
  toothRestorations: Record<number, RestorationType | string>;
  system: ToothSystem;
  selectedTool: RestorationType;
  onToothClick: (tooth: ToothOdontoData) => void;
  hoveredTooth: ToothOdontoData | null;
  setHoveredTooth: (tooth: ToothOdontoData | null) => void;
  readonly?: boolean;
  className?: string;
  assetBaseUrl?: string;
}

export const TeethChartRealistic: React.FC<TeethChartRealisticProps> = ({
  selected = [],
  toothRestorations = {},
  system = 'universal',
  selectedTool = 'crown',
  onToothClick,
  hoveredTooth,
  setHoveredTooth,
  readonly = false,
  className = '',
  assetBaseUrl = '/assets/teeth-anatomy'
}) => {
  const [internalHover, setInternalHover] = useState<number | null>(null);

  const getToothOdonto = (num: number): ToothOdontoData => {
    return ODONTO_DATABASE.find(t => t.universal === num) || {
      universal: num,
      fdi: num,
      code: String(num),
      name: `Tooth #${num}`,
      category: 'molar',
      arch: num <= 16 ? 'upper' : 'lower',
      quadrant: num <= 8 ? 'UR' : num <= 16 ? 'UL' : num <= 24 ? 'LL' : 'LR',
      isAnterior: false
    };
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Occlusal Plane Guide and Alveolar Axis subtle clinical lines */}
      <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-xl p-3 sm:p-5 overflow-hidden">
        
        {/* Subtle grid backdrop for clinical measurement precision */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Midline and Occlusal Axis Markers */}
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-cyan-500/20 border-r border-dashed border-cyan-500/30 -translate-x-1/2 pointer-events-none z-0" />
        <div className="absolute top-[49.1%] left-4 right-4 h-px bg-cyan-500/20 border-b border-dashed border-cyan-500/30 -translate-y-1/2 pointer-events-none z-0" />

        {/* Interactive Master SVG Panoramic Chart (1024 x 635 aspect ratio matching reference photo 1:1) */}
        <svg
          viewBox="0 0 1024 635"
          className="w-full h-auto max-h-[640px] drop-shadow-md overflow-visible relative z-10"
          style={{ willChange: 'transform' }}
        >
          <defs>
            {/* 1. Precision Anatomical Tooth Tint Filters (Colors ONLY the tooth pixels with zero overflow) */}
            {/* Luminous Medical Cyan Selection Tint (Default & Crown) */}
            <filter id="tooth-tint-selected" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="4" floodColor="#00d8fe" floodOpacity="0.95" result="glow1" />
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.85" result="glow2" />
              <feFlood floodColor="#00b4d8" floodOpacity="0.35" result="tint" />
              <feComposite in="tint" in2="SourceGraphic" operator="in" result="tintClipped" />
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="glow2" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="tintClipped" />
              </feMerge>
            </filter>

            {/* Amber Golden Tint for Implants */}
            <filter id="tooth-tint-implant" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.95" result="glow1" />
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="1.5" floodColor="#fbbf24" floodOpacity="0.85" result="glow2" />
              <feFlood floodColor="#f59e0b" floodOpacity="0.35" result="tint" />
              <feComposite in="tint" in2="SourceGraphic" operator="in" result="tintClipped" />
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="glow2" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="tintClipped" />
              </feMerge>
            </filter>

            {/* Surgical Rose Tint for Extraction */}
            <filter id="tooth-tint-extraction" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.9" result="glow1" />
              <feFlood floodColor="#f43f5e" floodOpacity="0.38" result="tint" />
              <feComposite in="tint" in2="SourceGraphic" operator="in" result="tintClipped" />
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="tintClipped" />
              </feMerge>
            </filter>

            {/* Aesthetic Purple Tint for Veneers */}
            <filter id="tooth-tint-veneer" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.95" result="glow1" />
              <feFlood floodColor="#a855f7" floodOpacity="0.32" result="tint" />
              <feComposite in="tint" in2="SourceGraphic" operator="in" result="tintClipped" />
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="tintClipped" />
              </feMerge>
            </filter>

            {/* Hover Silhouette Contour Glow (Only on hover, hugging exact tooth edge) */}
            <filter id="tooth-hover-glow" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow in="SourceAlpha" dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.80" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* BACKGROUND OCCLUSAL MIDLINE LABELS */}
          <g opacity="0.45" className="text-[11px] font-mono font-bold fill-slate-400 select-none">
            <text x="512" y="22" textAnchor="middle">MAXILLARY MIDLINE (UPPER ARCH)</text>
            <text x="512" y="625" textAnchor="middle">MANDIBULAR MIDLINE (LOWER ARCH)</text>
          </g>

          {/* RENDER ALL 32 TEETH AS INDEPENDENT, INTERACTIVE HIGH-RES ANATOMICAL ENTITIES */}
          {REALISTIC_TEETH_DATA.map((t) => {
            const isSelected = selected.includes(t.num);
            const restoration = toothRestorations[t.num];
            const isHovered = internalHover === t.num || hoveredTooth?.universal === t.num;
            const isImplant = restoration === 'implant';
            const isExtraction = restoration === 'extraction';
            const isCrown = restoration === 'crown';
            const isBridge = restoration === 'bridge';
            const isVeneer = restoration === 'veneer';
            const displayNum = system === 'universal' ? t.num : t.fdi;

            // Compute exact anatomical silhouette filter: colors strictly the tooth itself
            const toothFilter = isSelected
              ? (isImplant 
                  ? 'url(#tooth-tint-implant)' 
                  : isExtraction 
                  ? 'url(#tooth-tint-extraction)' 
                  : isVeneer 
                  ? 'url(#tooth-tint-veneer)' 
                  : 'url(#tooth-tint-selected)')
              : isHovered
              ? 'url(#tooth-hover-glow)'
              : undefined;

            // Lift effect on hover (Upper lifts up, Lower drops down slightly)
            const translateY = isHovered ? (t.arch === 'upper' ? -6 : 6) : 0;
            const scale = isHovered ? 1.03 : 1;

            return (
              <g
                key={t.num}
                className="cursor-pointer transition-transform duration-150 ease-out"
                style={{
                  transformOrigin: `${t.badgeX}px ${t.badgeY}px`,
                  transform: `translate(0px, ${translateY}px) scale(${scale})`,
                }}
                onMouseEnter={() => {
                  setInternalHover(t.num);
                  setHoveredTooth(getToothOdonto(t.num));
                }}
                onMouseLeave={() => {
                  setInternalHover(null);
                  setHoveredTooth(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!readonly) {
                    onToothClick(getToothOdonto(t.num));
                  }
                }}
              >
                {/* ZERO outer ellipse halo: Selection colors the tooth itself with pixel-precision */}

                {/* 2. THE PHOTOREALISTIC TOOTH ANATOMY */}
                {/* When Implant is active, we render the natural crown + titanium implant fixture matching reference photo 1:1! */}
                {isImplant ? (
                  <g filter={toothFilter}>
                    {t.arch === 'lower' ? (
                      /* Lower Jaw Implant: Natural crown preserved, root replaced by titanium screw fixture */
                      <>
                        <image
                          href={`${assetBaseUrl}/tooth_${t.num}.png`}
                          x={t.x}
                          y={t.y}
                          width={t.w}
                          height={t.h}
                          preserveAspectRatio="xMidYMid meet"
                          clipPath={`url(#crown-clip-lower-${t.num})`}
                        />
                        <clipPath id={`crown-clip-lower-${t.num}`}>
                          <rect x={t.x - 10} y={t.y} width={t.w + 20} height={t.h * 0.32} />
                        </clipPath>

                        <image
                          href={`${assetBaseUrl}/implant_fixture_lower.png`}
                          x={t.badgeX - Math.max(14, t.w * 0.22)}
                          y={t.y + t.h * 0.29}
                          width={Math.max(28, t.w * 0.44)}
                          height={t.h * 0.62}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </>
                    ) : (
                      /* Upper Jaw Implant: Natural crown preserved, root replaced by titanium screw pointing UP */
                      <>
                        <image
                          href={`${assetBaseUrl}/tooth_${t.num}.png`}
                          x={t.x}
                          y={t.y}
                          width={t.w}
                          height={t.h}
                          preserveAspectRatio="xMidYMid meet"
                          clipPath={`url(#crown-clip-upper-${t.num})`}
                        />
                        <clipPath id={`crown-clip-upper-${t.num}`}>
                          <rect x={t.x - 10} y={t.y + t.h * 0.65} width={t.w + 20} height={t.h * 0.36} />
                        </clipPath>

                        <image
                          href={`${assetBaseUrl}/implant_fixture_upper.png`}
                          x={t.badgeX - Math.max(14, t.w * 0.22)}
                          y={t.y + t.h * 0.08}
                          width={Math.max(28, t.w * 0.44)}
                          height={t.h * 0.62}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </>
                    )}
                  </g>
                ) : (
                  /* Natural Tooth (Complete 100% Photographic Anatomical Crown & Root) */
                  <image
                    href={`${assetBaseUrl}/tooth_${t.num}.png`}
                    x={t.x}
                    y={t.y}
                    width={t.w}
                    height={t.h}
                    preserveAspectRatio="xMidYMid meet"
                    opacity={isExtraction ? 0.35 : 1}
                    className="transition-opacity duration-200"
                    filter={toothFilter}
                  />
                )}

                {/* 3. RESTORATION OVERLAYS (Pixel-accurate indicators) */}

                {/* Bridge Pontic Unit Indicator */}
                {isBridge && (
                  <rect
                    x={t.x + 2}
                    y={t.arch === 'upper' ? t.y + t.h - 12 : t.y + 4}
                    width={t.w - 4}
                    height="8"
                    rx="3"
                    fill="#6366f1"
                    fillOpacity="0.85"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                )}

                {/* Veneer Aesthetic Porcelain Highlight */}
                {isVeneer && (
                  <path
                    d={`M ${t.x + 6} ${t.badgeY} Q ${t.badgeX} ${t.badgeY - 12} ${t.x + t.w - 6} ${t.badgeY} Q ${t.badgeX} ${t.badgeY + 14} ${t.x + 6} ${t.badgeY}`}
                    fill="rgba(168, 85, 247, 0.25)"
                    stroke="#a855f7"
                    strokeWidth="2"
                  />
                )}

                {/* Extraction Surgical X */}
                {isExtraction && (
                  <g stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" opacity="0.92">
                    <line x1={t.x + 8} y1={t.y + 12} x2={t.x + t.w - 8} y2={t.y + t.h - 12} />
                    <line x1={t.x + t.w - 8} y1={t.y + 12} x2={t.x + 8} y2={t.y + t.h - 12} />
                  </g>
                )}

                {/* 4. THE ICONIC TEAL/CYAN CIRCULAR NUMBER BADGE (1:1 with reference images) */}
                <g className="transition-transform duration-150">
                  {/* Subtle Badge Drop Shadow */}
                  <circle
                    cx={t.badgeX}
                    cy={t.badgeY + 1.5}
                    r={isHovered ? 14 : 12}
                    fill="rgba(0, 0, 0, 0.35)"
                  />

                  {/* Badge Body (Teal / Restoration specific color) */}
                  <circle
                    cx={t.badgeX}
                    cy={t.badgeY}
                    r={isHovered ? 13 : 11.5}
                    fill={
                      isSelected
                        ? (isImplant ? '#f59e0b' : isExtraction ? '#f43f5e' : isCrown ? '#00d8fe' : '#00b894')
                        : '#00a896'
                    }
                    stroke="#ffffff"
                    strokeWidth={isHovered ? '2.4' : '2.0'}
                    className="transition-all duration-150"
                  />

                  {/* High-Legibility Badge Text */}
                  <text
                    x={t.badgeX}
                    y={t.badgeY + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={displayNum > 99 ? '9px' : '10.5px'}
                    fontWeight="800"
                    fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
                    letterSpacing="-0.5px"
                  >
                    {displayNum}
                  </text>
                </g>

                {/* 5. INVISIBLE EXPANDED CLICK HITBOX */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill="transparent"
                  className="pointer-events-auto"
                />
              </g>
            );
          })}
        </svg>

        {/* BOTTOM CLINICAL LEGEND */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a896] border border-white dark:border-slate-800 shadow-2xs" />
              <span>Natural Tooth</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-white dark:border-slate-800 shadow-2xs" />
              <span>Titanium Implant Fixture</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d8fe] border border-white dark:border-slate-800 shadow-2xs" />
              <span>Ceramic / Zirconia Crown</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] border border-white dark:border-slate-800 shadow-2xs" />
              <span>Missing / Extracted</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">1:1 Clinical Photographic Geometry</span>
            <span>•</span>
            <span>60/120 FPS Hardware-Accelerated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
