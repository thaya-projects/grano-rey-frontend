'use client';
import { Document, Page, View, Text, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import type { Venta } from '@/lib/mock';

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

const ESTADO_LABELS: Record<string, string> = {
  entregado: 'Entregado', despachado: 'Despachado', pendiente: 'Pendiente', cancelado: 'Cancelado',
};

function fBs(n: number) { return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`; }

function DocComp({ data }: { data: { ventas: Venta[]; total: number } }) {
  const { ventas, total } = data;
  const now = new Date().toLocaleDateString('es-BO');
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.co}>GRANO REY</Text>
            <Text style={s.sub}>Reporte de Ventas · {ventas.length} notas</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.sub, { fontSize: 8 }]}>Generado el {now}</Text>
            <Text style={[s.sub, { fontSize: 8 }]}>Grano Rey SRL</Text>
          </View>
        </View>

        <Text style={s.h1}>Detalle de ventas</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { width: 40 }]}>N°</Text>
          <Text style={[s.tHcell, { flex: 1 }]}>Cliente</Text>
          <Text style={[s.tHcell, { flex: 2 }]}>Productos</Text>
          <Text style={[s.tHcell, { width: 70, textAlign: 'right' }]}>Total</Text>
          <Text style={[s.tHcell, { width: 70 }]}>Estado</Text>
          <Text style={[s.tHcell, { width: 60 }]}>Fecha</Text>
        </View>
        {ventas.map((v, i) => (
          <View key={v.id} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
            <Text style={[s.tCell, { width: 40, fontFamily: 'Helvetica-Bold' }]}>N°{v.numero}</Text>
            <Text style={[s.tCell, { flex: 1 }]}>{v.clienteNombre}</Text>
            <Text style={[s.tCell, { flex: 2, color: MUTED }]}>
              {v.detalles.map(d => `${d.productoNombre} ×${d.cantidad}`).join(' · ')}
            </Text>
            <Text style={[s.tCell, { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fBs(v.totalBs)}</Text>
            <Text style={[s.tCell, { width: 70 }]}>{ESTADO_LABELS[v.estado] ?? v.estado}</Text>
            <Text style={[s.tCell, { width: 60, color: MUTED }]}>{v.fecha}</Text>
          </View>
        ))}
        {/* Totals row */}
        <View style={{ flexDirection: 'row', padding: '8 10', backgroundColor: '#EBF2EC', borderRadius: 4, marginTop: 4 }}>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>{ventas.length} ventas</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: GREEN }}>{fBs(total)}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.ftext}>Grano Rey SRL · Reporte interno</Text>
          <Text style={s.ftext}>{now} · Ventas</Text>
        </View>
      </Page>
    </Document>
  );
}

type Props = { data: { ventas: Venta[]; total: number } };

export function VentasPDFLink({ data }: Props) {
  return (
    <PDFDownloadLink document={<DocComp data={data} />} fileName="ventas.pdf">
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
