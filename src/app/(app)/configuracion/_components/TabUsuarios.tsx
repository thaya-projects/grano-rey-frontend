'use client';
import { useState, useMemo } from 'react';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '@/lib/api/usuarios';
import { RolUsuario, type Usuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { generarPassword } from '@/lib/utils';
import {
  Btn, Modal, FormField, Input, Select, Badge, Spinner, useToast, Pagination, usePagination,
} from '@/components/ui';
import { Plus, Trash2, Pencil, Users, CheckCircle2, XCircle, Wand2, Eye, EyeOff } from 'lucide-react';

const ROL_LABELS: Record<RolUsuario, string> = {
  administradora: 'Administrador',
  almacenero:     'Almacenero',
  vendedor:       'Vendedor',
  produccion:     'Producción',
};

const ROL_COLORS: Record<RolUsuario, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  administradora: 'red',
  almacenero:     'blue',
  vendedor:       'green',
  produccion:     'yellow',
};

// ─── Modal crear usuario ───────────────────────────────────────
function NuevoUsuarioModal({ onClose, onSaved, onError }: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateUsuario();
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [rol, setRol]           = useState<RolUsuario>(RolUsuario.VENDEDOR);
  const [telefono, setTelefono] = useState('');

  const valid = !!nombre.trim() && !!email.trim() && password.length >= 6;

  function handleGenerar() {
    setPassword(generarPassword());
    setVerPassword(true);
  }

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
        telefono: telefono.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo crear el usuario'));
    }
  }

  return (
    <Modal open title="Crear usuario" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>
          <Plus size={14} /> Crear usuario
        </Btn>
      </>}>
      <FormField label="Nombre completo" required>
        <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Carlos Mamani" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="carlos@granorey.bo" />
        </FormField>
        <FormField label="Contraseña" required hint="Mínimo 6 caracteres">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input type={verPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••" className="pr-9" />
              <button type="button" onClick={() => setVerPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gr-muted hover:text-gr-text">
                {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Btn type="button" size="sm" variant="ghost" onClick={handleGenerar} title="Generar contraseña">
              <Wand2 size={14} />
            </Btn>
          </div>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Rol" required>
          <Select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}>
            {Object.entries(ROL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Teléfono" hint="Opcional">
          <Input value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="76012345" />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Modal editar usuario ──────────────────────────────────────
function EditarUsuarioModal({ usuario, onClose, onSaved, onError }: {
  usuario: Usuario;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const update = useUpdateUsuario();
  const [nombre, setNombre]     = useState(usuario.nombre);
  const [email, setEmail]       = useState(usuario.email);
  const [rol, setRol]           = useState<RolUsuario>(usuario.rol);
  const [telefono, setTelefono] = useState(usuario.telefono ?? '');
  const [activo, setActivo]     = useState(usuario.activo);
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const valid = !!nombre.trim() && !!email.trim() && (password === '' || password.length >= 6);

  function handleGenerar() {
    setPassword(generarPassword());
    setVerPassword(true);
  }

  async function handleSave() {
    if (!valid) return;
    try {
      await update.mutateAsync({
        id: usuario.id,
        dto: {
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          rol,
          telefono: telefono.trim() || undefined,
          activo,
          password: password || undefined,
        },
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo actualizar el usuario'));
    }
  }

  return (
    <Modal open title={`Editar — ${usuario.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={update.isPending}>
          <Pencil size={14} /> Guardar cambios
        </Btn>
      </>}>
      <FormField label="Nombre completo" required>
        <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Teléfono">
          <Input value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="76012345" />
        </FormField>
      </div>
      <FormField label="Nueva contraseña" hint={password && password.length < 6 ? 'Mínimo 6 caracteres' : 'Dejar en blanco para no cambiarla'}
        error={password && password.length < 6 ? 'Mínimo 6 caracteres' : undefined}>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Input type={verPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••" className="pr-9" />
            <button type="button" onClick={() => setVerPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gr-muted hover:text-gr-text">
              {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Btn type="button" size="sm" variant="ghost" onClick={handleGenerar} title="Generar contraseña">
            <Wand2 size={14} />
          </Btn>
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Rol" required>
          <Select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}>
            {Object.entries(ROL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Estado">
          <Select value={activo ? 'true' : 'false'} onChange={e => setActivo(e.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inhabilitado</option>
          </Select>
        </FormField>
      </div>
      {!activo && (
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Un usuario inhabilitado no puede iniciar sesión, pero su historial se conserva.
        </p>
      )}
    </Modal>
  );
}

// ─── Tab ──────────────────────────────────────────────────────
export function TabUsuarios() {
  const toast       = useToast(s => s.show);
  const usuariosQ   = useUsuarios();
  const deleteUser  = useDeleteUsuario();
  const usuarios: Usuario[] = usuariosQ.data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [editando, setEditando]     = useState<Usuario | null>(null);
  const [confirmDel, setConfirmDel] = useState<Usuario | null>(null);
  const [filtroRol, setFiltroRol]   = useState<RolUsuario | ''>('');

  const filtrados = useMemo(() =>
    usuarios
      .filter(u => !filtroRol || u.rol === filtroRol)
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [usuarios, filtroRol],
  );
  const { page, setPage, totalPages, pageItems, pageSize, setPageSize, total } = usePagination(filtrados);

  async function handleDelete(u: Usuario) {
    try {
      await deleteUser.mutateAsync(u.id);
      toast('Usuario eliminado', 'warning');
      setConfirmDel(null);
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo eliminar'), 'error');
      setConfirmDel(null);
    }
  }

  if (usuariosQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-50">
        <Spinner size={24} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setFiltroRol('')}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-700 border transition-all ${
              filtroRol === '' ? 'bg-gr-primary text-white border-gr-primary' : 'bg-white text-gr-muted border-gr-border hover:text-gr-text'
            }`}>
            Todos
          </button>
          {(Object.entries(ROL_LABELS) as [RolUsuario, string][]).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFiltroRol(filtroRol === v ? '' : v)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-700 border transition-all ${
                filtroRol === v ? 'bg-gr-primary text-white border-gr-primary' : 'bg-white text-gr-muted border-gr-border hover:text-gr-text'
              }`}>
              {l}
            </button>
          ))}
        </div>
        <Btn variant="gold" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> Nuevo usuario
        </Btn>
      </div>

      {/* Lista */}
      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
          style={{ gridTemplateColumns: '1fr 190px 110px 120px 80px 64px', background: 'var(--color-gr-border-lite)' }}>
          <span>Nombre</span>
          <span>Email</span>
          <span>Teléfono</span>
          <span>Rol</span>
          <span>Estado</span>
          <span />
        </div>

        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-gr-muted text-[14px]">
            <Users size={32} className="mx-auto mb-3 opacity-20" />
            <p>Sin usuarios registrados</p>
          </div>
        ) : (
          pageItems.map((u, i) => (
            <div key={u.id}
              className={`px-5 py-3.5 ${i < pageItems.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
              {/* Mobile */}
              <div className="flex items-start justify-between gap-2 md:hidden">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Badge color={ROL_COLORS[u.rol]}>{ROL_LABELS[u.rol]}</Badge>
                    {u.activo ? (
                      <span className="flex items-center gap-1 text-[11px] font-600 text-emerald-600">
                        <CheckCircle2 size={11} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-600 text-gr-muted">
                        <XCircle size={11} /> Inhabilitado
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-700 text-gr-text">{u.nombre}</p>
                  <p className="text-[12px] text-gr-muted font-mono">{u.email}</p>
                  {u.telefono && <p className="text-[11px] text-gr-muted mt-0.5">{u.telefono}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => setEditando(u)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setConfirmDel(u)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid gap-3 items-center"
                style={{ gridTemplateColumns: '1fr 190px 110px 120px 80px 64px' }}>
                <div>
                  <p className="font-700 text-[13.5px] text-gr-text leading-tight">{u.nombre}</p>
                  {u.ultimoAcceso && (
                    <p className="text-[11px] text-gr-muted mt-0.5">Último acceso {u.ultimoAcceso.slice(0, 10)}</p>
                  )}
                </div>
                <span className="text-[12.5px] text-gr-muted font-mono truncate" title={u.email}>
                  {u.email}
                </span>
                <span className="text-[12.5px] text-gr-muted">{u.telefono ?? '—'}</span>
                <Badge color={ROL_COLORS[u.rol]}>{ROL_LABELS[u.rol]}</Badge>
                <div>
                  {u.activo ? (
                    <span className="flex items-center gap-1.5 text-[12px] font-600 text-emerald-600">
                      <CheckCircle2 size={13} /> Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[12px] font-600 text-gr-muted">
                      <XCircle size={13} /> Inhabilitado
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => setEditando(u)} title="Editar"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setConfirmDel(u)} title="Eliminar"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} total={total} />

        {filtrados.length > 0 && (
          <div className="px-5 py-3 text-[12.5px] text-gr-muted border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            {filtrados.filter(u => u.activo).length} activos · {filtrados.filter(u => !u.activo).length} inhabilitados
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreate && (
        <NuevoUsuarioModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); toast('Usuario creado', 'success'); }}
          onError={msg => toast(msg, 'error')}
        />
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); toast('Usuario actualizado', 'success'); }}
          onError={msg => toast(msg, 'error')}
        />
      )}

      {confirmDel && (
        <Modal open title="Eliminar usuario" onClose={() => setConfirmDel(null)}
          footer={<>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDel)} loading={deleteUser.isPending}>
              <Trash2 size={13} /> Eliminar
            </Btn>
          </>}>
          <p className="text-[14px] text-gr-text">
            ¿Eliminar a <strong>{confirmDel.nombre}</strong>?
          </p>
          <p className="text-[13px] text-gr-muted mt-1">
            {confirmDel.email} · {ROL_LABELS[confirmDel.rol]}
          </p>
          <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            Esta acción es irreversible desde la UI. El historial del usuario se conserva.
          </p>
        </Modal>
      )}
    </div>
  );
}
