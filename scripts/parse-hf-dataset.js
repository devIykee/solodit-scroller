const fs = require('fs');
const path = require('path');
const { parquetRead } = require('hyparquet');
const { compressors } = require('hyparquet-compressors');

const PARQUET_PATH = '/tmp/audit-findings.parquet';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'solodit-reports.json');

function normalizeSeverity(sev) {
  const s = String(sev || '').toLowerCase();
  if (s.includes('crit')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('med')) return 'medium';
  if (s.includes('low')) return 'low';
  return 'informational';
}

function extractMeta(fileName, title) {
  let date = '2024-01-15';
  let protocol = 'Smart Contract';

  if (fileName) {
    const dateMatch = fileName.match(/^(\d{4}[-.]\d{2}(?:[-.]\d{2})?)/);
    if (dateMatch) {
      date = dateMatch[1].replace(/\./g, '-');
      if (date.length === 7) date += '-01';
      const rest = fileName.slice(dateMatch[0].length).replace(/^[-_\s]+/, '');
      const protoMatch = rest.match(/^([a-zA-Z0-9\s]+?)(?:[-_][HMLEI]-\d+|_chunk|\s+Audit|\s+Report|\.json)/i);
      if (protoMatch && protoMatch[1].trim().length > 1) {
        protocol = protoMatch[1].trim().replace(/[-_]/g, ' ');
        protocol = protocol.charAt(0).toUpperCase() + protocol.slice(1);
      }
    }
  }

  if (protocol === 'Smart Contract' && title) {
    const inMatch = title.match(/\bin\s+([A-Z][a-zA-Z0-9_]{2,25})(?:::|\b)/);
    if (inMatch) {
      protocol = inMatch[1];
    }
  }

  return { date, protocol };
}

function extractTags(text, severity) {
  const tags = [severity];
  const keywords = {
    'reentrancy': /reentrancy|re-entr/i,
    'access-control': /access[- ]control|unauthorized|permission|onlyOwner|modifier/i,
    'oracle': /oracle|price manipulation|twap|chainlink/i,
    'overflow': /overflow|underflow|math|safemath/i,
    'flash-loan': /flash[- ]loan/i,
    'dos': /denial of service|dos|gas limit|out of gas/i,
    'front-running': /front[- ]run|sandwich|mev|slippage/i,
    'signature': /signature|ecrecover|permit|replay/i,
    'erc20': /erc[- ]?20|token transfer|safeTransfer/i,
    'erc721': /erc[- ]?721|erc[- ]?1155|nft/i,
    'upgrade': /upgrade|proxy|initializ/i,
    'delegation': /delegatecall|delegate/i,
    'bridge': /bridge|cross[- ]chain|layerzero|wormhole/i,
    'liquidation': /liquidat|collateral|bad debt/i,
    'precision': /rounding|precision|truncation/i,
    'governance': /governance|voting|proposal|timelock/i,
  };

  for (const [tag, pattern] of Object.entries(keywords)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)];
}

const HF_PARQUET_URL = 'https://huggingface.co/datasets/Zaevlad/audit-findings-dataset/resolve/main/data/train-00000-of-00001.parquet';

async function ensureParquetFile() {
  if (fs.existsSync(PARQUET_PATH)) return;
  console.log(`[*] Downloading parquet dataset from Hugging Face...`);
  const res = await fetch(HF_PARQUET_URL);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(PARQUET_PATH, Buffer.from(arrayBuffer));
  console.log(`[+] Downloaded and cached to ${PARQUET_PATH}`);
}

