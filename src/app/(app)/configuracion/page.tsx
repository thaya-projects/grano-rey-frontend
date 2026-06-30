'use client';
import { useState } from 'react';
import { Building2, Package, Wheat, Users, Truck, Tag, HardHat } from 'lucide-react';
import { TabEmpresa }        from './_components/TabEmpresa';
import { TabProductos }      from './_components/TabProductos';
import { TabMateriaPrima }   from './_components/TabMateriaPrima';
import { TabClientes }       from './_components/TabClientes';
import { TabTransportistas } from './_components/TabTransportistas';
import { TabProveedores }    from './_components/TabProveedores';
import { TabCargadores }     from './_components/TabCargadores';

type Tab = 'empresa' | 'productos' | 'mp' | 'clientes' | 'transportistas' | 'proveedores' | 'cargadores';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'empresa',        label: 'Empresa',        icon: <Building2 size={15} /> },
  { id: 'productos',      label: 'Productos',      icon: <Package size={15} /> },
  { id: 'mp',             label: 'Materia Prima',  icon: <Wheat size={15} /> },
  { id: 'clientes',       label: 'Clientes',       icon: <Users size={15} /> },
  { id: 'transportistas', label: 'Transportistas', icon: <Truck size={15} /> },
  { id: 'proveedores',    label: 'Proveedores',    icon: <Tag size={15} /> },
  { id: 'cargadores',     label: 'Cargadores',     icon: <HardHat size={15} /> },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('empresa');

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Configuración</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          Datos de la empresa y catálogos maestros
        </p>
      </div>

      {/* Mobile: grid 3 cols con píldora · sm+: flex-wrap con underline, baja si no cabe */}
      <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:gap-0 sm:border-b-2 sm:border-gr-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-md border-b-2 font-700 text-[11px] leading-tight text-center transition-colors
              sm:flex-row sm:gap-2 sm:px-5 sm:py-3 sm:rounded-none sm:text-[13.5px] sm:leading-normal sm:-mb-0.5 sm:whitespace-nowrap
              ${tab === t.id
                ? 'bg-gr-primary-lite text-gr-primary border-gr-primary sm:bg-transparent sm:border-gr-primary'
                : 'text-gr-muted hover:text-gr-text border-transparent sm:border-transparent'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'empresa'        && <TabEmpresa />}
      {tab === 'productos'      && <TabProductos />}
      {tab === 'mp'             && <TabMateriaPrima />}
      {tab === 'clientes'       && <TabClientes />}
      {tab === 'transportistas' && <TabTransportistas />}
      {tab === 'proveedores'    && <TabProveedores />}
      {tab === 'cargadores'     && <TabCargadores />}
    </div>
  );
}
