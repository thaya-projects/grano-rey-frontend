export function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-gr-border-lite px-3 py-2 bg-white">
      <div className="flex items-center gap-1.5 text-gr-muted mb-0.5">
        {icon}
        <p className="text-[10px] font-700 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[13px] font-700 text-gr-text truncate">{value}</p>
    </div>
  );
}
