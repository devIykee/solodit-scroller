const fs = require('fs');
const path = require('path');
const { stringify } = require('devalue');

const SOLODIT_API_URL = 'https://solodit.cyfrin.io/api/trpc/findings.get';

function normalizeSeverity(impact) {
  const s = String(impact || '').toLowerCase();
  if (s.includes('critical')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low')) return 'low';
  if (s.includes('gas') || s.includes('info') || s.includes('informational')) return 'informational';
  return 'medium';
}

function extractSection(text, aliases) {
  if (!text) return '';
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      '(?:^|\\n)(?:\\*\\*\\s*' + escaped + '\\s*:?\\*\\*|#{2,4}\\s+' + escaped + '|\\*\\*' + escaped + '\\*\\*:?)[ \\t]*\\n?([\\s\\S]*?)(?=(?:\\n(?:\\*\\*[A-Z][a-zA-Z0-9\\s]{2,25}:?\\*\\*|#{2,4}\\s+[A-Z]|\\*\\*[A-Z][a-zA-Z0-9\\s]{2,25}\\*\\*:?))|$)',
      'i'
    );
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1].trim().replace(/^\n+|\n+$/g, '');
    }
  }
  return '';
}

function extractCodeBlocks(text) {
  if (!text) return '';
  const codeRegex = /```[\s\S]*?```/g;
  const matches = text.match(codeRegex);
  return matches ? matches.join('\n\n') : '';
}

function extractTags(text, severity, additionalTags = []) {
  const tags = [severity, ...additionalTags];

  const keywords = {
    'reentrancy': /reentrancy|re-entr/i,
    'access-control': /access[- ]control|unauthorized|permission|onlyOwner|modifier/i,
    'oracle': /oracle|price manipulation|twap|chainlink/i,
    'overflow': /overflow|underflow|math|safemath/i,
    'flash-loan': /flash[- ]loan/i,
    'dos': /denial of service|dos|gas limit|out of gas/i,
    'front-running': /front[- ]run|sandwich|mev/i,
    'signature': /signature|ecrecover|permit|replay/i,
    'erc20': /erc[- ]?20|token transfer|safeTransfer/i,
    'erc721': /erc[- ]?721|erc[- ]?1155|nft/i,
    'upgrade': /upgrade|proxy|initializ/i,
    'delegation': /delegatecall|delegate/i,
    'bridge': /bridge|cross[- ]chain|layerzero|wormhole/i,
    'slippage': /slippage|deadline|minAmount/i,
    'liquidation': /liquidat|collateral|bad debt/i,
    'precision': /rounding|precision|truncation/i,
    'governance': /governance|voting|proposal|timelock/i,
    'invariants': /invariant|accounting/i,
  };

  for (const [tag, pattern] of Object.entries(keywords)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)];
}

