import Link from 'next/link';

export function QuickAction({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: 'primary' | 'gold' | 'ghost'; }) {
  const styles = {
    primary: 'bg-gr-primary text-white hover:bg-gr-primary-mid',
    gold:    'bg-gr-gold text-[#1a0e00] hover:bg-gr-gold-dark',
    ghost:   'bg-gr-border-lite text-gr-primary hover:bg-gr-primary-lite',
  };
  return (
    <Link href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] font-600 text-[13.5px] transition-all ${styles[color]}`}>
      {icon} {label}
    </Link>
  );
}
