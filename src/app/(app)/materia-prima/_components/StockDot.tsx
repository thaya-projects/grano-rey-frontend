export function StockDot({ value, min }: { value: number; min: number }) {
  const low  = min > 0 && value < min;
  const warn = !low && min > 0 && value < min * 1.5;
  const color = low ? '#B53D35' : warn ? '#A05C0A' : '#2E7D52';
  const label = low ? 'Crítico' : warn ? 'Bajo' : 'OK';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-600" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}