async function fetchLivePage(page, impactList = ['HIGH', 'MEDIUM', 'LOW', 'GAS'], retries = 2) {
  const filters = {
    keywords: '',
    firms: null,
    tags: null,
    forked: null,
    impact: impactList,
    user: undefined,
    protocol: undefined,
    reported: { label: 'All time', value: 'alltime' },
    reportedAfter: undefined,
    protocolCategory: null,
    languages: null,
    minFinders: '',
    maxFinders: '',
    rarityScore: 1,
    qualityScore: 1,
    bookmarked: false,
    read: true,
    unread: true,
    sortField: 'Recency',
    sortDirection: 'Desc'
  };

  const serialized = stringify({ filters, page });
  const payload = { '0': serialized };
  const url = `${SOLODIT_API_URL}?batch=1&input=${encodeURIComponent(JSON.stringify(payload))}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Origin': 'https://solodit.cyfrin.io',
        'Referer': 'https://solodit.cyfrin.io/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchLivePage(page, impactList, retries - 1);
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const rawDataFn = json[0]?.result?.data;
    if (!rawDataFn) {
      throw new Error('No data returned from live Solodit API');
    }

    const parsed = (0, eval)(`(${rawDataFn})`);
    return {
      totalCount: parsed.count,
      findings: parsed.findings || []
    };
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1200));
      return fetchLivePage(page, impactList, retries - 1);
    }
    throw err;
  }
}

function transformLiveFinding(raw) {
  const content = raw.content || '';
  const severity = normalizeSeverity(raw.impact);

  const description = extractSection(content, [
    'description',
    'details',
    'vulnerability detail',
    'context',
    'issue description',
    'finding description',
  ]) || (content.length > 50 ? content.slice(0, 1000) : raw.title);

  const impact = extractSection(content, [
    'impact',
    'scenario',
    'exploit scenario',
    'severity / impact',
    'severity & impact',
  ]);

  const recommendation = extractSection(content, [
    'recommendation',
    'recommendations',
    'remediation',
    'mitigation',
    'recommended mitigation',
    'resolution',
    'suggested fix',
  ]);

  const poc = extractSection(content, [
    'proof of concept',
    'poc',
    'steps to reproduce',
  ]) || extractCodeBlocks(content);

  const rawTags = Array.isArray(raw.issues_issuetagscore)
    ? raw.issues_issuetagscore.map(t => t.tags_tag?.name).filter(Boolean)
    : [];

  const tags = extractTags(content + ' ' + raw.title, severity, rawTags);

  let date = '';
  if (raw.report_date instanceof Date) {
    date = raw.report_date.toISOString().split('T')[0];
  } else if (typeof raw.report_date === 'string') {
    date = raw.report_date.split('T')[0];
  }

  const protocol = raw.protocol_name || raw.protocols_protocol?.name || 'Protocol';
  const auditor = raw.firm_name || raw.auditfirms_auditfirm?.name || 'Auditor';

  const safeId = `live-${raw.id.toString()}`;
  const slug = raw.slug || '';
  const url = slug
    ? `https://solodit.cyfrin.io/issues/${slug}`
    : `https://solodit.cyfrin.io/issues?search=${encodeURIComponent(raw.title)}`;

  return {
    id: safeId,
    title: raw.title,
    severity: severity,
    protocol: protocol,
    auditor: auditor,
    date: date,
    description: description,
    impact: impact,
    recommendation: recommendation + (poc && !recommendation.includes(poc) ? '\n\n**Proof of Concept:**\n' + poc : ''),
    tags: tags,
    url: url,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let pagesToFetch = 25; // Default 25 pages (250 live findings)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages' && args[i + 1]) {
      pagesToFetch = parseInt(args[i + 1], 10) || pagesToFetch;
    }
  }

  console.log(`[*] Connecting to live Solodit API (55,403 findings database)...`);
  console.log(`[*] Target: ${pagesToFetch} pages (~${pagesToFetch * 10} findings)`);

  const dataPath = path.join(__dirname, '..', 'data', 'solodit-reports.json');
  let existingReports = [];
  if (fs.existsSync(dataPath)) {
    try {
      existingReports = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      console.log(`[*] Loaded ${existingReports.length} existing reports from file`);
    } catch {
      existingReports = [];
    }
  }

  const existingIds = new Set(existingReports.map(r => r.id));
  const newReports = [];
  let totalLiveCount = 0;

  for (let page = 1; page <= pagesToFetch; page++) {
    process.stdout.write(`[*] Fetching page ${page}/${pagesToFetch}... `);
    try {
      const res = await fetchLivePage(page);
      if (res.totalCount) totalLiveCount = res.totalCount;

      let addedInPage = 0;
      for (const item of res.findings) {
        const transformed = transformLiveFinding(item);
        if (!existingIds.has(transformed.id)) {
          existingIds.add(transformed.id);
          newReports.push(transformed);
          addedInPage++;
        }
      }

      console.log(`done (+${addedInPage} new)`);
    } catch (err) {
      console.log(`failed (${err.message})`);
    }

    // Respectful 350ms delay between pages
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`[+] Total live findings available on Solodit: ${totalLiveCount.toLocaleString()}`);
  console.log(`[+] Newly fetched live findings: ${newReports.length}`);

  // Merge live findings at the top of the feed
  const merged = [...newReports, ...existingReports];
  fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));

  console.log(`[+] Total reports in dataset: ${merged.length.toLocaleString()}`);
  console.log(`[+] Saved to ${dataPath}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[-] Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { fetchLivePage, transformLiveFinding };
