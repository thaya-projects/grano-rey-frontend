'use client';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'green';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean;
}
const btnBase = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';
const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-[var(--color-gr-primary)] text-white hover:bg-[var(--color-gr-primary-mid)]',
  secondary: 'bg-[var(--color-gr-border)] text-[var(--color-gr-text)] hover:bg-[var(--color-gr-border-lite)]',
  ghost:     'bg-transparent text-[var(--color-gr-primary)] hover:bg-[var(--color-gr-primary-lite)]',
  danger:    'bg-[var(--color-gr-danger-bg)] text-[var(--color-gr-danger)] hover:bg-red-100',
  gold:      'bg-[var(--color-gr-gold)] text-[#1a0e00] hover:bg-[var(--color-gr-gold-dark)]',
  green:     'bg-[var(--color-gr-primary)] text-white hover:bg-[var(--color-gr-primary-mid)]',
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
    className={cn('w-full h-10 px-3 rounded-[10px] border bg-white text-[var(--color-gr-text)] text-[14px] transition-all duration-150',
      'placeholder:text-[var(--color-gr-muted)] outline-none',
      error ? 'border-[var(--color-gr-danger)] focus:ring-2 focus:ring-[var(--color-gr-danger)]/20'
             : 'border-[var(--color-gr-border)] focus:border-[var(--color-gr-primary)] focus:ring-2 focus:ring-[var(--color-gr-primary)]/15',
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
      'focus-within:border-[var(--color-gr-primary)] focus-within:ring-2 focus-within:ring-[var(--color-gr-primary)]/15',
      'border-[var(--color-gr-border)]',
    )}>
      <select
        value={localCode}
        onChange={e => { setLocalCode(e.target.value); emit(e.target.value, number); }}
        disabled={disabled}
        className="h-full bg-[var(--color-gr-border-lite)] border-r border-[var(--color-gr-border)] px-2 text-[13px] font-semibold text-[var(--color-gr-sub)] outline-none cursor-pointer shrink-0 disabled:opacity-50">
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
        className="flex-1 min-w-0 px-3 text-[14px] text-[var(--color-gr-text)] placeholder:text-[var(--color-gr-muted)] outline-none bg-transparent disabled:opacity-50" />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { error?: boolean; }
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...rest }, ref) => (
  <select ref={ref}
    className={cn('w-full h-10 px-3 rounded-[10px] border bg-white text-[var(--color-gr-text)] text-[14px] transition-all duration-150 cursor-pointer',
      'outline-none',
      error ? 'border-[var(--color-gr-danger)] focus:ring-2 focus:ring-[var(--color-gr-danger)]/20'
             : 'border-[var(--color-gr-border)] focus:border-[var(--color-gr-primary)] focus:ring-2 focus:ring-[var(--color-gr-primary)]/15',
      className)} {...rest}>{children}</select>
));
Select.displayName = 'Select';

// ─── Label / FormField ────────────────────────────────────────────────────────
export function Label({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('block text-[12.5px] font-semibold text-[var(--color-gr-sub)] mb-1.5', className)}>
      {children}{required && <span className="text-[var(--color-gr-danger)] ml-0.5">*</span>}
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
        <p className="text-[11.5px] text-[var(--color-gr-muted)] mt-1 leading-tight">{hint}</p>
      )}
      {error && <p className="text-[12px] text-[var(--color-gr-danger)] mt-1">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; noPad?: boolean; onClick?: () => void; }
