'use client';
import { Document, Page, View, Text, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import type { Producto, MateriaPrimaStock } from '@/lib/mock';
import { KG_POR_QQ, equivPT, equivLabel } from '@/lib/utils';

const GREEN  = '#3C5A44';
const MUTED  = '#8AA08A';
const BORDER = '#D8E2D9';

const s = StyleSheet.create({
  page:   { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1D2B1F', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  co:     { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN },
  sub:    { fontSize: 9, color: MUTED, marginTop: 2 },
  h1:     { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 8, marginTop: 16 },
  tHead:  { flexDirection: 'row', backgroundColor: GREEN, padding: '6 10', borderRadius: 4, marginBottom: 2 },
  tHcell: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tRow:   { flexDirection: 'row', padding: '6 10', borderBottomWidth: 1, borderBottomColor: BORDER },
  tCell:  { fontSize: 9, color: '#1D2B1F' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  ftext:  { fontSize: 8, color: MUTED },
});

function fBs(n: number) { return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`; }
function fEquiv(n: number, label: string) { return `${n.toFixed(2)} ${label}`; }

function DocComp({ data }: { data: { productos: Producto[]; materiaPrima: MateriaPrimaStock[] } }) {
  const { productos, materiaPrima } = data;
  const now = new Date().toLocaleDateString('es-BO');
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.co}>GRANO REY</Text>
            <Text style={s.sub}>Stock Actual · {now}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.sub, { fontSize: 8 }]}>Generado el {now}</Text>
            <Text style={[s.sub, { fontSize: 8 }]}>Grano Rey SRL</Text>
          </View>
        </View>

        {/* Productos */}
        <Text style={s.h1}>Productos Terminados</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { width: 60 }]}>Código</Text>
          <Text style={[s.tHcell, { flex: 1 }]}>Producto</Text>
          <Text style={[s.tHcell, { width: 60, textAlign: 'right' }]}>Stock</Text>
          <Text style={[s.tHcell, { width: 55, textAlign: 'right' }]}>Equiv.</Text>
          <Text style={[s.tHcell, { width: 70, textAlign: 'right' }]}>Precio/u</Text>
          <Text style={[s.tHcell, { width: 50 }]}>Estado</Text>
        </View>
        {productos.map((p, i) => {
          const equiv = equivPT(p.stockActual, p.factorABase, p.tipo);
          const qlbl  = equivLabel(p.tipo) || 'u';
          const low = p.stockActual < p.stockMinimo;
          const warn = !low && p.stockActual < p.stockMinimo * 2;
          const estado = low ? 'Bajo' : warn ? 'Alerta' : 'OK';
          const estadoColor = low ? '#B53D35' : warn ? '#A05C0A' : '#2E7D52';
          return (
            <View key={p.id} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
              <Text style={[s.tCell, { width: 60, color: MUTED }]}>{p.codigo}</Text>
              <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{p.nombre}</Text>
              <Text style={[s.tCell, { width: 60, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: GREEN }]}>{p.stockActual.toLocaleString()}</Text>
              <Text style={[s.tCell, { width: 55, textAlign: 'right' }]}>{fEquiv(equiv, qlbl)}</Text>
              <Text style={[s.tCell, { width: 70, textAlign: 'right', color: MUTED }]}>{fBs(p.precioUnitarioBs)}</Text>
              <Text style={[s.tCell, { width: 50, color: estadoColor, fontFamily: 'Helvetica-Bold' }]}>{estado}</Text>
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', padding: '8 10', backgroundColor: '#EBF2EC', borderRadius: 4, marginTop: 4 }}>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>{productos.length} productos</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>
            {productos.reduce((s, p) => s + p.stockActual, 0).toLocaleString()} unidades totales
          </Text>
        </View>

        {/* Materia Prima */}
        <Text style={s.h1}>Materia Prima</Text>
        <View style={s.tHead}>
          <Text style={[s.tHcell, { flex: 1 }]}>Materia Prima</Text>
          <Text style={[s.tHcell, { width: 55, textAlign: 'right' }]}>QQ Entero</Text>
          <Text style={[s.tHcell, { width: 55, textAlign: 'right' }]}>QQ P.Chico</Text>
          <Text style={[s.tHcell, { width: 60, textAlign: 'right' }]}>QQ P.Grande</Text>
          <Text style={[s.tHcell, { width: 55, textAlign: 'right' }]}>Total QQ</Text>
          <Text style={[s.tHcell, { width: 50 }]}>Estado</Text>
        </View>
        {materiaPrima.map((mp, i) => {
          const low = mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo;
          const warn = !low && mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo * 2;
          const has = mp.stockEntero !== undefined;
          const estado = low ? 'Bajo' : warn ? 'Alerta' : 'OK';
          const estadoColor = low ? '#B53D35' : warn ? '#A05C0A' : '#2E7D52';
          return (
            <View key={mp.id} style={[s.tRow, i % 2 === 0 ? {} : { backgroundColor: '#F5F7F4' }]}>
              <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{mp.nombre}</Text>
              <Text style={[s.tCell, { width: 55, textAlign: 'right', color: MUTED }]}>{has ? fEquiv(mp.stockEntero || 0, 'QQ') : '—'}</Text>
              <Text style={[s.tCell, { width: 55, textAlign: 'right', color: MUTED }]}>{has ? fEquiv(mp.stockParChico || 0, 'QQ') : '—'}</Text>
              <Text style={[s.tCell, { width: 60, textAlign: 'right', color: MUTED }]}>{has ? fEquiv(mp.stockParGrande || 0, 'QQ') : '—'}</Text>
              <Text style={[s.tCell, { width: 55, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: GREEN }]}>{fEquiv(mp.stockTotal, 'QQ')}</Text>
              <Text style={[s.tCell, { width: 50, color: estadoColor, fontFamily: 'Helvetica-Bold' }]}>{estado}</Text>
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', padding: '8 10', backgroundColor: '#EBF2EC', borderRadius: 4, marginTop: 4 }}>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>{materiaPrima.length} materias primas</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: GREEN }}>
            {fEquiv(materiaPrima.reduce((s, m) => s + m.stockTotal, 0), 'QQ')} totales
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.ftext}>Grano Rey SRL · Reporte interno</Text>
          <Text style={s.ftext}>{now} · Stock Actual</Text>
        </View>
      </Page>
    </Document>
  );
}

type Props = { data: { productos: Producto[]; materiaPrima: MateriaPrimaStock[] } };

export function StockActualPDFLink({ data }: Props) {
  return (
    <PDFDownloadLink document={<DocComp data={data} />} fileName="stock-actual.pdf">
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
