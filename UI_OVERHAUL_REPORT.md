# BAGS Terminal: UI Overhaul Report
**Theme:** Brutalist Precision (v2.0)
**Date:** January 18, 2026
**Status:** Phase 1 Complete

---

## 1. Executive Summary
We have successfully transitioned the application from a "Standard Dark Mode" SaaS aesthetic to a **"Brutalist Precision"** identity. This design language abandons "safe" rounded corners and soft blurs in favor of sharp geometry, high-contrast neon accents, and raw data visualization. The goal is to evoke the feeling of a high-frequency trading terminal: dense, fast, and unapologetic.

## 2. Implemented Changes (Phase 1)

### 🎨 Global Design System (`globals.css`)
-   **Color Palette:**
    -   **Background:** Shifted from `#0B0E14` (Dark Blue-Grey) to **`#050505` (OLED Black)** for maximum contrast.
    -   **Accents:** Introduced **Acid Green (`#39FF14`)** and **Signal Red (`#FF003C`)** as primary data signals.
    -   **Texture:** Added a global grain overlay and data-grid pattern to reduce "flatness" without adding "softness."
-   **Typography:**
    -   **Headlines:** Implemented **`Syncopate`** (Wide/Extended) for a futuristic, cinematic feel.
    -   **Data/Body:** Implemented **`Space Mono`** for all reading text to reinforce the "terminal" aesthetic.
-   **Geometry:**
    -   **Corner Radius:** Reduced from `rounded-lg` (8px) to **`rounded-none` (0px)** or `rounded-sm` (2px).
    -   **Borders:** Replaced soft borders with **Raw Borders (`1px solid white/10`)** and neon glow effects.

### 🏠 Home Page (`page.tsx`)
-   **Layout Topology:**
    -   Abandoned the "Centered Hero" (Marketing standard).
    -   Implemented **Extreme Asymmetry (90/10)**: Content pinned left, visualization dominating right.
-   **Interactive Elements:**
    -   **Live Pulse Stream:** A custom Framer Motion component simulating real-time blockchain event feeds.
    -   **Glitch Effects:** Hover states now trigger a split-channel chromatic aberration (RGB split).
    -   **Ticker Tape:** Added an infinite scrolling marquee of live token metrics.
-   **Modules Section:**
    -   Replaced the static grid with a **Staggered Depth** layout, using `z-index` and hover lifts to create a physical "deck of cards" feel.

---

## 3. Design System Specifications (The "Truth")

### Colors
| Role | Hex | Name | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | `#050505` | OLED Black | Main Background |
| **Surface** | `#0A0A0A` | Deep Void | Cards, Panels |
| **Success** | `#39FF14` | Acid Green | Positive trends, "Live" signals |
| **Danger** | `#FF003C` | Signal Red | Risk warnings, "Rug" alerts |
| **Data** | `#00F0FF` | Electric Blue | Neutral data, info streams |

### Typography
-   **Display:** `Syncopate` (700 Bold) - Uppercase only.
-   **Mono:** `Space Mono` (400/700) - Default for all text.

### Motion Physics
-   **Hover:** Instant feedback (0ms delay), "Glitch" or "Snap" transition.
-   **Entrance:** Staggered delays (0.1s), Spring physics (Mass: 0.5, Stiffness: 100).

---

## 4. Recommended Fixes & Next Steps (Phase 2)

The following areas are currently inconsistent with the new "Brutalist Precision" theme and require immediate attention:

### 🚨 Critical Fixes (Inconsistency Audit)

1.  **`TopBar.tsx` (Legacy Design)**
    *   **Issue:** Uses `rounded` corners on the logo and `backdrop-blur-xl` (Glassmorphism).
    *   **Fix:** Remove `rounded`. Change font to `Space Mono`. Remove blur in favor of a solid `#050505` background with a raw bottom border.
    *   **Action:** Rewrite component to match `globals.css`.

2.  **`TopBar.tsx` (Navigation)**
    *   **Issue:** Links use `font-sans` (Inter).
    *   **Fix:** Switch to `font-mono`. Add a hover effect that underlines or highlights in `#39FF14`.

3.  **Terminal Page (`/terminal`)**
    *   **Issue:** Likely uses the old table styles (soft rounded corners, gray text).
    *   **Fix:** Apply the "Scanline Table" styles from the Home Page. Use `font-mono` for all data cells.

4.  **Mobile Navigation**
    *   **Issue:** The heavy asymmetry of the new Home Page needs careful checking on mobile.
    *   **Fix:** Ensure the "Live Pulse" is hidden or simplified on screens `< 768px`. Verify touch targets for the glitch buttons.

5.  **Accessibility Check**
    *   **Issue:** Neon Green on Black is high contrast, but thin font weights can be hard to read.
    *   **Fix:** Ensure `Space Mono` is never lighter than `400` weight. Avoid `text-[#888]` for critical information; bump to `text-[#AAA]`.

### 🚀 Future Enhancements

-   **Sound Design:** Add subtle "click" and "hum" sound effects (UI SFX) on interactions to complete the terminal experience.
-   **WebGL Background:** Replace the static grain/grid with a low-poly WebGL mesh that reacts to mouse movement.
-   **Command Palette (`Cmd+K`):** Implement a global command menu styled like a DOS prompt.
