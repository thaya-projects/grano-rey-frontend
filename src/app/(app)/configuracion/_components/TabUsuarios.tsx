'use client';
import { useState, useMemo } from 'react';
import { useUsuarios, useDeleteUsuario } from '@/lib/api/usuarios';
import { RolUsuario, type Usuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, Spinner, useToast, Pagination, usePagination } from '@/components/ui';
import { Plus, Trash2, Users } from 'lucide-react';
import { NuevoUsuarioModal } from './usuarios/NuevoUsuarioModal';
import { EditarUsuarioModal } from './usuarios/EditarUsuarioModal';
import { UsuarioRow } from './usuarios/UsuarioRow';
import { ROL_LABELS } from './usuarios/constants';

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
            <UsuarioRow key={u.id} usuario={u} isLast={i === pageItems.length - 1}
              onEditar={() => setEditando(u)}
              onEliminar={() => setConfirmDel(u)}
            />
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
