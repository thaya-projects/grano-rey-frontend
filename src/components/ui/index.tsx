'use client';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Check, AlertTriangle, Info, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'green';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean;
}
const btnBase = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';
const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-gr-primary text-white hover:bg-gr-primary-mid',
  secondary: 'bg-gr-border text-gr-text hover:bg-gr-border-lite',
  ghost:     'bg-transparent text-gr-primary hover:bg-gr-primary-lite',
  danger:    'bg-gr-danger-bg text-gr-danger hover:bg-red-100',
  gold:      'bg-gr-gold text-[#1a0e00] hover:bg-gr-gold-dark',
  green:     'bg-gr-primary text-white hover:bg-gr-primary-mid',
};
const btnSizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-[14px]', lg: 'h-12 px-6 text-[15px]',
};
export function Btn({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { error?: boolean; }
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...rest }, ref) => (
  <input ref={ref}
    className={cn('w-full h-10 px-3 rounded-[10px] border bg-white text-gr-text text-[14px] transition-all duration-150',
      'placeholder:text-gr-muted outline-none',
      error ? 'border-gr-danger focus:ring-2 focus:ring-gr-danger/20'
             : 'border-gr-border focus:border-gr-primary focus:ring-2 focus:ring-gr-primary/15',
      className)} {...rest} />
));
Input.displayName = 'Input';

// ─── Phone input ──────────────────────────────────────────────────────────────
const PAISES_TEL = [
  { code: '+591', label: 'BO +591' },
  { code: '+54',  label: 'AR +54'  },
  { code: '+55',  label: 'BR +55'  },
  { code: '+56',  label: 'CL +56'  },
  { code: '+57',  label: 'CO +57'  },
  { code: '+593', label: 'EC +593' },
  { code: '+595', label: 'PY +595' },
  { code: '+51',  label: 'PE +51'  },
  { code: '+598', label: 'UY +598' },
  { code: '+34',  label: 'ES +34'  },
  { code: '+1',   label: 'US +1'   },
];

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  if (PAISES_TEL.some(p => raw.startsWith(p.code + ' '))) return raw;
  return '+591 ' + raw;
}

function parsePhone(v: string) {
  const p = PAISES_TEL.find(p => v.startsWith(p.code + ' '));
  if (p) return { code: p.code, number: v.slice(p.code.length + 1) };
  return { code: '+591', number: v };
}

