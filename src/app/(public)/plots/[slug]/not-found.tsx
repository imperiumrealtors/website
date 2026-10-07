import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function PlotNotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--nav-height)', textAlign: 'center', padding: '0 24px' }}>
      <AlertCircle size={44} color="var(--text-muted)" style={{ marginBottom: 18 }} />
      <h1 className="font-display" style={{ fontSize: 28, color: 'var(--brand-deep)', marginBottom: 10 }}>Plot not found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 26 }}>This layout is no longer listed, or the link is incorrect.</p>
      <Link href="/plots" className="btn btn-primary">Browse all plots</Link>
    </div>
  );
}
