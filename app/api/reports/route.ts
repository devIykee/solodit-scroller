import { NextResponse } from 'next/server';
import { BugReport } from '../../types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Try to read from scraped data file
    const dataPath = join(process.cwd(), 'data', 'solodit-reports.json');

    if (existsSync(dataPath)) {
      const data = readFileSync(dataPath, 'utf-8');
      const reports = JSON.parse(data);

      if (Array.isArray(reports) && reports.length > 0) {
        console.log(`Loaded ${reports.length} reports from file`);
        return NextResponse.json(reports);
      }
    }

    // Try to fetch from Code4rena (public vulnerability database)
    try {
      const c4Response = await fetch('https://raw.githubusercontent.com/code-423n4/code423n4.com/main/_data/findings/findings.json', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (c4Response.ok) {
        const c4Data = await c4Response.json();
        const transformed = transformCode4renaData(c4Data);
        if (transformed.length > 0) {
          console.log(`Loaded ${transformed.length} reports from Code4rena`);
          return NextResponse.json(transformed);
        }
      }
    } catch (e) {
      console.error('Code4rena fetch failed:', e);
    }

    // Try Immunefi vulnerability data
    try {
      const immunefiResponse = await fetch('https://immunefi.com/api/bounties/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (immunefiResponse.ok) {
        const immunefiData = await immunefiResponse.json();
        const transformed = transformImmunefiData(immunefiData);
        if (transformed.length > 0) {
          console.log(`Loaded ${transformed.length} reports from Immunefi`);
          return NextResponse.json(transformed);
        }
      }
    } catch (e) {
      console.error('Immunefi fetch failed:', e);
    }

    // Fallback to curated sample data based on real vulnerabilities
    console.log('Using curated sample data');
    return NextResponse.json(getCuratedSamples());

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(getCuratedSamples());
  }
}

function transformCode4renaData(data: any[]): BugReport[] {
  return data.slice(0, 50).map((item: any, index: number) => ({
    id: item.id || `c4-${index}`,
    title: item.title || 'Untitled Vulnerability',
    severity: normalizeSeverity(item.severity || item.risk || 'medium'),
    protocol: item.contest || item.project || 'Unknown Protocol',
    auditor: 'Code4rena',
    date: item.date || new Date().toISOString().split('T')[0],
    description: item.description || item.body || '',
    impact: item.impact || item.description || '',
    recommendation: item.mitigation || '',
    tags: item.labels || ['code4rena'],
    url: item.url || 'https://code4rena.com',
  }));
}

function transformImmunefiData(data: any): BugReport[] {
  const bounties = Array.isArray(data) ? data : data.bounties || [];

  return bounties.slice(0, 50).map((item: any, index: number) => ({
    id: item.id || `immunefi-${index}`,
    title: item.project || 'Bug Bounty Program',
    severity: 'high',
    protocol: item.project || 'Unknown',
    auditor: 'Immunefi',
    date: new Date().toISOString().split('T')[0],
    description: item.description || `Bug bounty program for ${item.project}`,
    impact: `Max bounty: ${item.maxBounty || 'N/A'}`,
    recommendation: 'Review the bug bounty program details',
    tags: ['bug-bounty', 'immunefi'],
    url: item.url || 'https://immunefi.com',
  }));
}

