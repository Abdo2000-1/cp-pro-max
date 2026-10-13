## Production Pull Request Playbook

### 📋 Overview & Metadata
- **PR Title**: `feat(teeth-chart): <Description>`
- **Lead Software Engineer**: **Abdo Al Adawy**
- **Project Supervisor**: **Eng. Aya Adel**
- **Target Component**: `<TeethChart />` & `<TeethChart3DArch />`
- **Clinical Standard Compliance**: ISO 3950 / ADA Universal / IEEE 830

---

### 🔍 Summary of Changes
Provide a concise technical summary of what this PR introduces:
- [ ] 2D Odontogram anatomical cross layout updates
- [ ] 3D WebGL parabolic arch enhancements
- [ ] Procedural tooth crown or root geometry modifications
- [ ] Surgical titanium implant fixture enhancements
- [ ] Internationalization (Arabic RTL / English LTR)
- [ ] Performance or memory leak mitigations

---

### 🧪 Verification Checklist
- [ ] **TypeScript**: `npx tsc -b` passes with **0 errors**.
- [ ] **Production Build**: `npm run build` succeeds cleanly.
- [ ] **WebGL Performance**: 60 FPS verified during 360° orbit interaction.
- [ ] **Anatomical Accuracy**: Tooth silhouettes and 3D shapes match clinical reference photography.
- [ ] **Implant Verification**: Tooth #25 titanium fixture displays realistic threads and collar.
- [ ] **Memory Bounds**: Zero WebGL context or texture leaks detected upon unmount.
- [ ] **Accidental Click Filter**: Drag-orbit displacement (>6px) does not accidentally select teeth.
- [ ] **Bilingual Validation**: Arabic RTL and English LTR layouts render properly.
- [ ] **Theme Contrast**: Both Day and Night themes pass clinical contrast standards.

---

### 📸 Evidence & Verification Screenshots
*Attach screenshots or WebGL captures verifying your changes.*

| Clinical Reference Photo | WebGL 3D Arch Render |
| :---: | :---: |
| *Reference Image* | *Your Implementation* |

---

### ✍️ Approvals & Sign-Off
- **Engineer Sign-Off**: Abdo Al Adawy
- **Supervisor Review**: Eng. Aya Adel
