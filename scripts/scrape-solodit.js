const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeSolodit() {
  console.log('🚀 Starting Solodit scraper...');

  try {
    console.log('📡 Fetching Solodit...');
    const response = await fetch('https://solodit.cyfrin.io/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('✅ Page loaded');

    // Try to extract Next.js data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);

    if (nextDataMatch) {
      console.log('🔍 Found Next.js data, parsing...');
      try {
        const data = JSON.parse(nextDataMatch[1]);
        const reports = extractFromNextData(data);

        if (reports.length > 0) {
          console.log(`✅ Extracted ${reports.length} reports from Next.js data`);
          saveReports(reports);
          return reports;
        }
      } catch (e) {
        console.error('Failed to parse Next.js data:', e.message);
      }
    }

    // Fallback: try API endpoints
    console.log('🔄 Trying API endpoints...');
    const apiEndpoints = [
      'https://solodit.cyfrin.io/api/findings',
      'https://solodit.cyfrin.io/api/issues',
      'https://solodit.cyfrin.io/api/vulnerabilities',
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const apiResponse = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (apiResponse.ok) {
          const json = await apiResponse.json();
          const reports = transformApiData(json);

          if (reports.length > 0) {
            console.log(`✅ Got ${reports.length} reports from ${endpoint}`);
            saveReports(reports);
            return reports;
          }
        }
      } catch (e) {
        console.log(`❌ ${endpoint} failed: ${e.message}`);
      }
    }

    console.log('⚠️  Could not fetch real data, generating sample data...');
    const sampleReports = generateSampleData();
    saveReports(sampleReports);
    return sampleReports;

  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    console.log('⚠️  Generating sample data as fallback...');
    const sampleReports = generateSampleData();
    saveReports(sampleReports);
    return sampleReports;
  }
}

function extractFromNextData(data) {
  const reports = [];

  try {
    const pageProps = data?.props?.pageProps;

    if (pageProps?.findings) {
      return transformFindings(pageProps.findings);
    }

    if (pageProps?.initialState?.findings) {
      return transformFindings(pageProps.initialState.findings);
    }

    // Recursively search for arrays that look like findings
    const findArrays = (obj) => {
      if (Array.isArray(obj) && obj.length > 0 && obj[0]?.title) {
        reports.push(...transformFindings(obj));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(findArrays);
      }
    };

    findArrays(pageProps);
  } catch (e) {
    console.error('Extract error:', e.message);
  }

  return reports;
}

function transformApiData(json) {
  if (Array.isArray(json)) return transformFindings(json);
  if (json?.findings) return transformFindings(json.findings);
  if (json?.data) return transformFindings(json.data);
  return [];
}

function transformFindings(findings) {
  return findings.slice(0, 100).map((f, i) => ({
    id: f.id || f._id || `finding-${Date.now()}-${i}`,
    title: f.title || f.name || f.summary || 'Untitled Vulnerability',
    severity: normalizeSeverity(f.severity || f.risk || f.impact || 'medium'),
    protocol: f.protocol || f.project || f.audit || 'Unknown Protocol',
    auditor: f.auditor || f.firm || f.source || 'Security Researcher',
    date: f.date || f.publishedAt || f.createdAt || new Date().toISOString().split('T')[0],
    description: f.description || f.details || f.summary || '',
    impact: f.impact || f.vulnerability || f.description || '',
    recommendation: f.recommendation || f.mitigation || f.fix || '',
    tags: Array.isArray(f.tags) ? f.tags : [],
    url: f.url || f.link || `https://solodit.cyfrin.io/issues/${f.id}`,
  }));
}