interface PhoneInputProps { value?: string; onChange?: (v: string) => void; disabled?: boolean; }
export function PhoneInput({ value = '', onChange, disabled }: PhoneInputProps) {
  const { code: parsedCode, number } = parsePhone(value);
  const [localCode, setLocalCode] = useState(parsedCode);

  // Si el padre carga un valor con prefijo diferente, sincronizar
  useEffect(() => {
    if (value && parsedCode !== localCode) setLocalCode(parsedCode);
  }, [value]);

  function emit(newCode: string, newNumber: string) {
    onChange?.(newNumber ? `${newCode} ${newNumber}` : '');
  }
  return (
    <div className={cn(
      'flex h-10 rounded-[10px] border bg-white overflow-hidden transition-all duration-150',
      'focus-within:border-gr-primary focus-within:ring-2 focus-within:ring-gr-primary/15',
      'border-gr-border',
    )}>
      <select
        value={localCode}
        onChange={e => { setLocalCode(e.target.value); emit(e.target.value, number); }}
        disabled={disabled}
        className="h-full bg-gr-border-lite border-r border-gr-border px-2 text-[13px] font-semibold text-gr-sub outline-none cursor-pointer shrink-0 disabled:opacity-50">
        {PAISES_TEL.map(p => (
          <option key={p.code} value={p.code}>{p.label}</option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={e => emit(localCode, e.target.value)}
        disabled={disabled}
        placeholder="76012345"
        className="flex-1 min-w-0 px-3 text-[14px] text-gr-text placeholder:text-gr-muted outline-none bg-transparent disabled:opacity-50" />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { error?: boolean; }
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...rest }, ref) => (
  <select ref={ref}
    className={cn('w-full h-10 px-3 rounded-[10px] border bg-white text-gr-text text-[14px] transition-all duration-150 cursor-pointer',
      'outline-none',
      error ? 'border-gr-danger focus:ring-2 focus:ring-gr-danger/20'
             : 'border-gr-border focus:border-gr-primary focus:ring-2 focus:ring-gr-primary/15',
      className)} {...rest}>{children}</select>
));
Select.displayName = 'Select';

// ─── Label / FormField ────────────────────────────────────────────────────────
export function Label({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('block text-[12.5px] font-semibold text-gr-sub mb-1.5', className)}>
      {children}{required && <span className="text-gr-danger ml-0.5">*</span>}
    </label>
  );
}
export function FormField({ label, required, error, children, className, hint }: { label?: string; required?: boolean; error?: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {label && (
        <Label required={required}>{label}</Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11.5px] text-gr-muted mt-1 leading-tight">{hint}</p>
      )}
      {error && <p className="text-[12px] text-gr-danger mt-1">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; noPad?: boolean; onClick?: () => void; }
export function Card({ children, className, noPad, onClick }: CardProps) {
  return (
    <div onClick={onClick}
      className={cn('bg-gr-surface border border-gr-border rounded-[14px]',
        noPad ? 'overflow-hidden' : 'p-5', onClick && 'cursor-pointer hover:border-gr-primary transition-colors', className)}>
      {children}
    </div>
  );
}

// ─── Kpi card ─────────────────────────────────────────────────────────────────
const kpiColors: Record<string, string> = {
  success: 'var(--color-gr-success)',
  danger:  'var(--color-gr-danger)',
  warning: 'var(--color-gr-warning)',
  primary: 'var(--color-gr-primary)',
};
export function KpiCard({ label, value, color }: { label: string; value: string; color?: 'success' | 'danger' | 'warning' | 'primary' }) {
  return (
    <div className="card text-center">
      <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[26px] font-900 leading-tight" style={{ color: color ? kpiColors[color] : 'var(--color-gr-text)' }}>{value}</p>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'gold';
const badgeColors: Record<BadgeColor, string> = {
  green:  'bg-gr-success-bg text-gr-success border-gr-success/20',
  yellow: 'bg-gr-warning-bg text-gr-warning border-gr-warning/20',
  red:    'bg-gr-danger-bg  text-gr-danger  border-gr-danger/20',
  blue:   'bg-gr-info-bg    text-gr-info    border-gr-info/20',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  gold:   'bg-gr-gold-lite text-gr-gold-dark border-gr-gold/30',
};
export function Badge({ color, children, className }: { color: BadgeColor; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-700 border', badgeColors[color], className)}>
      {children}
    </span>
  );
}

// ─── Estado badge ─────────────────────────────────────────────────────────────
const estadoMap: Record<string, { color: BadgeColor; label: string }> = {
  pendiente:  { color: 'yellow', label: 'Pendiente' },
  despachado: { color: 'blue',   label: 'Despachado' },
  despachada: { color: 'blue',   label: 'Despachada' },
  entregado:  { color: 'green',  label: 'Entregado' },
  entregada:  { color: 'green',  label: 'Entregada' },
  cancelado:  { color: 'red',    label: 'Cancelado' },
  cancelada:  { color: 'red',    label: 'Cancelada' },
};
export function EstadoBadge({ estado }: { estado: string }) {
  const m = estadoMap[estado] || { color: 'gray', label: estado };
  return <Badge color={m.color}>{m.label}</Badge>;
}

// ─── Stock progress bar ───────────────────────────────────────────────────────
export function StockBar({ value, min, className }: { value: number; min: number; className?: string }) {
  const pct = min > 0 ? Math.min(100, (value / (min * 3)) * 100) : Math.min(100, value > 0 ? 60 : 5);
  const color = pct < 20 ? 'bg-gr-danger' : pct < 45 ? 'bg-gr-warning' : 'bg-gr-success';
  const label = pct < 20 ? 'Crítico' : pct < 45 ? 'Bajo' : pct < 70 ? 'Normal' : 'Suficiente';
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-[11px] font-semibold">
        <span style={{ color: pct < 20 ? 'var(--color-gr-danger)' : pct < 45 ? 'var(--color-gr-warning)' : 'var(--color-gr-success)' }}>{label}</span>
        <span className="text-gr-muted">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-gr-border rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; xl?: boolean; className?: string; }
export function Modal({ open, onClose, title, children, footer, wide, xl, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div onClick={e => e.stopPropagation()}
        className={cn('relative bg-white rounded-[16px] shadow-2xl w-full max-h-[90vh] flex flex-col animate-fade-up',
          xl ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-lg', className)}>
        {/* Header fijo */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gr-border">
          <h2 className="text-[16px] font-800 text-gr-text">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gr-border transition-colors">
            <X size={16} className="text-gr-muted" />
          </button>
        </div>
        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
        {/* Footer fijo */}
        {footer && (
          <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-gr-border bg-white rounded-b-[16px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: string; message: string; type: ToastType; }
interface ToastState { toasts: ToastItem[]; show: (msg: string, type?: ToastType) => void; }
import { create } from 'zustand';
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
}));
const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />, error: <X size={16} />,
  warning: <AlertTriangle size={16} />, info: <Info size={16} />,
};
const toastColors: Record<ToastType, string> = {
  success: 'bg-gr-primary text-white',
  error:   'bg-gr-danger text-white',
  warning: 'bg-gr-warning text-white',
  info:    'bg-gr-info text-white',
};
export function ToastContainer() {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn('flex items-center gap-2.5 px-4 py-3 rounded-[12px] shadow-lg text-[13.5px] font-semibold min-w-[240px] animate-slide-in pointer-events-auto', toastColors[t.type])}>
          {toastIcons[t.type]}{t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message?: string; danger?: boolean; }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>Confirmar</Btn>
      </>}>
      {message && <p className="text-[14px] text-gr-sub">{message}</p>}
    </Modal>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderColor: `${color || 'currentColor'}40`, borderTopColor: color || 'currentColor' }} className="rounded-full border-2 animate-spin-slow" />;
}
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner size={32} color="var(--color-gr-primary)" />
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...rest }, ref) => (
  <textarea ref={ref}
    className={cn('w-full px-3 py-2.5 rounded-[10px] border border-gr-border bg-white text-gr-text text-[14px] resize-none',
      'placeholder:text-gr-muted outline-none focus:border-gr-primary focus:ring-2 focus:ring-gr-primary/15 transition-all',
      className)} rows={3} {...rest} />
));
Textarea.displayName = 'Textarea';