async function main() {
  await ensureParquetFile();

  const args = process.argv.slice(2);
  let limit = 1600; // Top 1,600 highest-quality findings to safely stay under Vercel 20MB limit
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10) || limit;
    } else if (args[i] === '--all') {
      limit = Infinity;
    }
  }

  console.log(`[*] Loading existing dataset from ${OUTPUT_PATH}...`);
  let existingReports = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existingReports = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    } catch {
      existingReports = [];
    }
  }
  console.log(`[*] Loaded ${existingReports.length.toLocaleString()} existing reports`);

  const existingIds = new Set(existingReports.map(r => r.id));
  const existingTitles = new Set(existingReports.map(r => r.title.toLowerCase().trim()));

  console.log(`[*] Reading Hugging Face dataset from ${PARQUET_PATH}...`);
  const buffer = fs.readFileSync(PARQUET_PATH);

  await new Promise((resolve, reject) => {
    parquetRead({
      file: buffer.buffer,
      compressors,
      rowFormat: 'object',
      onComplete: (rows) => {
        try {
          console.log(`[+] Total rows in Parquet: ${rows.length.toLocaleString()}`);

          // Filter out low quality / invalid entries
          const clean = rows.filter(r => {
            if (!r.bug_title || r.bug_title.trim().length < 5) return false;
            if (!r.bug_desc || r.bug_desc.trim().length < 50) return false;
            if (r.bug_sev === 'Unknown') return false;
            return true;
          });
          console.log(`[+] Valid clean rows: ${clean.length.toLocaleString()}`);

          // Sort by bug_weight descending to prioritize detailed findings with actual PoCs
          clean.sort((a, b) => (b.bug_weight || 0) - (a.bug_weight || 0));

          // Select up to limit
          const selected = limit === Infinity ? clean : clean.slice(0, limit);
          console.log(`[*] Transforming top ${selected.length.toLocaleString()} findings...`);

          const newReports = [];
          for (const r of selected) {
            const title = (r.bug_title || '').trim();
            const titleKey = title.toLowerCase();
            if (existingTitles.has(titleKey)) continue;

            const id = `hf-${r.id}`;
            if (existingIds.has(id)) continue;

            existingIds.add(id);
            existingTitles.add(titleKey);

            const severity = normalizeSeverity(r.bug_sev);
            const { date, protocol } = extractMeta(r.file_name, title);
            const desc = (r.bug_desc || '').trim();

            let recommendation = (r.bug_rec || '').trim();
            if (recommendation.toLowerCase() === 'no rec' || recommendation.toLowerCase() === 'no recommendation') {
              recommendation = '';
            }

            const poc = (r.bug_poc || '').trim();
            const hasValidPoc = poc && !poc.toLowerCase().includes('no poc') && poc.length > 25;
            if (hasValidPoc) {
              const formattedPoc = poc.startsWith('```') ? poc : '```solidity\n' + poc + '\n```';
              recommendation = recommendation
                ? `${recommendation}\n\n**Proof of Concept:**\n${formattedPoc}`
                : `**Proof of Concept:**\n${formattedPoc}`;
            }

            const tags = extractTags(`${title} ${desc} ${recommendation}`, severity);

            newReports.push({
              id,
              title,
              severity,
              protocol,
              auditor: 'Zaevlad Dataset',
              date,
              description: desc,
              impact: r.bug_weight ? `Write-up quality score: ${(r.bug_weight * 100).toFixed(1)}%` : '',
              recommendation,
              tags,
              url: 'https://huggingface.co/datasets/Zaevlad/audit-findings-dataset',
              source: 'local',
            });
          }

          console.log(`[+] Added ${newReports.length.toLocaleString()} new findings from Hugging Face`);

          // Merge: Keep live reports at the top, then local reports + HF reports
          const liveReports = existingReports.filter(r => r.source === 'live' || r.id.startsWith('live-'));
          const otherReports = existingReports.filter(r => r.source !== 'live' && !r.id.startsWith('live-'));
          const merged = [...liveReports, ...otherReports, ...newReports];

          console.log(`[*] Writing ${merged.length.toLocaleString()} total reports to ${OUTPUT_PATH}...`);
          fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged));

          const stat = fs.statSync(OUTPUT_PATH);
          console.log(`[+] Done! Dataset size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

main().catch(err => {
  console.error('[-] Fatal error:', err);
  process.exit(1);
});
