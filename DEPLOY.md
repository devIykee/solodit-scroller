# Deploy to Vercel

Your bug report scroller is ready to deploy via the web interface:

## Quick Deploy (Recommended)

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select: **devIykee/solodit-scroller**
4. Click **"Deploy"** (all settings auto-detected)

That's it! Vercel will:
- Auto-detect Next.js
- Build and deploy
- Give you a live URL: `https://solodit-scroller.vercel.app`

## What's Included

- **Linear-Style Dark Aesthetic**
  - Clean borders and distraction-free cards
  - No emojis, vector SVG icons

- **Scroll Lock**
  - Press `L` or click Lock to read long exploits without jumping cards

- **Expandable Search & Filter Icons**
  - Minimal floating controls
  - Raycast/Linear-style command palette (`/`)
  - Filter popover (`F`)

- **Bookmarking & Auto-Resume**
  - Press `B` to bookmark
  - Saves to localStorage
  - Remembers scroll position

- **6,100+ Real Solodit Reports**
  - Embedded in `data/solodit-reports.json`
  - Re-parse anytime with `npm run parse:solodit`

## Controls

- **Mouse wheel** - Scroll between cards or inside locked cards
- **Touch gestures** - Swipe up/down on mobile
- **Arrow keys / J / K** - Navigate reports
- **L Key** - Lock / unlock card scroll
- **B Key** - Toggle bookmark
- **R Key** - Jump to random report
- **/** - Open search command palette
- **F** - Toggle severity filters popover

## Repository

https://github.com/devIykee/solodit-scroller

## Local Development

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
```

---

Built for security researchers who love to doom-scroll bug reports.
