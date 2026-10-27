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

    // If file doesn't exist or is empty, return sample data
    console.log('Using sample data');
    const sampleReports: BugReport[] = [
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

    return NextResponse.json(sampleReports);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to load bug reports', details: String(error) },
      { status: 500 }
    );
  }
}
