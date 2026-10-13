import { formatBs } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function VentasChart({ data }: { data: { mes: string; monto: number }[] }) {
  return (
    <div className="lg:col-span-3 card-no-pad">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gr-border">
        <div>
          <p className="font-800 text-gr-text text-[14px]">Ventas últimos 6 meses</p>
          <p className="text-[12px] text-gr-muted">En bolivianos</p>
        </div>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gr-border)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip formatter={(v) => [formatBs(v as number), 'Total']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-gr-border)' }} />
            <Bar dataKey="monto" fill="var(--color-gr-primary)" radius={[6, 6, 0, 0]} opacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