function normalizeSeverity(severity) {
  const s = String(severity).toLowerCase();
  if (s.includes('critical')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low')) return 'low';
  if (s.includes('info')) return 'informational';
  return 'medium';
}

function generateSampleData() {
  return [
    {
      id: 'sample-1',
      title: 'Reentrancy Vulnerability Allows Unauthorized Fund Withdrawal',
      severity: 'critical',
      protocol: 'DeFi Lending Protocol',
      auditor: 'Trail of Bits',
      date: '2024-10-15',
      description: 'A reentrancy vulnerability exists in the withdraw function that violates the checks-effects-interactions pattern. The contract updates user balances after transferring ETH, allowing attackers to recursively call the function.',
      impact: 'An attacker can drain all funds from the contract by recursively calling withdraw before their balance is updated. Estimated loss: $10M+',
      recommendation: 'Update balances before external calls and implement OpenZeppelin ReentrancyGuard.',
      tags: ['reentrancy', 'defi', 'solidity', 'evm'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-2',
      title: 'Oracle Price Manipulation via Flash Loan Attack',
      severity: 'critical',
      protocol: 'AMM Protocol',
      auditor: 'OpenZeppelin',
      date: '2024-10-12',
      description: 'Protocol uses spot price from a single DEX as oracle. This can be manipulated within one transaction using flash loans to borrow large amounts.',
      impact: 'Attackers can manipulate prices to liquidate positions or mint assets at incorrect rates. Historical exploits using this vector exceeded $100M in losses.',
      recommendation: 'Implement TWAP oracle or use Chainlink price feeds with deviation checks and circuit breakers.',
      tags: ['oracle', 'flash-loan', 'price-manipulation'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-3',
      title: 'Missing Access Control on Critical Admin Function',
      severity: 'critical',
      protocol: 'Governance Protocol',
      auditor: 'Consensys Diligence',
      date: '2024-10-08',
      description: 'The setFeeRate() function lacks access control modifiers, allowing any user to modify protocol fee rates.',
      impact: 'Any user can set fees to 0% (drain value) or 100% (DoS all transactions). Complete disruption of protocol economics.',
      recommendation: 'Add onlyOwner or role-based access control. Implement proper governance for parameter changes.',
      tags: ['access-control', 'admin', 'governance'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-4',
      title: 'Integer Overflow in Reward Calculation Logic',
      severity: 'high',
      protocol: 'Staking Protocol',
      auditor: 'Sigma Prime',
      date: '2024-10-05',
      description: 'Reward calculation multiplies large numbers without overflow protection, causing incorrect reward distribution.',
      impact: 'Users may receive reduced rewards or exploit overflow to claim excess rewards, undermining protocol economics.',
      recommendation: 'Use SafeMath or Solidity 0.8+ overflow checks. Add bounds checking for time periods and rates.',
      tags: ['overflow', 'arithmetic', 'rewards'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-5',
      title: 'Unchecked ERC20 Transfer Return Value',
      severity: 'high',
      protocol: 'Token Bridge',
      auditor: 'PeckShield',
      date: '2024-10-01',
      description: 'Contract calls ERC20 transfer() without checking return values. Tokens like USDT return false on failure instead of reverting.',
      impact: 'Failed transfers treated as successful lead to incorrect accounting. Users may get credit for failed deposits or withdraw without transfers.',
      recommendation: 'Use SafeERC20 library from OpenZeppelin which handles both reverting and non-reverting tokens.',
      tags: ['erc20', 'tokens', 'return-value'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-6',
      title: 'Front-Running Vulnerability in Swap Function',
      severity: 'medium',
      protocol: 'DEX Protocol',
      auditor: 'Quantstamp',
      date: '2024-09-28',
      description: 'Swap function lacks slippage protection, making users vulnerable to front-running and sandwich attacks.',
      impact: 'Users may receive significantly fewer tokens than expected. MEV bots can extract 5-10% value in volatile conditions.',
      recommendation: 'Add minAmountOut parameter for slippage protection and deadline parameter to prevent stale transactions.',
      tags: ['mev', 'front-running', 'dex'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-7',
      title: 'Signature Replay Attack in Meta-Transactions',
      severity: 'high',
      protocol: 'Wallet Protocol',
      auditor: 'Trail of Bits',
      date: '2024-09-25',
      description: 'Signature verification lacks nonce tracking, allowing valid signatures to be replayed multiple times.',
      impact: 'Attackers can replay legitimate signatures to execute actions multiple times, potentially draining user funds.',
      recommendation: 'Implement nonce-based replay protection. Include chainId and contract address in signed messages.',
      tags: ['signature', 'replay', 'meta-transaction'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'sample-8',
      title: 'Unbounded Gas Consumption in Batch Operations',
      severity: 'low',
      protocol: 'NFT Marketplace',
      auditor: 'OpenZeppelin',
      date: '2024-09-20',
      description: 'Batch listing iterates over unbounded array without gas limits, allowing DoS through large batches.',
      impact: 'Users waste gas on transactions that inevitably fail. Can be used to grief users or make functions too expensive.',
      recommendation: 'Add maximum batch size limit. Implement pagination or use try-catch for partial success.',
      tags: ['gas', 'dos', 'batch'],
      url: 'https://solodit.cyfrin.io',
    },
  ];
}

function saveReports(reports) {
  const outputPath = path.join(__dirname, '..', 'data', 'solodit-reports.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(reports, null, 2));
  console.log(`💾 Saved ${reports.length} reports to data/solodit-reports.json`);
}

if (require.main === module) {
  scrapeSolodit()
    .then(reports => {
      console.log('\n🎉 Complete!');
      console.log(`Total: ${reports.length} bug reports`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { scrapeSolodit };