// ─── Search box ───────────────────────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gr-muted" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar...'}
        className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-gr-border bg-white text-[14px] outline-none focus:border-gr-primary focus:ring-2 focus:ring-gr-primary/15 transition-all" />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const done = i < current; const active = i === current;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className={cn('flex-1 h-0.5 mx-1', done ? 'bg-gr-primary' : 'bg-gr-border')} />}
            <div className="flex flex-col items-center gap-1">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all',
                done   ? 'bg-gr-primary border-gr-primary text-white' :
                active ? 'bg-white border-gr-primary text-gr-primary' :
                         'bg-white border-gr-border text-gr-muted')}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn('text-[11px] font-semibold whitespace-nowrap', active ? 'text-gr-primary' : done ? 'text-gr-sub' : 'text-gr-muted')}>{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-gr-muted mb-2">{icon}</div>}
      <p className="font-700 text-gr-sub text-[15px]">{title}</p>
      {description && <p className="text-gr-muted text-[13px] max-w-xs">{description}</p>}
    </div>
  );
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────
/**
 * Tooltip minimalista sin JS — solo CSS con :hover en un wrapper `group`.
 * Aparece con fade suave, con flecha, arriba del elemento hijo.
 * Uso: <Tooltip label="Ver detalle"><button>...</button></Tooltip>
 */
