'use client';
import { Document, Page, View, Text, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import type { MovimientoMP } from '@/lib/mock';
import { formatBs } from '@/lib/utils';

const GREEN  = '#3C5A44';
const MUTED  = '#8AA08A';
const BORDER = '#D8E2D9';

const s = StyleSheet.create({
  page:   { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D2B1F', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  co:     { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN },
  sub:    { fontSize: 9, color: MUTED, marginTop: 2 },
  h1:     { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 12 },
  tHead:  { flexDirection: 'row', backgroundColor: GREEN, padding: '6 10', borderRadius: 4, marginBottom: 2 },
  tHcell: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tRow:   { flexDirection: 'row', padding: '6 10', borderBottomWidth: 1, borderBottomColor: BORDER },
  tCell:  { fontSize: 9, color: '#1D2B1F' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  ftext:  { fontSize: 8, color: MUTED },
});

function fQQ(n: number) { return `${n.toFixed(2)} QQ`; }

function DocComp({ data }: { data: { movimientos: MovimientoMP[] } }) {
  const { movimientos } = data;
  const now = new Date().toLocaleDateString('es-BO');
  const totalQQ = movimientos.reduce((s, m) => s + m.totalQQ, 0);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.co}>GRANO REY</Text>
            <Text style={s.sub}>Movimientos de Materia Prima · {movimientos.length} registros</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.sub, { fontSize: 8 }]}>Generado el {now}</Text>
            <Text style={[s.sub, { fontSize: 8 }]}>Grano Rey SRL</Text>
          </View>
        </View>

        <Text style={s.h1}>Detalle de movimientos</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { width: 50 }]}>Tipo</Text>
          <Text style={[s.tHcell, { flex: 1 }]}>Materia Prima</Text>
          <Text style={[s.tHcell, { width: 55, textAlign: 'right' }]}>Total QQ</Text>
          <Text style={[s.tHcell, { width: 65, textAlign: 'right' }]}>Costo Bs</Text>
          <Text style={[s.tHcell, { width: 40, textAlign: 'right' }]}>Lote</Text>
          <Text style={[s.tHcell, { width: 55 }]}>Fecha</Text>
          <Text style={[s.tHcell, { width: 70 }]}>Responsable</Text>
        </View>
        {movimientos.map((m, i) => (
          <View key={m.id} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
            <Text style={[s.tCell, { width: 50, color: m.tipo === 'ingreso' ? '#2E7D52' : '#B53D35', fontFamily: 'Helvetica-Bold' }]}>
              {m.tipo === 'ingreso' ? '↑ Ing.' : '↓ Sal.'}
            </Text>
            <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{m.mpNombre}</Text>
            <Text style={[s.tCell, { width: 55, textAlign: 'right' }]}>{fQQ(m.totalQQ)}</Text>
            <Text style={[s.tCell, { width: 65, textAlign: 'right', color: MUTED }]}>{m.costoBs ? formatBs(m.costoBs) : '—'}</Text>
            <Text style={[s.tCell, { width: 40, textAlign: 'right', color: MUTED }]}>{m.lote ? `#${m.lote}` : '—'}</Text>
            <Text style={[s.tCell, { width: 55, color: MUTED }]}>{m.fecha}</Text>
            <Text style={[s.tCell, { width: 70 }]}>{m.responsable}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', padding: '8 10', backgroundColor: '#EBF2EC', borderRadius: 4, marginTop: 4 }}>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>{movimientos.length} movimientos</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>{fQQ(totalQQ)} totales</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.ftext}>Grano Rey SRL · Reporte interno</Text>
          <Text style={s.ftext}>{now} · Movimientos MP</Text>
        </View>
      </Page>
    </Document>
  );
}

type Props = { data: { movimientos: MovimientoMP[] } };

export function MovimientosMPPDFLink({ data }: Props) {
  return (
    <PDFDownloadLink document={<DocComp data={data} />} fileName="movimientos-mp.pdf">
      {({ loading }) => (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12.5px] font-700 cursor-pointer transition-opacity hover:opacity-80 select-none"
          style={{ background: '#C49A1A', color: '#fff' }}>
          <Download size={13} />
          {loading ? 'Preparando…' : 'Descargar PDF'}
        </span>
      )}
    </PDFDownloadLink>
  );
}
