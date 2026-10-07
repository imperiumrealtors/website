import type { SelectOption } from '@/components/BrandSelect';

const labels = (values: string[]): SelectOption[] => values.map((v) => ({ value: v, label: v }));

export const PURPOSE_OPTIONS = labels([
  'Build a home soon',
  'Long-term investment',
  'Weekend or farm use',
  'Commercial development',
]);

export const PLOT_SIZE_OPTIONS = labels([
  'Up to 1,200 sq.ft',
  '1,200 – 2,400 sq.ft',
  '2,400 sq.ft and above',
  'Not decided yet',
]);

export const BUDGET_OPTIONS = labels([
  'Under ₹40 Lakhs',
  '₹40 L – ₹75 L',
  '₹75 L – ₹1.5 Cr',
  '₹1.5 Cr and above',
]);

export const TIMELINE_OPTIONS = labels([
  'Ready to buy now',
  'Within 3 months',
  'Within 6 months',
  'Just researching',
]);

export const VISIT_SLOT_OPTIONS = labels(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']);
