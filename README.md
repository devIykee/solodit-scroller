# Bug Report Scroller

TikTok-style doom-scrolling interface for browsing smart contract security vulnerabilities from Solodit.

## Features

- **Linear-style distraction-free reading** - Swipe, scroll, or use arrow / vim keys (`j` / `k`)
- **6,100+ Real Solodit Reports** - Extracted from the Solodit vulnerability repository across 17 top security firms
- **Scroll Lock** - Lock onto any card (`L`) to scroll and read long exploit context without accidentally jumping cards
- **Expandable search & filters** - Spotlight command palette (`/`) and severity filters popover (`F`) that stay out of the way
- **Virtualized 60fps rendering** - Butter-smooth scrolling with zero DOM bloat even with thousands of findings
- **Clean high-contrast theme** - Monochrome dark theme with subtle severity border accents
- **Syntax-highlighted code blocks** - One-click code copying for exploits and proofs of concept
- **Interactive vulnerability tags** - Click tags like `#reentrancy`, `#oracle`, `#bridge` to filter findings instantly
- **Random vulnerability jump** - Hit `R` to study unexpected bugs
- **Local bookmarking** - Save findings with `B` and resume exactly where you left off
- **Direct Solodit links** - One-click jump to full issues on Solodit

## Quick Start

```bash
# Install dependencies
npm install

# (Optional) Pull latest findings from live Solodit (55,403 database)
npm run pull:live -- --pages 30

# (Optional) Re-parse Solodit content repository
npm run parse:solodit

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start doom-scrolling bug reports!

## Controls & Keyboard Shortcuts

| Key / Gesture | Action |
| --- | --- |
| `Down` / `J` / `Space` | Next vulnerability |
| `Up` / `K` / `Shift+Space` | Previous vulnerability |
| `L` | Lock / Unlock card scroll |
| `B` | Bookmark / Save current report |
| `R` | Jump to random vulnerability |
| `/` | Open search command palette |
| `F` | Toggle severity filters popover |
| `?` | Show keyboard shortcuts modal |
| `Esc` | Close search or modal |
| Mouse Wheel | Scroll smoothly between cards (or inside locked cards) |
| Touch Swipe | Swipe up/down on mobile |

## Dataset & Solodit Content Parser

The app includes an automated parser script [`scripts/parse-solodit-content.js`](scripts/parse-solodit-content.js) that reads markdown vulnerability reports from [Solodit's content repository](https://github.com/solodit/solodit_content.git):

```bash
npm run parse:solodit
```

The script:
1. Detects or clones `solodit/solodit_content` (shallow depth 1)
2. Parses vulnerability findings across all auditor directories (`0x52`, `Hexens`, `Pashov Audit Group`, `Trust Security`, etc.)
3. Extracts descriptions, impact scenarios, remediation steps, and code snippets
4. Categorizes tags (reentrancy, access-control, oracle, bridges, flash loans, etc.)
5. Saves the parsed JSON to `data/solodit-reports.json`

## Deploy to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: linear-style reading experience with expandable controls and no emojis"
   git push origin main
   ```
2. Import the project in [vercel.com](https://vercel.com/new).
3. Deploy! Next.js will prerender the static API and pages for instant global edge delivery.

## Tech Stack

- **Next.js 16** - Turbopack App Router with static route optimization
- **React 19** - Modern concurrent hooks and memoized state
- **TypeScript 5** - Full type safety
- **Tailwind CSS 4** - Modern dark UI design
- **ESLint 9** - Clean code standard

---

Built for security researchers who love to doom-scroll smart contract vulnerabilities.
