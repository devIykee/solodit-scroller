# 🔥 Bug Report Scroller

TikTok-style doom-scrolling interface for browsing smart contract security vulnerabilities from Solodit.

## Features

- 📱 **TikTok-style vertical scrolling** - Swipe, scroll, or use arrow / vim keys (`j` / `k`)
- 📚 **6,100+ Real Solodit Reports** - Extracted from the Solodit vulnerability repository across 17 top security firms
- ⚡ **Virtualized 60fps rendering** - Butter-smooth scrolling with zero DOM bloat even with thousands of findings
- 🎨 **Clean high-contrast theme** - Color-coded borders by severity (Critical, High, Medium, Low, Info)
- 💻 **Syntax-highlighted code blocks** - One-click code copying for exploits and proofs of concept
- 🔍 **Real-time search & filters** - Search by protocol, title, auditor, tag, or description
- 🏷️ **Interactive vulnerability tags** - Click tags like `#reentrancy`, `#oracle`, `#bridge` to filter findings instantly
- 🎲 **Random vulnerability jump** - Hit `R` or click Random to study unexpected bugs
- ★ **Local bookmarking** - Save findings with `B` and resume exactly where you left off
- 🔗 **Direct Solodit links** - One-click jump to full issues on Solodit

## Quick Start

```bash
# Install dependencies
npm install

# (Optional) Re-parse or update Solodit reports
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
| `↓` / `J` / `Space` | Next vulnerability |
| `↑` / `K` / `Shift+Space` | Previous vulnerability |
| `B` | Bookmark / Save current report |
| `R` | Jump to random vulnerability |
| `/` | Open search input |
| `?` | Show keyboard shortcuts modal |
| `Esc` | Close search or modal |
| Mouse Wheel | Scroll smoothly between cards |
| Touch Swipe | Swipe up/down on mobile |

## Dataset & Solodit Content Parser

The app includes an automated parser script [`scripts/parse-solodit-content.js`](scripts/parse-solodit-content.js) that reads markdown vulnerability reports from [Solodit's content repository](https://github.com/solodit/solodit_content.git):

```bash
npm run parse:solodit
```

The script:
1. Detects or clones `solodit/solodit_content` (shallow depth 1)
2. Parses vulnerability findings across all auditor directories (`0x52`, `AuditOne`, `Hexens`, `Pashov Audit Group`, `Trust Security`, etc.)
3. Extracts descriptions, impact scenarios, remediation steps, and code snippets
4. Categorizes tags (reentrancy, access-control, oracle, bridges, flash loans, etc.)
5. Saves the parsed JSON to `data/solodit-reports.json`

## Deploy to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: real solodit vulnerability data and virtualized scroller"
   git push origin master
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

Built with ❤️ for security researchers who love to doom-scroll smart contract vulnerabilities.