type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export function Tooltip({
  label, children, side = 'top', className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
}) {
  const posClass =
    side === 'top'    ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2' :
    side === 'bottom' ? 'top-full mt-1.5 left-1/2 -translate-x-1/2' :
    side === 'left'   ? 'right-full mr-1.5 top-1/2 -translate-y-1/2' :
                        'left-full  ml-1.5 top-1/2 -translate-y-1/2';
  return (
    <span className={cn('relative inline-flex group', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap',
          'rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-600 text-white',
          'shadow-lg',
          'opacity-0 scale-95 translate-y-0.5',
          'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0',
          'transition-all duration-150 ease-out delay-100',
          posClass,
        )}
        style={{ background: 'var(--color-gr-text)' }}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Botón cuadrado icon-only con tooltip incorporado — el patrón más frecuente
 * en tablas de acciones.
 */
type IconBtnVariant = 'ghost' | 'primary' | 'gold' | 'danger';
const iconBtnStyles: Record<IconBtnVariant, string> = {
  ghost:   'border-gr-border text-gr-muted hover:bg-gr-border-lite hover:text-gr-text',
  primary: 'border-gr-primary bg-gr-primary-lite text-gr-primary hover:bg-gr-primary hover:text-white',
  gold:    'border-gr-gold bg-gr-gold-lite text-gr-gold-dark hover:bg-gr-gold hover:text-white',
  danger:  'border-gr-danger text-gr-danger hover:bg-gr-danger hover:text-white',
};
export function IconBtn({
  tooltip, variant = 'ghost', onClick, disabled, children, tooltipSide = 'top',
}: {
  tooltip: string;
  variant?: IconBtnVariant;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tooltipSide?: TooltipSide;
}) {
  return (
    <Tooltip label={tooltip} side={tooltipSide}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
        className={cn(
          'w-9 h-9 rounded-[10px] border-2 flex items-center justify-center transition-all',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          iconBtnStyles[variant],
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

// ─── Paginación ─────────────────────────────────────────────────────────────
export const PAGE_SIZES = [10, 20, 50, 100] as const;

/** Recorta `items` a la página actual. La página se ajusta sola si la lista se achica (ej. al filtrar). */
export function usePagination<T>(items: T[], initialPageSize: number = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page_ = Math.min(page, totalPages);
  const pageItems = items.slice((page_ - 1) * pageSize, page_ * pageSize);
  function setPageSize(size: number) {
    setPageSizeState(size);
    setPage(1);
  }
  return { page: page_, setPage, totalPages, pageItems, pageSize, setPageSize, total: items.length };
}

/** Números de página a mostrar, con '…' cuando hay demasiadas para listarlas todas. */
function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const nums: (number | '…')[] = [1];
  if (current > 3) nums.push('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) nums.push(p);
  if (current < total - 2) nums.push('…');
  nums.push(total);
  return nums;
}

export function Pagination({ page, totalPages, onChange, pageSize, onPageSizeChange, total, className }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-3 items-center gap-3 px-5 py-3 border-t border-gr-border-lite',
      className,
    )}>
      <span className="text-[12px] text-gr-muted whitespace-nowrap justify-self-center sm:justify-self-start">
        {from}–{to} de {total}
      </span>

      <div className="flex items-center gap-1 justify-self-center">
        <IconBtn tooltip="Primera página" onClick={() => onChange(1)} disabled={page <= 1}>
          <ChevronsLeft size={15} />
        </IconBtn>
        <IconBtn tooltip="Anterior" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={15} />
        </IconBtn>
        {pageNumbers(page, totalPages).map((n, i) => n === '…' ? (
          <span key={`e${i}`} className="w-7 text-center text-[12px] text-gr-muted select-none">…</span>
        ) : (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn(
              'w-8 h-8 rounded-[8px] border text-[12.5px] font-700 transition-all',
              n === page
                ? 'bg-gr-primary border-gr-primary text-white'
                : 'bg-white border-gr-border text-gr-muted hover:bg-gr-border-lite hover:text-gr-text',
            )}>
            {n}
          </button>
        ))}
        <IconBtn tooltip="Siguiente" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight size={15} />
        </IconBtn>
        <IconBtn tooltip="Última página" onClick={() => onChange(totalPages)} disabled={page >= totalPages}>
          <ChevronsRight size={15} />
        </IconBtn>
      </div>

      <div className="flex items-center gap-2 justify-self-center sm:justify-self-end">
        <span className="text-[12px] text-gr-muted whitespace-nowrap">Ver por página</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="h-7 px-2 rounded-[6px] border border-gr-border text-[12px] text-gr-text bg-white cursor-pointer"
        >
          {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Combobox (select con búsqueda) ────────────────────────────────────────
export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

/**
 * Reemplazo de `<Select>` para listas largas: se puede escribir para filtrar
 * en vez de scrollear un `<select>` nativo. Muestra la opción elegida cuando
 * está cerrado; al hacer foco/escribir se abre la lista filtrada.
 */
export function Combobox({ value, onChange, options, placeholder, emptyLabel = '— Sin seleccionar —', disabled }: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(o =>
        o.label.toLowerCase().includes(q) || (o.sublabel ?? '').toLowerCase().includes(q))
    : options;

  return (
    <div className="relative" ref={ref}>
      <input
        value={open ? query : (selected?.label ?? '')}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); setQuery(''); }}
        disabled={disabled}
        placeholder={placeholder ?? 'Escribí para buscar...'}
        className="w-full h-10 pl-3 pr-9 rounded-[10px] border border-gr-border bg-white text-[14px] text-gr-text outline-none focus:border-gr-primary focus:ring-2 focus:ring-gr-primary/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-text"
      />
      <ChevronDown size={15}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gr-muted pointer-events-none" />
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-[10px] border border-gr-border bg-white shadow-lg py-1">
          {value && (
            <button type="button" onClick={() => { onChange(''); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12.5px] text-gr-muted hover:bg-gr-border-lite transition-colors">
              {emptyLabel}
            </button>
          )}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-[13px] text-gr-muted text-center">Sin resultados</p>
          )}
          {filtered.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setQuery(''); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-[13.5px] transition-colors',
                o.value === value
                  ? 'bg-gr-primary-lite font-700 text-gr-primary'
                  : 'text-gr-text hover:bg-gr-border-lite',
              )}>
              {o.label}
              {o.sublabel && <span className="block text-[11.5px] font-400 text-gr-muted">{o.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
