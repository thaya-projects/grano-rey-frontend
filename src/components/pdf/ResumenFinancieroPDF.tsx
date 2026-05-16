'use client';
import { Document, Page, View, Text, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

const GREEN  = '#3C5A44';
const GOLD   = '#C49A1A';
const MUTED  = '#8AA08A';
const BORDER = '#D8E2D9';
const BG     = '#EBF2EC';

const s = StyleSheet.create({
  page:    { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D2B1F', backgroundColor: '#fff' },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  co:      { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN },
  sub:     { fontSize: 9, color: MUTED, marginTop: 2 },
  h1:      { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 12 },
  kpiRow:  { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiBox:  { flex: 1, padding: 12, backgroundColor: BG, borderRadius: 6 },
  kpiLbl:  { fontSize: 8, color: MUTED, textTransform: 'uppercase', marginBottom: 4 },
  kpiVal:  { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  tHead:   { flexDirection: 'row', backgroundColor: GREEN, padding: '6 10', borderRadius: 4, marginBottom: 2 },
  tHcell:  { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tRow:    { flexDirection: 'row', padding: '6 10', borderBottomWidth: 1, borderBottomColor: BORDER },
  tCell:   { fontSize: 9, color: '#1D2B1F' },
  footer:  { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  ftext:   { fontSize: 8, color: MUTED },
});

type CatGasto = { label: string; monto: number; pct: number; esAutomatico: boolean };
type Semanal  = { sem: string; ingresos: number; egresos: number };
type Resumen  = { ingresosBs: number; egresosBs: number; utilidadBs: number; margenPct: number };

function fBs(n: number) { return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`; }

function DocComp({ data }: { data: { resumen: Resumen; gastosCat: CatGasto[]; semanales: Semanal[]; periodo: string } }) {
  const { resumen, gastosCat, semanales, periodo } = data;
  const label = periodo === 'mes_actual' ? 'Mayo 2026' : 'Abril 2026';
  const now = new Date().toLocaleDateString('es-BO');
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.co}>GRANO REY</Text>
            <Text style={s.sub}>Resumen Financiero · {label}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.sub, { fontSize: 8 }]}>Generado el {now}</Text>
            <Text style={[s.sub, { fontSize: 8 }]}>Grano Rey SRL</Text>
          </View>
        </View>

        {/* KPIs */}
        <Text style={s.h1}>Resumen del período</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiBox}>
            <Text style={s.kpiLbl}>Ingresos</Text>
            <Text style={[s.kpiVal, { color: '#2E7D52' }]}>{fBs(resumen.ingresosBs)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLbl}>Egresos</Text>
            <Text style={[s.kpiVal, { color: '#B53D35' }]}>{fBs(resumen.egresosBs)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLbl}>Utilidad neta</Text>
            <Text style={[s.kpiVal, { color: resumen.utilidadBs >= 0 ? '#2E7D52' : '#B53D35' }]}>{fBs(resumen.utilidadBs)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLbl}>Margen</Text>
            <Text style={[s.kpiVal, { color: GREEN }]}>{resumen.margenPct.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Gastos table */}
        <Text style={[s.h1, { marginTop: 8 }]}>Egresos por categoría</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { flex: 1 }]}>Categoría</Text>
          <Text style={[s.tHcell, { width: 80, textAlign: 'right' }]}>Monto</Text>
          <Text style={[s.tHcell, { width: 50, textAlign: 'right' }]}>%</Text>
        </View>
        {gastosCat.map((c, i) => (
          <View key={i} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
            <Text style={[s.tCell, { flex: 1 }]}>{c.label}{c.esAutomatico ? ' ⚡' : ''}</Text>
            <Text style={[s.tCell, { width: 80, textAlign: 'right' }]}>{fBs(c.monto)}</Text>
            <Text style={[s.tCell, { width: 50, textAlign: 'right', color: MUTED }]}>{c.pct.toFixed(1)}%</Text>
          </View>
        ))}

        {/* Weekly table */}
        <Text style={[s.h1, { marginTop: 20 }]}>Ingresos vs Egresos por semana</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { width: 60 }]}>Semana</Text>
          <Text style={[s.tHcell, { flex: 1, textAlign: 'right' }]}>Ingresos</Text>
          <Text style={[s.tHcell, { flex: 1, textAlign: 'right' }]}>Egresos</Text>
          <Text style={[s.tHcell, { flex: 1, textAlign: 'right' }]}>Balance</Text>
        </View>
        {semanales.map((w, i) => (
          <View key={i} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
            <Text style={[s.tCell, { width: 60 }]}>{w.sem}</Text>
            <Text style={[s.tCell, { flex: 1, textAlign: 'right', color: '#2E7D52' }]}>{fBs(w.ingresos)}</Text>
            <Text style={[s.tCell, { flex: 1, textAlign: 'right', color: '#B53D35' }]}>{fBs(w.egresos)}</Text>
            <Text style={[s.tCell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fBs(w.ingresos - w.egresos)}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.ftext}>Grano Rey SRL · Reporte interno</Text>
          <Text style={s.ftext}>{now} · Resumen Financiero {label}</Text>
        </View>
      </Page>
    </Document>
  );
}

type Props = { data: { resumen: Resumen; gastosCat: CatGasto[]; semanales: Semanal[]; periodo: string } };

export function ResumenFinancieroPDFLink({ data }: Props) {
  return (
    <PDFDownloadLink document={<DocComp data={data} />} fileName={`resumen-financiero-${data.periodo}.pdf`}>
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
