'use client';
import type { ReactNode } from 'react';
import { usePagination, Pagination } from './index';

export interface TableColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  /** Ancho fijo de la columna (ej. '12%' o '120px'). Sin esto, `table-layout: auto`
   *  puede repartir el espacio sobrante de forma pareja pero poco predecible,
   *  dejando huecos en blanco en vez de llenar el ancho del contenedor. */
  width?: string;
}

/**
 * Tabla genérica con paginación incorporada: header + filas + paginador,
 * dentro del wrapper `card-no-pad` + `overflow-x-auto` que ya usan las
 * tablas de Configuración (clientes, productos, etc.) — en pantallas
 * chicas hace scroll horizontal en vez de cambiar de layout.
 */
export function DataTable<T>({
  data, columns, keyFn, onRowClick, emptyMessage = 'Sin resultados', minWidth = 680,
}: {
  data: T[];
  columns: TableColumn<T>[];
  keyFn: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  minWidth?: number;
}) {
  const { page, setPage, totalPages, pageItems, pageSize, setPageSize, total } = usePagination(data);

  if (data.length === 0) {
    return <div className="card-no-pad py-16 text-center text-gr-muted">{emptyMessage}</div>;
  }

  return (
    <div className="card-no-pad">
      <div className="overflow-x-auto">
        <table className="text-[13px]" style={{ minWidth: '100%', width: minWidth, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {columns.map((c, i) => (
                <th key={i} style={{ width: c.width }}
                  className={`px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => (
              <tr key={keyFn(item)}
                className={`border-b border-gr-border-lite ${onRowClick ? 'cursor-pointer hover:bg-gr-primary-lite transition-colors' : ''}`}
                style={{ background: i % 2 === 1 ? 'var(--color-gr-border-lite)' : '#fff' }}
                onClick={() => onRowClick?.(item)}>
                {columns.map((c, j) => (
                  <td key={j} className={`px-4 py-3 overflow-hidden text-ellipsis ${c.align === 'right' ? 'text-right' : ''} ${c.className ?? ''}`}>
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} total={total} />
    </div>
  );
}
