import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Play, 
  Pause 
} from 'lucide-react';
import { 
  ToothOdontoData, 
  RestorationType, 
  ToothSystem,
  ODONTO_DATABASE, 
  RESTORATION_TYPES 
} from './TeethChart';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TeethChart3DArchProps {
  selected: number[];
  toothRestorations: Record<number, RestorationType | string>;
  system: ToothSystem;
  selectedTool: RestorationType;
  onToothClick: (tooth: ToothOdontoData) => void;
  readonly?: boolean;
  className?: string;
}

type ArchViewFilter = 'both' | 'upper' | 'lower';

interface Tooth3DMeta {
  tooth: ToothOdontoData;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  meshGroup: THREE.Group;
  crownMesh: THREE.Mesh;
  rootsGroup: THREE.Group;
  facialBadge: THREE.Mesh;
  occlusalBadge: THREE.Mesh;
}

// =========================================================================
// HIGH-RESOLUTION PROCEDURAL CLINICAL TEXTURES (1:1 Photographic Reference)
// =========================================================================

/**
 * 1. Realistic Dental Enamel Texture: Vita A2 enamel gradient with translucent incisal edge
 */
function createEnamelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Vertical enamel shading from cervical margin to incisal edge
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#e8dcce'); // Warm cervical CEJ line
  grad.addColorStop(0.18, '#ede3d5');
  grad.addColorStop(0.55, '#f4eee4'); // Natural ivory crown body
  grad.addColorStop(0.85, '#f8f5ee');
  grad.addColorStop(1.00, '#eef3f7'); // Translucent incisal halo

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle biological perikymata lines and enamel micro-texture
  for (let x = 0; x < 512; x += 3) {
    const alpha = (Math.sin(x * 0.12) * 0.5 + 0.5) * 0.04;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(x, 0, 2, 512);
  }

  // Soft lateral lobes (mesial and distal reflections)
  const lobeGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
  lobeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
  lobeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
  ctx.fillStyle = lobeGrad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * 2. Realistic Cementum Root Texture: Warm organic amber/tan root gradient matching photo 1:1
 */
function createRootTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm golden-amber cementum gradient matching photo
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#d8a176'); // CEJ transition zone
  grad.addColorStop(0.30, '#c78b5e');
  grad.addColorStop(0.70, '#b67a4e');
  grad.addColorStop(1.00, '#985e33'); // Apical tip

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Longitudinal root grooves and periodontal fiber striations
  for (let x = 0; x < 512; x += 5) {
    const alpha = (Math.sin(x * 0.14) * 0.5 + 0.5) * 0.06;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(x, 0, 2, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * 3. High-Contrast Teal/Green Circular Badge Texture (Matching uploaded image 1:1)
 */
function createBadgeTexture(num: number, isSelected: boolean, resColorHex?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    // Exact teal/green badge from the user's reference image (#00b894 / #0f9f7d)
    const baseColor = isSelected ? (resColorHex || '#00d8fe') : '#00b894';

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Solid circle
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Crisp white border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Bold clean white number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), 64, 66);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// =========================================================================
// PHOTOREALISTIC PROCEDURAL GEOMETRY BUILDERS
// =========================================================================

/**
 * Single anatomical root with smooth biological tapering and rounded apex
 */
function createSingleRootGeometry(
  startRadius: number,
  apexRadius: number,
  length: number,
  curveX: number,
  curveZ: number,
  isUpper: boolean,
  radialSegs: number = 20,
  heightSegs: number = 22
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dir = isUpper ? 1 : -1;

  for (let j = 0; j <= heightSegs; j++) {
    const t = j / heightSegs;
    const curveT = Math.pow(t, 1.85);
    const cx = curveX * curveT;
    const cz = curveZ * curveT;
    const cy = dir * (t * length);

    const r = startRadius * (1 - Math.pow(t, 1.25) * (1 - apexRadius / startRadius));

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const px = cx + cos * r * 0.90;
      const pz = cz + sin * r;
      const py = cy;

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, t);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * (radialSegs + 1) + i;
      const b = (j + 1) * (radialSegs + 1) + i;
      const c = (j + 1) * (radialSegs + 1) + (i + 1);
      const d = j * (radialSegs + 1) + (i + 1);

      if (isUpper) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  // Rounded apex dome
  const domeRings = 5;
  const lastRingStart = heightSegs * (radialSegs + 1);
  const apexCenterX = curveX;
  const apexCenterZ = curveZ;
  const apexCenterY = dir * length;
  const domeBaseIndex = vertices.length / 3;

  for (let dj = 1; dj <= domeRings; dj++) {
    const phi = (dj / domeRings) * (Math.PI / 2);
    const rRing = apexRadius * Math.cos(phi);
    const dy = dir * (apexRadius * Math.sin(phi));

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const px = apexCenterX + Math.cos(theta) * rRing * 0.90;
      const pz = apexCenterZ + Math.sin(theta) * rRing;
      const py = apexCenterY + dy;

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, 1);
    }
  }

  for (let dj = 0; dj < domeRings; dj++) {
    const ringA = dj === 0 ? lastRingStart : domeBaseIndex + (dj - 1) * (radialSegs + 1);
    const ringB = domeBaseIndex + dj * (radialSegs + 1);

    for (let i = 0; i < radialSegs; i++) {
      const a = ringA + i;
      const b = ringB + i;
      const c = ringB + (i + 1);
      const d = ringA + (i + 1);

      if (isUpper) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Molar roots: Unified root trunk that bifurcates into curved roots with open anatomical furcation arch
 */
function createMolarRootsGroup(isUpper: boolean, rootMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const dir = isUpper ? 1 : -1;

  // Root trunk below CEJ
  const trunkLength = 0.28;
  const trunkGeo = new THREE.CylinderGeometry(0.38, 0.36, trunkLength, 20);
  trunkGeo.scale(1.15, 1.0, 1.05);
  const trunkMesh = new THREE.Mesh(trunkGeo, rootMat);
  trunkMesh.position.y = dir * (trunkLength * 0.5);
  group.add(trunkMesh);

  // Mesial root
  const mGeo = createSingleRootGeometry(0.20, 0.08, 1.18, -0.16, 0.04, isUpper);
  const mMesh = new THREE.Mesh(mGeo, rootMat);
  mMesh.position.set(-0.16, dir * trunkLength, 0);
  group.add(mMesh);

  // Distal root
  const dGeo = createSingleRootGeometry(0.18, 0.07, 1.12, 0.16, -0.03, isUpper);
  const dMesh = new THREE.Mesh(dGeo, rootMat);
  dMesh.position.set(0.16, dir * trunkLength, 0);
  group.add(dMesh);

  // Palatal root for Upper Molars
  if (isUpper) {
    const pGeo = createSingleRootGeometry(0.22, 0.08, 1.28, 0.02, -0.26, isUpper);
    const pMesh = new THREE.Mesh(pGeo, rootMat);
    pMesh.position.set(0, dir * trunkLength, -0.16);
    group.add(pMesh);
  }

  return group;
}

/**
 * Anatomical Crown: MOLAR
 */
function createMolarCrownGeometry(isUpper: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dir = isUpper ? -1 : 1;
  const radialSegs = 28;
  const heightSegs = 14;
  const totalHeight = 0.82;

  for (let j = 0; j <= heightSegs; j++) {
    const v = j / heightSegs;
    const cy = dir * (v * totalHeight);

    let width = 0.74;
    let depth = 0.72;
    if (v < 0.45) {
      const t = v / 0.45;
      width = 0.74 + (0.92 - 0.74) * Math.sin(t * (Math.PI / 2));
      depth = 0.72 + (0.86 - 0.72) * Math.sin(t * (Math.PI / 2));
    } else {
      const t = (v - 0.45) / 0.55;
      width = 0.92 - (0.92 - 0.84) * t;
      depth = 0.86 - (0.86 - 0.80) * t;
    }

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const n = 3.6;
      const denom = Math.pow(Math.pow(Math.abs(cos), n) + Math.pow(Math.abs(sin), n), 1 / n);
      const r = 1 / denom;

      const px = cos * r * (width * 0.5);
      const pz = sin * r * (depth * 0.5);
      let py = cy;

      if (v > 0.75) {
        const cuspFactor = (v - 0.75) / 0.25;
        const cMB = Math.exp(-((px + 0.24) ** 2 + (pz - 0.22) ** 2) / 0.04) * 0.10;
        const cDB = Math.exp(-((px - 0.22) ** 2 + (pz - 0.20) ** 2) / 0.04) * 0.09;
        const cMP = Math.exp(-((px + 0.22) ** 2 + (pz + 0.22) ** 2) / 0.05) * 0.12;
        const cDP = Math.exp(-((px - 0.22) ** 2 + (pz + 0.20) ** 2) / 0.04) * 0.08;
        const fossa = Math.exp(-(px ** 2 + pz ** 2) / 0.03) * 0.07;

        py += dir * cuspFactor * (cMB + cDB + cMP + cDP - fossa);
      }

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, v);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * (radialSegs + 1) + i;
      const b = (j + 1) * (radialSegs + 1) + i;
      const c = (j + 1) * (radialSegs + 1) + (i + 1);
      const d = j * (radialSegs + 1) + (i + 1);

      if (dir > 0) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  const topRingStart = heightSegs * (radialSegs + 1);
  const centerIndex = vertices.length / 3;
  vertices.push(0, dir * (totalHeight - 0.03), 0);
  uvs.push(0.5, 0.5);

  for (let i = 0; i < radialSegs; i++) {
    const a = topRingStart + i;
    const b = topRingStart + (i + 1);
    if (dir > 0) {
      indices.push(centerIndex, b, a);
    } else {
      indices.push(centerIndex, a, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Anatomical Crown: PREMOLAR
 */
function createPremolarCrownGeometry(isUpper: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dir = isUpper ? -1 : 1;
  const radialSegs = 24;
  const heightSegs = 12;
  const totalHeight = 0.78;

  for (let j = 0; j <= heightSegs; j++) {
    const v = j / heightSegs;
    const cy = dir * (v * totalHeight);

    let width = 0.58;
    let depth = 0.64;
    if (v < 0.45) {
      const t = v / 0.45;
      width = 0.58 + (0.72 - 0.58) * Math.sin(t * (Math.PI / 2));
      depth = 0.64 + (0.76 - 0.64) * Math.sin(t * (Math.PI / 2));
    } else {
      const t = (v - 0.45) / 0.55;
      width = 0.72 - (0.72 - 0.66) * t;
      depth = 0.76 - (0.76 - 0.70) * t;
    }

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const n = 3.2;
      const denom = Math.pow(Math.pow(Math.abs(cos), n) + Math.pow(Math.abs(sin), n), 1 / n);
      const r = 1 / denom;

      const px = cos * r * (width * 0.5);
      const pz = sin * r * (depth * 0.5);
      let py = cy;

      if (v > 0.75) {
        const cuspFactor = (v - 0.75) / 0.25;
        const cBuccal = Math.exp(-(px ** 2 + (pz - 0.22) ** 2) / 0.035) * 0.12;
        const cLingual = Math.exp(-(px ** 2 + (pz + 0.20) ** 2) / 0.04) * 0.09;
        const groove = Math.exp(-(px ** 2 + pz ** 2) / 0.02) * 0.06;

        py += dir * cuspFactor * (cBuccal + cLingual - groove);
      }

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, v);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * (radialSegs + 1) + i;
      const b = (j + 1) * (radialSegs + 1) + i;
      const c = (j + 1) * (radialSegs + 1) + (i + 1);
      const d = j * (radialSegs + 1) + (i + 1);

      if (dir > 0) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  const topRingStart = heightSegs * (radialSegs + 1);
  const centerIndex = vertices.length / 3;
  vertices.push(0, dir * (totalHeight - 0.02), 0);
  uvs.push(0.5, 0.5);

  for (let i = 0; i < radialSegs; i++) {
    const a = topRingStart + i;
    const b = topRingStart + (i + 1);
    if (dir > 0) {
      indices.push(centerIndex, b, a);
    } else {
      indices.push(centerIndex, a, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Anatomical Crown: CANINE (Pointed diamond silhouette with prominent labial cusp ridge)
 */
function createCanineCrownGeometry(isUpper: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dir = isUpper ? -1 : 1;
  const radialSegs = 24;
  const heightSegs = 14;
  const totalHeight = 0.98;

  for (let j = 0; j <= heightSegs; j++) {
    const v = j / heightSegs;
    const cy = dir * (v * totalHeight);

    let width = 0.52;
    let depth = 0.50;
    if (v < 0.4) {
      const t = v / 0.4;
      width = 0.52 + (0.72 - 0.52) * Math.sin(t * (Math.PI / 2));
      depth = 0.50 + (0.64 - 0.50) * Math.sin(t * (Math.PI / 2));
    } else {
      const t = (v - 0.4) / 0.6;
      width = 0.72 * (1 - t * 0.76);
      depth = 0.64 * (1 - t * 0.78);
    }

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      let ridge = 0;
      if (sin > 0) {
        ridge = 0.08 * (1 - Math.abs(cos)) * Math.sin(v * Math.PI);
      }
      let cingulum = 0;
      if (sin < 0 && v < 0.35) {
        cingulum = -0.06 * Math.sin((v / 0.35) * Math.PI);
      }

      const px = cos * width;
      const pz = sin * depth + ridge + cingulum;
      const py = cy;

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, v);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * (radialSegs + 1) + i;
      const b = (j + 1) * (radialSegs + 1) + i;
      const c = (j + 1) * (radialSegs + 1) + (i + 1);
      const d = j * (radialSegs + 1) + (i + 1);

      if (dir > 0) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  const topRingStart = heightSegs * (radialSegs + 1);
  const centerIndex = vertices.length / 3;
  vertices.push(0, dir * totalHeight, 0.02);
  uvs.push(0.5, 0.5);

  for (let i = 0; i < radialSegs; i++) {
    const a = topRingStart + i;
    const b = topRingStart + (i + 1);
    if (dir > 0) {
      indices.push(centerIndex, b, a);
    } else {
      indices.push(centerIndex, a, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Anatomical Crown: INCISOR (Spatulate chisel profile, broad incisal edge, convex facial)
 */
function createIncisorCrownGeometry(isUpper: boolean, isCentral: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dir = isUpper ? -1 : 1;
  const radialSegs = 24;
  const heightSegs = 14;
  const totalHeight = isCentral ? 0.94 : 0.86;

  const baseWidth = isCentral ? 0.78 : 0.66;
  const baseDepth = 0.44;

  for (let j = 0; j <= heightSegs; j++) {
    const v = j / heightSegs;
    const cy = dir * (v * totalHeight);

    const curWidth = baseWidth * (0.64 + 0.36 * v);
    const curDepth = baseDepth * (1 - 0.74 * v);

    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      let labialCurve = 0;
      if (sin > 0) {
        labialCurve = 0.04 * Math.sin(v * Math.PI);
      }
      let lingualDetail = 0;
      if (sin < 0) {
        if (v < 0.35) {
          lingualDetail = -0.05 * Math.sin((v / 0.35) * Math.PI);
        } else {
          lingualDetail = 0.04 * Math.sin(((v - 0.35) / 0.65) * Math.PI);
        }
      }

      const px = cos * curWidth * 0.5;
      const pz = sin * curDepth * 0.5 + labialCurve + lingualDetail;
      const py = cy;

      vertices.push(px, py, pz);
      uvs.push(i / radialSegs, v);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * (radialSegs + 1) + i;
      const b = (j + 1) * (radialSegs + 1) + i;
      const c = (j + 1) * (radialSegs + 1) + (i + 1);
      const d = j * (radialSegs + 1) + (i + 1);

      if (dir > 0) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  const topRingStart = heightSegs * (radialSegs + 1);
  const centerIndex = vertices.length / 3;
  vertices.push(0, dir * totalHeight, 0);
  uvs.push(0.5, 0.5);

  for (let i = 0; i < radialSegs; i++) {
    const a = topRingStart + i;
    const b = topRingStart + (i + 1);
    if (dir > 0) {
      indices.push(centerIndex, b, a);
    } else {
      indices.push(centerIndex, a, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * 1:1 Photographic Titanium Surgical Implant Fixture (Exact match to uploaded Image 2)
 */
function createTitaniumImplantFixture(isUpper: boolean): THREE.Group {
  const group = new THREE.Group();
  const dir = isUpper ? 1 : -1;

  // Brushed surgical Grade 5 titanium
  const polishedCollarMat = new THREE.MeshStandardMaterial({
    color: 0x8e9aa8,
    metalness: 0.95,
    roughness: 0.18,
  });

  const threadedBodyMat = new THREE.MeshStandardMaterial({
    color: 0x687380,
    metalness: 0.92,
    roughness: 0.28,
  });

  const totalLength = 1.05;

  // 1. Polished Machined Titanium Collar (Exact collar seen in Image 2)
  const collarHeight = 0.22;
  const collarGeo = new THREE.CylinderGeometry(0.24, 0.23, collarHeight, 24);
  const collarMesh = new THREE.Mesh(collarGeo, polishedCollarMat);
  collarMesh.position.y = dir * (collarHeight * 0.5);
  group.add(collarMesh);

  // Micro-groove ring on collar
  const grooveGeo = new THREE.TorusGeometry(0.235, 0.012, 8, 24);
  const grooveMesh = new THREE.Mesh(grooveGeo, polishedCollarMat);
  grooveMesh.rotation.x = Math.PI / 2;
  grooveMesh.position.y = dir * (collarHeight * 0.45);
  group.add(grooveMesh);

  // 2. Tapered Threaded Core
  const coreLength = totalLength - collarHeight;
  const coreGeo = new THREE.CylinderGeometry(0.22, 0.13, coreLength, 20);
  const coreMesh = new THREE.Mesh(coreGeo, threadedBodyMat);
  coreMesh.position.y = dir * (collarHeight + coreLength * 0.5);
  group.add(coreMesh);

  // 3. Precision Surgical V-Threads (8 spiral thread rings matching Image 2)
  const threadCount = 8;
  for (let k = 0; k < threadCount; k++) {
    const t = k / threadCount;
    const threadRadius = 0.235 - t * 0.085;
    const threadGeo = new THREE.TorusGeometry(threadRadius, 0.022, 8, 24);
    const threadMesh = new THREE.Mesh(threadGeo, threadedBodyMat);
    threadMesh.rotation.x = Math.PI / 2;
    threadMesh.position.y = dir * (collarHeight + 0.08 + k * 0.095);
    group.add(threadMesh);
  }

  // 4. Apical Bullet Tip
  const tipGeo = new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const tipMesh = new THREE.Mesh(tipGeo, threadedBodyMat);
  if (isUpper) {
    tipMesh.position.y = totalLength;
  } else {
    tipMesh.rotation.x = Math.PI;
    tipMesh.position.y = -totalLength;
  }
  group.add(tipMesh);

  return group;
}

// =========================================================================
// MAIN 3D ARCH COMPONENT
// =========================================================================

export function TeethChart3DArch({
  selected,
  toothRestorations,
  system,
  selectedTool,
  onToothClick,
  readonly = false,
  className = ''
}: TeethChart3DArchProps) {
  const { t } = useLanguage();
  const mountRef = useRef<HTMLDivElement>(null);

  const [archFilter, setArchFilter] = useState<ArchViewFilter>('both');
  const [hoveredTooth, setHoveredTooth] = useState<ToothOdontoData | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const toothMetaMapRef = useRef<Map<number, Tooth3DMeta>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animFrameIdRef = useRef<number | null>(null);

  // Distinguish camera orbit drag from tooth click
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Shared textures & materials
  const enamelTexture = useMemo(() => createEnamelTexture(), []);
  const rootTexture = useMemo(() => createRootTexture(), []);

  const rootMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: rootTexture,
      roughness: 0.42,
      metalness: 0.02,
    });
  }, [rootTexture]);

  /**
   * Build biological roots group for tooth
   */
  const buildRootsGroup = (
    tooth: ToothOdontoData, 
    isUpper: boolean, 
    isImplant: boolean, 
    rootMat: THREE.Material
  ): THREE.Group => {
    if (isImplant) {
      return createTitaniumImplantFixture(isUpper);
    }

    const group = new THREE.Group();
    const category = tooth.category;

    if (category === 'molar') {
      return createMolarRootsGroup(isUpper, rootMat);
    } else if (category === 'canine') {
      const curveX = tooth.quadrant === 'UR' || tooth.quadrant === 'LR' ? -0.14 : 0.14;
      const rootGeo = createSingleRootGeometry(0.28, 0.09, 1.55, curveX, 0.06, isUpper);
      const rootMesh = new THREE.Mesh(rootGeo, rootMat);
      group.add(rootMesh);
    } else if (category === 'premolar') {
      const curveX = tooth.quadrant === 'UR' || tooth.quadrant === 'LR' ? -0.10 : 0.10;
      const rootGeo = createSingleRootGeometry(0.24, 0.08, 1.25, curveX, -0.04, isUpper);
      const rootMesh = new THREE.Mesh(rootGeo, rootMat);
      group.add(rootMesh);
    } else {
      const isCentral = category === 'incisor_cen';
      const curveX = tooth.quadrant === 'UR' || tooth.quadrant === 'LR' ? -0.08 : 0.08;
      const rootGeo = createSingleRootGeometry(
        isCentral ? 0.24 : 0.20,
        0.08,
        isCentral ? 1.28 : 1.18,
        curveX,
        0.03,
        isUpper
      );
      const rootMesh = new THREE.Mesh(rootGeo, rootMat);
      group.add(rootMesh);
    }

    return group;
  };

  /**
   * Build anatomical crown geometry
   */
  const buildCrownGeometry = (tooth: ToothOdontoData, isUpper: boolean): THREE.BufferGeometry => {
    switch (tooth.category) {
      case 'molar':
        return createMolarCrownGeometry(isUpper);
      case 'premolar':
        return createPremolarCrownGeometry(isUpper);
      case 'canine':
        return createCanineCrownGeometry(isUpper);
      case 'incisor_cen':
        return createIncisorCrownGeometry(isUpper, true);
      case 'incisor_lat':
      default:
        return createIncisorCrownGeometry(isUpper, false);
    }
  };

  /**
   * Continuous Anatomical Dental Arch Coordinates (Seamless interproximal contacts)
   */
  const getArchCoordinates = (toothNumber: number) => {
    const isUpper = toothNumber >= 1 && toothNumber <= 16;
    let posInQuadrant: number; // 1 = central incisor, 8 = 3rd molar
    let isPatientRight: boolean;

    if (isUpper) {
      if (toothNumber >= 1 && toothNumber <= 8) {
        isPatientRight = true;
        posInQuadrant = 9 - toothNumber;
      } else {
        isPatientRight = false;
        posInQuadrant = toothNumber - 8;
      }
    } else {
      if (toothNumber >= 25 && toothNumber <= 32) {
        isPatientRight = true;
        posInQuadrant = toothNumber - 24;
      } else {
        isPatientRight = false;
        posInQuadrant = 25 - toothNumber;
      }
    }

    // Progression parameter along parabolic dental arch
    const tVal = (posInQuadrant - 0.5) / 7.5;
    const curveRadiusX = 3.75;
    const curveDepthZ = 3.65;

    const angle = tVal * (Math.PI * 0.42);
    const xBase = Math.sin(angle) * curveRadiusX;
    const zBase = Math.cos(angle) * curveDepthZ - 1.2;

    const x = isPatientRight ? -xBase : xBase;
    const z = zBase;
    // Y elevation: Upper and lower teeth meeting seamlessly across the occlusal gap
    const y = isUpper ? 0.95 : -0.95;

    // Tangential rotation facing outwards
    const rotY = (isPatientRight ? 1 : -1) * (angle * 0.95);

    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, rotY, 0),
      isUpper,
      posInQuadrant
    };
  };

  // Scene initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: Positioned for an elegant front-facing view of the arches (1:1 with reference)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 10.6);
    cameraRef.current = camera;

    // 3. Renderer with 100% Alpha Transparency (Zero murky backgrounds)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0); // 100% Transparent
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.0;
    controls.maxDistance = 22;
    controls.target.set(0, 0, 0.4);
    controlsRef.current = controls;

    // 5. Studio-Grade Clinical Lighting (Warm Key + Cool Fill + Backlight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    keyLight.position.set(6, 10, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.65);
    fillLight.position.set(-6, -6, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    rimLight.position.set(0, 8, -8);
    scene.add(rimLight);

    // 6. Build the 32 Teeth in 3D Arches
    toothMetaMapRef.current.clear();

    ODONTO_DATABASE.forEach(tooth => {
      const { position, rotation, isUpper } = getArchCoordinates(tooth.universal);

      const toothGroup = new THREE.Group();
      toothGroup.position.copy(position);
      toothGroup.rotation.copy(rotation);
      toothGroup.name = `ToothGroup_${tooth.universal}`;
      toothGroup.userData = { toothNumber: tooth.universal, tooth };

      // Enamel Crown Material with photo-accurate PBR texture
      const crownMat = new THREE.MeshStandardMaterial({
        map: enamelTexture,
        roughness: 0.26,
        metalness: 0.02,
      });

      // Anatomical Crown
      const crownGeo = buildCrownGeometry(tooth, isUpper);
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.name = `Crown_${tooth.universal}`;
      crownMesh.userData = { toothNumber: tooth.universal, tooth };
      crownMesh.castShadow = true;
      crownMesh.receiveShadow = true;
      toothGroup.add(crownMesh);

      // Anatomical Roots
      const rootsGroup = buildRootsGroup(tooth, isUpper, false, rootMaterial);
      rootsGroup.name = `Roots_${tooth.universal}`;
      rootsGroup.userData = { toothNumber: tooth.universal, tooth };
      toothGroup.add(rootsGroup);

      // BADGE 1: FACIAL SURFACE BADGE (EXACT 1:1 MATCH TO USER IMAGE 1 & 2)
      // Placed on the facial/labial surface of the crown facing forward
      const displayNum = system === 'universal' ? tooth.universal : tooth.fdi;
      const badgeTex = createBadgeTexture(displayNum, false);

      const facialBadgeGeo = new THREE.CircleGeometry(0.18, 32);
      const facialBadgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      const facialBadge = new THREE.Mesh(facialBadgeGeo, facialBadgeMat);
      facialBadge.name = `FacialBadge_${tooth.universal}`;
      facialBadge.userData = { toothNumber: tooth.universal, tooth };

      // Position directly on the facial surface of the tooth
      facialBadge.position.set(0, isUpper ? -0.42 : 0.42, 0.36);
      toothGroup.add(facialBadge);

      // BADGE 2: OCCLUSAL BADGE (For inspection when looking from top or bottom)
      const occlusalBadgeGeo = new THREE.CircleGeometry(0.18, 24);
      const occlusalBadgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const occlusalBadge = new THREE.Mesh(occlusalBadgeGeo, occlusalBadgeMat);
      occlusalBadge.name = `OcclusalBadge_${tooth.universal}`;
      occlusalBadge.userData = { toothNumber: tooth.universal, tooth };
      occlusalBadge.position.set(0, isUpper ? -0.82 : 0.82, 0);
      occlusalBadge.rotation.x = isUpper ? Math.PI / 2 : -Math.PI / 2;
      toothGroup.add(occlusalBadge);

      scene.add(toothGroup);

      toothMetaMapRef.current.set(tooth.universal, {
        tooth,
        position,
        rotation,
        meshGroup: toothGroup,
        crownMesh,
        rootsGroup,
        facialBadge,
        occlusalBadge
      });
    });

    // 7. Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 1.2;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [enamelTexture, rootMaterial]);

  // Update materials, restorations, implants, and badge textures dynamically
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    toothMetaMapRef.current.forEach((meta, num) => {
      const isSelected = selected.includes(num);
      const resType = toothRestorations[num] || (isSelected ? selectedTool : undefined);
      const resConfig = resType ? RESTORATION_TYPES.find(r => r.id === resType) : null;
      const isImplant = Boolean(isSelected && resType === 'implant');
      const isExtraction = Boolean(isSelected && resType === 'extraction');

      // 1. Crown Color & Material
      const crownMat = meta.crownMesh.material as THREE.MeshStandardMaterial;
      if (isSelected && resConfig) {
        const hexColor = parseInt(resConfig.color.replace('#', '0x'), 16);
        crownMat.map = null;
        crownMat.color.setHex(hexColor);
        crownMat.roughness = 0.22;
        crownMat.metalness = 0.15;
        crownMat.emissive.setHex(hexColor);
        crownMat.emissiveIntensity = 0.25;
        crownMat.transparent = isExtraction;
        crownMat.opacity = isExtraction ? 0.30 : 1.0;
      } else {
        // Natural Vita A2 Enamel Texture
        crownMat.map = enamelTexture;
        crownMat.color.setHex(0xffffff);
        crownMat.roughness = 0.26;
        crownMat.metalness = 0.02;
        crownMat.emissive.setHex(0x000000);
        crownMat.emissiveIntensity = 0;
        crownMat.transparent = false;
        crownMat.opacity = 1.0;
      }
      crownMat.needsUpdate = true;

      // 2. Roots: Replace with Surgical Titanium Fixture if Implant (1:1 with Image 2)
      meta.meshGroup.remove(meta.rootsGroup);
      const newRoots = buildRootsGroup(
        meta.tooth, 
        meta.tooth.arch === 'upper', 
        isImplant, 
        rootMaterial
      );
      newRoots.name = `Roots_${meta.tooth.universal}`;
      newRoots.userData = { toothNumber: meta.tooth.universal, tooth: meta.tooth };
      meta.rootsGroup = newRoots;
      meta.meshGroup.add(newRoots);

      // 3. Update Badge Texture & Position (When implanted, badge sits ON the implant body like Image 2!)
      const displayNum = system === 'universal' ? meta.tooth.universal : meta.tooth.fdi;
      const newBadgeTex = createBadgeTexture(displayNum, isSelected, resConfig?.color);

      // Update Facial Badge
      const facialMat = meta.facialBadge.material as THREE.MeshBasicMaterial;
      if (facialMat.map) facialMat.map.dispose();
      facialMat.map = newBadgeTex;
      facialMat.needsUpdate = true;

      // In Image 2: when implant is active, the badge sits right on the implant body!
      if (isImplant) {
        meta.facialBadge.position.set(0, meta.tooth.arch === 'upper' ? 0.48 : -0.48, 0.28);
      } else {
        meta.facialBadge.position.set(0, meta.tooth.arch === 'upper' ? -0.42 : 0.42, 0.36);
      }

      // Update Occlusal Badge
      const occlusalMat = meta.occlusalBadge.material as THREE.MeshBasicMaterial;
      if (occlusalMat.map) occlusalMat.map.dispose();
      occlusalMat.map = newBadgeTex;
      occlusalMat.needsUpdate = true;

      // 4. Arch Filter Visibility
      let isVisible = true;
      if (archFilter === 'upper' && meta.tooth.arch !== 'upper') isVisible = false;
      if (archFilter === 'lower' && meta.tooth.arch !== 'lower') isVisible = false;
      meta.meshGroup.visible = isVisible;
    });
  }, [selected, toothRestorations, system, selectedTool, archFilter, rootMaterial, enamelTexture]);

  // Raycasting for Mouse Hover & Tooltip
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    const hit = intersects.find(i => i.object.userData && i.object.userData.toothNumber);
    if (hit) {
      const toothNum = hit.object.userData.toothNumber;
      const toothData = ODONTO_DATABASE.find(t => t.universal === toothNum);
      if (toothData) {
        setHoveredTooth(toothData);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      setHoveredTooth(null);
      setTooltipPos(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    if (mountRef.current) {
      mountRef.current.style.cursor = 'grabbing';
    }
  };

  // Pointer Up: Strictly distinguish camera orbit drag from tooth click
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current || readonly) return;
    container.style.cursor = 'grab';

    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6) {
      return; // Camera was dragged/rotated
    }

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    const hit = intersects.find(i => i.object.userData && i.object.userData.toothNumber);
    if (hit) {
      const toothNum = hit.object.userData.toothNumber;
      const toothData = ODONTO_DATABASE.find(t => t.universal === toothNum);
      if (toothData) {
        onToothClick(toothData);
      }
    }
  };

  // Camera presets
  const setCameraView = (view: 'isometric' | 'occlusalUpper' | 'occlusalLower' | 'front') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    switch (view) {
      case 'front': // Exact 1:1 view of the photo
        camera.position.set(0, 0, 10.4);
        controls.target.set(0, 0, 0.2);
        break;
      case 'isometric':
        camera.position.set(0, 6.2, 9.5);
        controls.target.set(0, 0, 0.4);
        break;
      case 'occlusalLower':
        camera.position.set(0, 11, 0.4);
        controls.target.set(0, 0, 0.4);
        break;
      case 'occlusalUpper':
        camera.position.set(0, -11, 0.4);
        controls.target.set(0, 0, 0.4);
        break;
    }
    controls.update();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const factor = direction === 'in' ? 0.82 : 1.22;
    camera.position.lerp(controls.target, 1 - factor);
    controls.update();
  };

  return (
    <div className={`flex flex-col select-none ${className}`}>
      {/* 3D CONTROLS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 text-xs">
        
        {/* Arch Filter Toggles */}
        <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setArchFilter('both')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              archFilter === 'both'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('action.selectAll', 'Both Arches')}
          </button>
          <button
            type="button"
            onClick={() => setArchFilter('upper')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              archFilter === 'upper'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('teeth.maxillary', 'Upper Arch')}
          </button>
          <button
            type="button"
            onClick={() => setArchFilter('lower')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              archFilter === 'lower'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('teeth.mandibular', 'Lower Arch')}
          </button>
        </div>

        {/* Camera Perspective Angle Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Angle:
          </span>
          <button
            type="button"
            onClick={() => setCameraView('front')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary transition-all cursor-pointer shadow-2xs"
            title="Direct Facial View (Matches Reference Photo)"
          >
            Front (Photo)
          </button>
          <button
            type="button"
            onClick={() => setCameraView('isometric')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary transition-all cursor-pointer shadow-2xs"
            title="Angled 3D Isometric View"
          >
            3D Orbit
          </button>
          <button
            type="button"
            onClick={() => setCameraView('occlusalLower')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary transition-all cursor-pointer shadow-2xs"
            title="Inspect Occlusal Table from Top"
          >
            Top (Occlusal)
          </button>
          <button
            type="button"
            onClick={() => setCameraView('occlusalUpper')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary transition-all cursor-pointer shadow-2xs"
            title="Inspect Maxilla from Below"
          >
            Bottom (Palatal)
          </button>
        </div>

        {/* Utilities: Turntable, Zoom, Reset */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              autoRotate
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
            title="Toggle 360° Smooth Turntable Rotation"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCameraView('front')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            title="Reset to Front View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WEBGL CANVAS: 100% TRANSPARENT BACKGROUND */}
      <div 
        ref={mountRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative w-full h-[620px] rounded-3xl bg-transparent overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {/* Floating 3D Navigation Guide Tip */}
        <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/60 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-medium text-slate-200 flex items-center gap-2 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>Left click + drag to rotate 360° · Scroll to zoom · Click tooth or badge to assign</span>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredTooth && tooltipPos && (
          <div
            className="absolute pointer-events-none bg-slate-950/90 text-white backdrop-blur-md p-2.5 px-3.5 rounded-xl border border-primary/40 shadow-xl z-20 text-xs transform -translate-x-1/2 -translate-y-full mb-2 animate-fade-in"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary text-sm">
                #{hoveredTooth.universal} (FDI {hoveredTooth.fdi})
              </span>
              <span className="font-bold">{hoveredTooth.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {hoveredTooth.arch === 'upper' ? 'Maxillary Arch' : 'Mandibular Arch'} · Quadrant {hoveredTooth.quadrant}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              Click to assign: {selectedTool.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