function normalizeSeverity(severity: string): BugReport['severity'] {
  const s = String(severity).toLowerCase();
  if (s.includes('critical')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low')) return 'low';
  if (s.includes('info')) return 'informational';
  return 'medium';
}

function getCuratedSamples(): BugReport[] {
  return [
    {
      id: 'real-1',
      title: 'Wormhole Bridge Exploit - $325M Stolen',
      severity: 'critical',
      protocol: 'Wormhole',
      auditor: 'Neodyme (Post-mortem)',
      date: '2022-02-02',
      description: 'Attacker exploited a signature verification bug in the Wormhole Ethereum bridge contract. By crafting a malicious guardian set update, the attacker minted 120,000 ETH on the Solana side without depositing equivalent assets on Ethereum.',
      impact: '$325 million in ETH stolen. The vulnerability allowed arbitrary minting of wrapped ETH on Solana by bypassing signature verification through a specially crafted instruction that loaded uninitialized account data.',
      recommendation: 'Properly validate all signatures in cross-chain bridge operations. Ensure guardian set updates are authenticated. Initialize all account data and validate all external inputs. Implement comprehensive integration tests covering edge cases.',
      tags: ['bridge', 'signature-bypass', 'cross-chain', 'critical'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-2',
      title: 'Poly Network Cross-Chain Bridge Hack - $611M',
      severity: 'critical',
      protocol: 'Poly Network',
      auditor: 'SlowMist (Analysis)',
      date: '2021-08-10',
      description: 'Attacker exploited a privilege escalation vulnerability in the cross-chain message passing system. By calling a specific function with crafted parameters, the attacker was able to modify the keeper address and gain control of the bridge contracts across multiple chains.',
      impact: '$611 million stolen across Ethereum, BSC, and Polygon. The attacker drained assets by first replacing the contract keeper with their own address, then authorizing withdrawals. This remains one of the largest DeFi hacks in history.',
      recommendation: 'Implement strict access controls on privileged functions. Use multi-signature requirements for critical operations. Separate concerns between user-facing and admin functions. Add comprehensive logging and monitoring for privilege changes.',
      tags: ['bridge', 'privilege-escalation', 'multi-chain'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-3',
      title: 'Cream Finance Reentrancy Attack - $130M Loss',
      severity: 'critical',
      protocol: 'Cream Finance',
      auditor: 'PeckShield (Analysis)',
      date: '2021-10-27',
      description: 'Attacker exploited a reentrancy vulnerability combined with a flash loan to manipulate the protocol\'s internal accounting. The attack involved borrowing tokens, re-entering the borrow function before balance updates, and repeating the process.',
      impact: '$130 million in various tokens stolen. The reentrancy allowed the attacker to borrow more than their collateral should have permitted, effectively draining multiple pools through recursive calls.',
      recommendation: 'Implement reentrancy guards on all state-changing functions. Follow checks-effects-interactions pattern strictly. Use OpenZeppelin ReentrancyGuard. Consider using pull payment patterns instead of push.',
      tags: ['reentrancy', 'flash-loan', 'lending'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-4',
      title: 'Ronin Bridge Private Key Compromise - $625M',
      severity: 'critical',
      protocol: 'Ronin Network',
      auditor: 'Sky Mavis (Disclosure)',
      date: '2022-03-23',
      description: 'Attackers compromised 5 of 9 validator private keys through social engineering and infrastructure vulnerabilities. With control of the validator majority, they authorized fraudulent withdrawals from the bridge contract over a 6-day period before detection.',
      impact: '$625 million in ETH and USDC stolen. The attack demonstrated the risks of centralized validator sets in bridge designs. The breach went undetected for 6 days, allowing attackers to drain funds systematically.',
      recommendation: 'Increase validator set size and diversity. Implement hardware security modules (HSMs) for key management. Add real-time monitoring and alerting for large withdrawals. Use time-delayed withdrawals for anomaly detection.',
      tags: ['bridge', 'key-compromise', 'social-engineering'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-5',
      title: 'Nomad Bridge Total Value Locked Drained - $190M',
      severity: 'critical',
      protocol: 'Nomad',
      auditor: 'Quantstamp (Post-mortem)',
      date: '2022-08-01',
      description: 'A faulty upgrade initialized the trusted root to zero hash (0x00), allowing any message to be proven valid. Users discovered they could copy-paste transaction data with different addresses to drain funds, resulting in a "crowdsourced hack" where hundreds of users participated.',
      impact: '$190 million drained by over 300 different addresses within hours. The vulnerability made all messages appear valid, turning the bridge into an open vault. The chaotic nature made recovery extremely difficult.',
      recommendation: 'Implement rigorous upgrade testing procedures. Never initialize security-critical values to permissive defaults. Use staged rollouts for upgrades. Add pause mechanisms for emergency response. Monitor for unusual transaction patterns.',
      tags: ['bridge', 'upgrade-bug', 'initialization'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-6',
      title: 'Multichain (Anyswap) Router V3 Permit Vulnerability',
      severity: 'high',
      protocol: 'Multichain',
      auditor: 'Dedaub',
      date: '2022-01-17',
      description: 'The anySwapOutUnderlying function used a public permit function without validating msg.sender, allowing anyone to use another user\'s permit signature to transfer their tokens. The vulnerability affected the Router V3 contract deployed across multiple chains.',
      impact: '$3 million in user funds at immediate risk. Users who had granted approvals to the router contract could have their funds stolen by anyone who obtained or replayed their permit signatures.',
      recommendation: 'Validate that msg.sender matches the permit owner. Implement nonce tracking for permit signatures. Add replay protection across chains. Deprecate vulnerable contracts and migrate users to secure versions.',
      tags: ['permit', 'signature', 'router'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-7',
      title: 'Euler Finance Donation Attack - $197M Exploit',
      severity: 'critical',
      protocol: 'Euler Finance',
      auditor: 'Omniscia (Post-analysis)',
      date: '2023-03-13',
      description: 'Attacker exploited a flaw in the donation feature combined with liquidation logic. By donating collateral to themselves, self-liquidating, and repeating, they manipulated the protocol\'s internal debt tracking to borrow more than deposited.',
      impact: '$197 million stolen in DAI, USDC, stETH and WBTC. The vulnerability arose from incorrect debt tracking when donations were combined with liquidations in the same transaction.',
      recommendation: 'Validate state changes after donation operations. Prevent self-liquidation or add explicit checks. Implement sandboxing for complex transaction flows. Add invariant checks that total debt never exceeds total deposits.',
      tags: ['donation-attack', 'liquidation', 'lending'],
      url: 'https://solodit.cyfrin.io',
    },
    {
      id: 'real-8',
      title: 'BonqDAO Price Oracle Manipulation',
      severity: 'critical',
      protocol: 'BonqDAO',
      auditor: 'BlockSec',
      date: '2023-02-01',
      description: 'Attacker manipulated Tellor oracle prices by submitting malicious price data, then used the inflated collateral values to borrow the maximum amount of BEUR stablecoin. After borrowing, they crashed the collateral price and bought it back cheaply.',
      impact: '$120 million in losses. The BEUR stablecoin depegged completely. The attack demonstrated the critical importance of oracle manipulation resistance in lending protocols.',
      recommendation: 'Use decentralized oracle networks with multiple data sources. Implement price deviation limits and circuit breakers. Add time-weighted average pricing (TWAP). Require minimum oracle update delays.',
      tags: ['oracle-manipulation', 'tellor', 'lending'],
      url: 'https://solodit.cyfrin.io',
    },
  ];
}
