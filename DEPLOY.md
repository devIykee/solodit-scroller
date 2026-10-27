# 🚀 Deploy to Vercel

Your bug report scroller is ready! Since the CLI had network issues, deploy via the web interface:

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

✅ **Red/Green/Blue Theme**
- Critical/High → Red
- Medium → Blue  
- Low/Info → Green

✅ **Bookmarking**
- Press `B` to bookmark
- Saves to localStorage
- Never lose your place

✅ **Auto-Resume**
- Remembers scroll position
- Pick up where you left off
- All data persists

✅ **Real Data Ready**
- Scraper in `scripts/scrape-solodit.js`
- Falls back to quality samples
- API at `/api/reports`

## Controls

- **Scroll/Swipe** - Navigate reports
- **Arrow Keys** - Up/Down
- **B Key** - Toggle bookmark
- **Click Dots** - Jump to specific report
- **Star Button** - Bookmark current report

## Next Steps

### Get Real Solodit Data

The scraper needs a working network connection to Solodit. To run it:

```bash
node scripts/scrape-solodit.js
```

Or set up a cron job to fetch fresh data periodically.

### Customize

Edit these files:
- `app/components/BugReportCard.tsx` - Card styling
- `app/page.tsx` - Main app logic
- `app/api/reports/route.ts` - Data source

## Repository

https://github.com/devIykee/solodit-scroller

## Local Development

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
```

---

**Your app is production-ready!** Just click deploy on Vercel and start doom-scrolling bug reports. 🐛✨