export function Card({ children, className, noPad, onClick }: CardProps) {
  return (
    <div onClick={onClick}
      className={cn('bg-[var(--color-gr-surface)] border border-[var(--color-gr-border)] rounded-[14px]',
        noPad ? 'overflow-hidden' : 'p-5', onClick && 'cursor-pointer hover:border-[var(--color-gr-primary)] transition-colors', className)}>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'gold';
const badgeColors: Record<BadgeColor, string> = {
  green:  'bg-[var(--color-gr-success-bg)] text-[var(--color-gr-success)] border-[var(--color-gr-success)]/20',
  yellow: 'bg-[var(--color-gr-warning-bg)] text-[var(--color-gr-warning)] border-[var(--color-gr-warning)]/20',
  red:    'bg-[var(--color-gr-danger-bg)]  text-[var(--color-gr-danger)]  border-[var(--color-gr-danger)]/20',
  blue:   'bg-[var(--color-gr-info-bg)]    text-[var(--color-gr-info)]    border-[var(--color-gr-info)]/20',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  gold:   'bg-[var(--color-gr-gold-lite)] text-[var(--color-gr-gold-dark)] border-[var(--color-gr-gold)]/30',
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
  const color = pct < 20 ? 'bg-[var(--color-gr-danger)]' : pct < 45 ? 'bg-[var(--color-gr-warning)]' : 'bg-[var(--color-gr-success)]';
  const label = pct < 20 ? 'Crítico' : pct < 45 ? 'Bajo' : pct < 70 ? 'Normal' : 'Suficiente';
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-[11px] font-semibold">
        <span style={{ color: pct < 20 ? 'var(--color-gr-danger)' : pct < 45 ? 'var(--color-gr-warning)' : 'var(--color-gr-success)' }}>{label}</span>
        <span className="text-[var(--color-gr-muted)]">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-[var(--color-gr-border)] rounded-full overflow-hidden">
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
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-gr-border)]">
          <h2 className="text-[16px] font-800 text-[var(--color-gr-text)]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-gr-border)] transition-colors">
            <X size={16} className="text-[var(--color-gr-muted)]" />
          </button>
        </div>
        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
        {/* Footer fijo */}
        {footer && (
          <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-[var(--color-gr-border)] bg-white rounded-b-[16px]">
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
  success: 'bg-[var(--color-gr-primary)] text-white',
  error:   'bg-[var(--color-gr-danger)] text-white',
  warning: 'bg-[var(--color-gr-warning)] text-white',
  info:    'bg-[var(--color-gr-info)] text-white',
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
      {message && <p className="text-[14px] text-[var(--color-gr-sub)]">{message}</p>}
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
    className={cn('w-full px-3 py-2.5 rounded-[10px] border border-[var(--color-gr-border)] bg-white text-[var(--color-gr-text)] text-[14px] resize-none',
      'placeholder:text-[var(--color-gr-muted)] outline-none focus:border-[var(--color-gr-primary)] focus:ring-2 focus:ring-[var(--color-gr-primary)]/15 transition-all',
      className)} rows={3} {...rest} />
));
Textarea.displayName = 'Textarea';

// ─── Search box ───────────────────────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gr-muted)]" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar...'}
        className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[var(--color-gr-border)] bg-white text-[14px] outline-none focus:border-[var(--color-gr-primary)] focus:ring-2 focus:ring-[var(--color-gr-primary)]/15 transition-all" />
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
            {i > 0 && <div className={cn('flex-1 h-0.5 mx-1', done ? 'bg-[var(--color-gr-primary)]' : 'bg-[var(--color-gr-border)]')} />}
            <div className="flex flex-col items-center gap-1">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all',
                done   ? 'bg-[var(--color-gr-primary)] border-[var(--color-gr-primary)] text-white' :
                active ? 'bg-white border-[var(--color-gr-primary)] text-[var(--color-gr-primary)]' :
                         'bg-white border-[var(--color-gr-border)] text-[var(--color-gr-muted)]')}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn('text-[11px] font-semibold whitespace-nowrap', active ? 'text-[var(--color-gr-primary)]' : done ? 'text-[var(--color-gr-sub)]' : 'text-[var(--color-gr-muted)]')}>{label}</span>
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
      {icon && <div className="text-[var(--color-gr-muted)] mb-2">{icon}</div>}
      <p className="font-700 text-[var(--color-gr-sub)] text-[15px]">{title}</p>
      {description && <p className="text-[var(--color-gr-muted)] text-[13px] max-w-xs">{description}</p>}
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
  ghost:   'border-[var(--color-gr-border)] text-[var(--color-gr-muted)] hover:bg-[var(--color-gr-border-lite)] hover:text-[var(--color-gr-text)]',
  primary: 'border-[var(--color-gr-primary)] bg-[var(--color-gr-primary-lite)] text-[var(--color-gr-primary)] hover:bg-[var(--color-gr-primary)] hover:text-white',
  gold:    'border-[var(--color-gr-gold)] bg-[var(--color-gr-gold-lite)] text-[var(--color-gr-gold-dark)] hover:bg-[var(--color-gr-gold)] hover:text-white',
  danger:  'border-[var(--color-gr-danger)] text-[var(--color-gr-danger)] hover:bg-[var(--color-gr-danger)] hover:text-white',
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
