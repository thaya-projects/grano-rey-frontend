import Link from 'next/link';

/** KPI navegable del dashboard (icono + link + subtítulo). Distinto del KpiCard genérico de @/components/ui. */
export function KpiCard({ label, value, sub, icon, color, href }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  color: 'primary' | 'gold' | 'success' | 'warning'; href: string;
}) {
  const colorMap = {
    primary: { bg: 'var(--color-gr-primary-lite)', text: 'var(--color-gr-primary)'  },
    gold:    { bg: 'var(--color-gr-gold-lite)',    text: 'var(--color-gr-gold-dark)' },
    success: { bg: 'var(--color-gr-success-bg)',   text: 'var(--color-gr-success)'  },
    warning: { bg: 'var(--color-gr-warning-bg)',   text: 'var(--color-gr-warning)'  },
  };
  const c = colorMap[color];
  return (
    <Link href={href} className="card block hover:shadow-md hover:border-gr-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide">{label}</p>
        <div style={{ background: c.bg, color: c.text }} className="w-9 h-9 rounded-[10px] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-[26px] font-900 text-gr-text leading-none mb-1">{value}</p>
      <p className="text-[12px] text-gr-muted">{sub}</p>
    </Link>
  );
}
