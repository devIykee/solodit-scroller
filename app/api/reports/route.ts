import { NextResponse } from 'next/server';
import { BugReport } from '../../types';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read from scraped data file
    const dataPath = path.join(process.cwd(), 'data', 'solodit-reports.json');

    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      const reports = JSON.parse(data);
      return NextResponse.json(reports);
    }

    // Fallback: fetch from Solodit API
    const apiEndpoints = [
      'https://solodit.cyfrin.io/api/findings',
      'https://solodit.cyfrin.io/api/issues',
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (response.ok) {
          const json = await response.json();
          const reports = transformApiData(json);
          if (reports.length > 0) {
            return NextResponse.json(reports);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch from ${endpoint}:`, e);
      }
    }

    // Return empty array if nothing works
    return NextResponse.json([]);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to load bug reports' },
      { status: 500 }
    );
  }
}

function transformApiData(json: any): BugReport[] {
  let data = json;

  if (json.findings) data = json.findings;
  else if (json.data) data = json.data;

  if (!Array.isArray(data)) return [];

  return data.slice(0, 100).map((item: any, index: number) => ({
    id: item.id || item._id || `finding-${Date.now()}-${index}`,
    title: item.title || item.name || 'Untitled',
    severity: normalizeSeverity(item.severity || item.risk || 'medium'),
    protocol: item.protocol || item.project || 'Unknown',
    auditor: item.auditor || item.source || 'Security Researcher',
    date: item.date || item.publishedAt || new Date().toISOString().split('T')[0],
    description: item.description || item.summary || '',
    impact: item.impact || item.description || '',
    recommendation: item.recommendation || item.mitigation || '',
    tags: item.tags || [],
    url: item.url || `https://solodit.cyfrin.io/issues/${item.id}`,
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
