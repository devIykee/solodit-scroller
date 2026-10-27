# 🔥 Bug Report Scroller

TikTok-style doom-scrolling interface for browsing smart contract security vulnerabilities from Solodit.

## Features

- 📱 **TikTok-style vertical scrolling** - Swipe, scroll, or use arrow keys
- 🎨 **Beautiful gradient cards** - Color-coded by severity (Critical, High, Medium, Low)
- ⚡ **Smooth animations** - Buttery 60fps transitions
- 📊 **Progress indicator** - See where you are in the feed
- 🎯 **Detailed reports** - Full vulnerability descriptions, impacts, and recommendations
- 🏷️ **Smart tagging** - Filter and categorize vulnerabilities
- 📱 **Fully responsive** - Works on desktop and mobile

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start doom-scrolling bug reports!

## Controls

- **Mouse wheel** - Scroll up/down to navigate
- **Touch gestures** - Swipe up/down on mobile
- **Arrow keys** - Up/Down to navigate
- **Spacebar** - Next report
- **Progress dots** - Click to jump to specific reports

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/solodit-scroller)

### Manual Deployment

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Deploy to a global CDN
- Provide you with a production URL

## Data Source

Currently using sample data. To integrate real Solodit data:

### Option 1: Web Scraping (Recommended)

Install scraping dependencies:

```bash
npm install puppeteer cheerio
```

Update `app/api/reports/route.ts` to scrape Solodit:

```typescript
import puppeteer from 'puppeteer';

export async function GET() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://solodit.cyfrin.io');
  
  // Scrape reports from the page
  const reports = await page.evaluate(() => {
    // Your scraping logic here
  });
  
  await browser.close();
  return NextResponse.json(reports);
}
```

### Option 2: API Integration

If Solodit provides an API, update the route to call it:

```typescript
export async function GET() {
  const response = await fetch('https://api.solodit.cyfrin.io/reports');
  const data = await response.json();
  return NextResponse.json(data);
}
```

### Option 3: Database Sync

Set up a cron job or scheduled function to periodically sync Solodit data to your database, then serve from there.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Vercel** - Deployment platform

## Customization

### Change Colors

Edit severity colors in `app/components/BugReportCard.tsx`:

```typescript
const severityColors = {
  critical: 'from-red-600 to-red-800',
  high: 'from-orange-500 to-orange-700',
  // ... customize as needed
};
```

### Add Filters

Add filter buttons to `app/page.tsx` to filter by severity, protocol, or tags.

### Enable Bookmarks

Add a bookmark feature by storing favorites in localStorage or a backend database.

## License

MIT

## Contributing

Pull requests welcome! Feel free to add:
- Real Solodit integration
- Filters and search
- Bookmarking system
- Share functionality
- Dark/light mode toggle
- More animations

---

Built with ❤️ for security researchers who like to doom-scroll vulnerabilities
