export interface BugReport {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  protocol: string;
  auditor: string;
  date: string;
  description: string;
  impact: string;
  recommendation?: string;
  tags: string[];
  url?: string;
}
