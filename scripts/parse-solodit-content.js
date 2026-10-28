const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine content directory (env var, local dir, or /tmp)
function getReportsDir() {
  const possiblePaths = [
    process.env.SOLODIT_CONTENT_DIR ? path.join(process.env.SOLODIT_CONTENT_DIR, 'reports') : null,
    path.join(__dirname, '..', 'solodit_content', 'reports'),
    '/tmp/solodit_content/reports',
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // If not found, clone repository into /tmp/solodit_content
  console.log('Solodit content not found locally. Cloning repository (depth=1)...');
  try {
    execSync('git clone --depth 1 https://github.com/solodit/solodit_content.git /tmp/solodit_content', {
      stdio: 'inherit',
    });
    if (fs.existsSync('/tmp/solodit_content/reports')) {
      return '/tmp/solodit_content/reports';
    }
  } catch (err) {
    console.error('Failed to clone repository:', err.message);
  }

  return null;
}

// Clone and parse Solodit content repository
async function parseSoloditReports() {
  console.log('[*] Parsing Solodit content repository...');

  const reportsDir = getReportsDir();

  if (!reportsDir || !fs.existsSync(reportsDir)) {
    console.error('Solodit reports directory not found.');
    return [];
  }

  const reports = [];
  const auditorDirs = fs.readdirSync(reportsDir).filter(f => {
    const fullPath = path.join(reportsDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  console.log(`Found ${auditorDirs.length} auditor directories in ${reportsDir}`);

  for (const auditor of auditorDirs) {
    const auditorPath = path.join(reportsDir, auditor);
    const files = fs.readdirSync(auditorPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      try {
        const filePath = path.join(auditorPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse the markdown file
        const parsed = parseReport(content, file, auditor);
        if (parsed.length > 0) {
          reports.push(...parsed);
        }
      } catch (error) {
        console.error(`Error parsing ${file}:`, error.message);
      }
    }
  }

  console.log(`[+] Parsed ${reports.length} vulnerability reports`);
  return reports;
}

function parseReport(content, filename, auditor) {
  const reports = [];

  // Extract protocol name and date from filename (e.g., "2025-01-09-Evoq.md")
  const match = filename.match(/(\d{4}-\d{2}-\d{2})-(.+)\.md/);
  const date = match ? match[1] : '';
  const protocol = match ? match[2] : filename.replace('.md', '');

  // Split by severity sections (handles "## High Risk", "## High", "## Informational", etc.)
  const severityRegex = /##\s+(Critical|High|Medium|Low|Informational|Gas(?:\s+Optimizations?)?|Non-Critical|QA(?:\s+Report)?)(?:\s+Risk)?/gi;
  const sections = content.split(severityRegex);

  for (let i = 1; i < sections.length; i += 2) {
    const severityRaw = sections[i];
    const sectionContent = sections[i + 1] || '';

    // Split by individual findings (### headers)
    const findings = sectionContent.split(/###\s+/).filter(f => f.trim());

    for (const finding of findings) {
      const lines = finding.split('\n');
      const rawTitle = lines[0].trim();

      if (!rawTitle || rawTitle.length < 4) continue;

      // Clean up markdown formatting in title
      const title = rawTitle
        .replace(/\[\s*([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links [text](url)
        .replace(/[*_`]/g, '')
        .trim();

      if (!title || title.length < 4) continue;

      // Extract sections
      const description = extractSection(finding, [
        'description',
        'details',
        'vulnerability detail',
        'context',
        'issue description',
        'finding description',
      ]);

      const impact = extractSection(finding, [
        'impact',
        'scenario',
        'exploit scenario',
        'severity / impact',
        'severity & impact',
      ]);

      const recommendation = extractSection(finding, [
        'recommendation',
        'recommendations',
        'remediation',
        'mitigation',
        'recommended mitigation',
        'resolution',
        'suggested fix',
      ]);

      const poc = extractSection(finding, [
        'proof of concept',
        'poc',
        'steps to reproduce',
      ]) || extractCodeBlocks(finding);

      // Fallback for description if empty
      let finalDescription = description;
      if (!finalDescription) {
        const remainingLines = lines.slice(1).join('\n').trim();
        const nextSubheader = remainingLines.match(/(?:^|\n)(?:\*\*[A-Z][a-zA-Z0-9\s]{2,25}:?\*\*|#{3,4}\s+[A-Z])/);
        if (nextSubheader && nextSubheader.index > 0) {
          finalDescription = remainingLines.substring(0, nextSubheader.index).trim();
        } else if (!recommendation && !impact) {
          finalDescription = remainingLines;
        }
      }

      if (!finalDescription) {
        finalDescription = title;
      }

      const severity = normalizeSeverity(severityRaw);
      const tags = extractTags(finding, severity);

      const safeId = `solodit-${protocol}-${title.replace(/\W+/g, '-').toLowerCase()}`.replace(/-+/g, '-');

      reports.push({
        id: safeId,
        title: title,
        severity: severity,
        protocol: protocol,
        auditor: auditor,
        date: date,
        description: finalDescription,
        impact: impact,
        recommendation: recommendation + (poc && !recommendation.includes(poc) ? '\n\n**Proof of Concept:**\n' + poc : ''),
        tags: tags,
        url: `https://solodit.cyfrin.io/issues?search=${encodeURIComponent(title)}`,
        source: 'local',
      });
    }
  }

  return reports;
}

function extractSection(text, aliases) {
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      '(?:^|\\n)(?:\\*\\*\\s*' + escaped + '\\s*:?\\*\\*|#{3,4}\\s+' + escaped + '|\\*\\*' + escaped + '\\*\\*:?)[ \\t]*\\n?([\\s\\S]*?)(?=(?:\\n(?:\\*\\*[A-Z][a-zA-Z0-9\\s]{2,25}:?\\*\\*|#{3,4}\\s+[A-Z]|\\*\\*[A-Z][a-zA-Z0-9\\s]{2,25}\\*\\*:?))|$)',
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
  const codeRegex = /```[\s\S]*?```/g;
  const matches = text.match(codeRegex);
  return matches ? matches.join('\n\n') : '';
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

function normalizeSeverity(severity) {
  const s = String(severity).toLowerCase();
  if (s.includes('critical')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low')) return 'low';
  if (s.includes('info') || s.includes('gas') || s.includes('non-critical') || s.includes('qa')) return 'informational';
  return 'medium';
}

async function main() {
  const reports = await parseSoloditReports();

  // Save to output file
  const outputPath = path.join(__dirname, '..', 'data', 'solodit-reports.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(reports, null, 2));
  console.log(`[+] Saved ${reports.length} reports to ${outputPath}`);
  console.log('\nReport statistics:');

  const bySeverity = reports.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {});

  console.log('By severity:', bySeverity);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { parseSoloditReports };
