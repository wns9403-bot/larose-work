import type { Metadata } from 'next';
import MonthlyReport from '@/components/MonthlyReport';

export const metadata: Metadata = {
  title: '[26년 6월] La Rosée 롯데백화점 평촌점 월말 보고서',
};

export default function ReportPage() {
  return <MonthlyReport />;
}
