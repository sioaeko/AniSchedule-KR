# blank.sch

> **Premium, Ultra-Minimalist Anime Scheduling Engine.**  
> *A hyper-minimal, distraction-free weekly anime broadcast index crafted for purists.*

<p align="center">
  <img src="https://github.com/user-attachments/assets/c56f14a0-7b77-4fe7-915c-46ce8f13e2b3" alt="blank.sch preview" width="100%" />
</p>

---

## 📺 Overview

**blank.sch** is a hyper-focused, premium weekly anime index. Stripping away all visual noise, heavy banners, and unnecessary decorations, it delivers a Vercel/Linear-inspired monochromatic slate dashboard. Built with absolute minimalist aesthetic values, it features smooth high-fidelity transitions and professional user settings to curate your ideal schedule layout.

**blank.sch**는 불필요한 시각적 장식과 노이즈를 극한으로 걷어내고, Vercel 및 Linear 스타일의 다크 모노크롬 Slate 대시보드 미학을 구현한 애니메이션 편성표 엔진입니다. 극단적 미니멀리즘 디자인 큐에 쫀득한 인터랙티브 모션과 강력한 사용자 맞춤형 환경설정을 정교하게 결합했습니다.

---

## ✨ Key Features

- **🖤 Borderless Mono Grid**: A single-plane flat card layout sorted chronologically. Free from restrictive board borders and heavy headers for an endless sense of space.
- **🧪 Elastic Liquid Glass Day Selector**: Apple-inspired weekly navigation featuring a multilayered glass indicator. Powered by overshoot spring physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) that slides and bounces with liquid-like elasticity.
- **🎯 3-Tier Hybrid Translation Pipeline**: Delivers instantaneous, highly-accurate Korean title translation out-of-the-box:
  1. *Static Native Dictionary* (Optimized mapping for 100+ legendary titles)
  2. *Live Anissia API Map* (Real-time title crossing for current seasonal shows)
  3. *TMDB API Search Fallback* (Deep tv queries for obscure titles)
- **⚙️ Premium Settings Panel (환경설정)**: A refined settings modal with zinc-400 monochrome tones, offering 6 advanced configuration options:
  - *24H Format Toggle*: Switch between AM/PM formats and military/server-style `23:30` time representations.
  - *Score/Rating Switch*: Disable score ratings (`★ 8.2`) to establish a pure, layout-only minimalist artwall.
  - *Safe Mode Filter*: Strictly isolate Rx/R-17+ ratings and Ecchi/Hentai genres for safe, comfortable viewing.
  - *Backdrop Blur Intensity*: Calibrate glass blur strength (`Off` / `Medium` / `Heavy`) depending on your device specs.
  - *Elastic Spring Curve Tuning*: Switch sliding elasticity curves between `Snappy`, `Fluid`, and `Fast`.
  - *Factory Reset*: Revert all local cache, custom TMDB keys, and user settings back to absolute white canvas state.
- **🚀 Smart Day Caching**: Client-side API caching that enables instantaneous weekly tab transitions with 0-second loading delay.

---

## 🛠 Tech Stack

- **Core**: React 18 (TypeScript), Vite
- **Styling**: Vanilla CSS, Tailwind CSS (Cleaned & Optimized)
- **Icons**: Lucide React (Monochrome styled)
- **APIs**: Jikan API (MyAnimeList Engine), Anissia API (Dynamic Mapping), TMDB API (Translation Backup)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/sioaeko/blank.sch.git
cd blank.sch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variable Settings
Create a `.env` file based on `.env.example` to register your custom TMDB API Key (Optional; out-of-the-box local dictionaries work flawlessly without it):
```bash
# Register TMDB key for auxiliary translations
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
```

---

## 🤝 Community & Support

- **Repository**: [https://github.com/sioaeko/blank.sch](https://github.com/sioaeko/blank.sch)
- **Telegram**: [@sioaeko](https://t.me/sioaeko)
- **License**: Distributed under the MIT License.

---

<p align="center">
  <sub>Designed and engineered with strict aesthetic discipline by <b>sioaeko</b>.</sub>
</p>
