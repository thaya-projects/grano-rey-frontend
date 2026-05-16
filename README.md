# Grano Rey — Sistema de Inventarios

Stack: **Next.js 16.2.4** · **React 19** · **TypeScript** · **Tailwind CSS v4** · sin dependencias de UI externas.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura de componentes

```
src/
├── app/              # Next.js App Router
├── lib/
│   ├── types.ts      # Todos los tipos TypeScript
│   └── data.ts       # Datos iniciales / mock
└── components/
    ├── Icons.tsx         # Librería SVG de íconos
    ├── UI.tsx            # Primitivos reutilizables:
    │                     #   PageHeader, Btn, Card, Badge
    │                     #   ProgressBar, StatCard, FilterChips
    │                     #   SearchBox, AlertBanner, Table
    │                     #   Modal, ConfirmModal, FormField
    │                     #   Input, Select, SearchSelect
    │                     #   ToggleButtons, InlineInfoBanner
    │                     #   Toast, SectionHeader
    ├── Sidebar.tsx        # Navegación lateral colapsible
    ├── AppShell.tsx       # Shell principal + estado global
    ├── Dashboard.tsx      # Vista de inicio con KPIs y gráfica
    ├── StockProductos.tsx # Kardex de productos terminados
    ├── MateriaPrima.tsx   # Kardex de materias primas
    ├── Ventas.tsx         # Notas de venta + PDF preview
    ├── Remisiones.tsx     # Remisiones de entrega
    └── Clientes.tsx       # Clientes + Transportistas (CRUD genérico)
```

## Principios de diseño del código

- **Componente genérico**: `ListaEditable<T>` en `Clientes.tsx` sirve tanto para Clientes como Transportistas
- **Primitivos reutilizables**: si algo se repite 2+ veces, está en `UI.tsx`
- **Sin librerías de UI**: todos los componentes son custom, sin dependencias extras
- **Estado en AppShell**: toda la data vive arriba y se pasa por props
