'use client';
import { useEffect, useState } from 'react';
import { useEmpresa, useActualizarConfiguracion, useActualizarEmpresa } from '@/lib/api/empresa';
import { apiErrorMessage } from '@/lib/api';
import { normalizePhone } from '@/components/ui';
import { Btn, FormField, Input, PhoneInput, Spinner, useToast } from '@/components/ui';
import { Building2, ShieldCheck, HardHat } from 'lucide-react';
import { formatBs } from '@/lib/utils';

export function TabEmpresa() {
  const toast = useToast(s => s.show);
  const empresaQ = useEmpresa();
  const actualizarConfig = useActualizarConfiguracion();
  const actualizarDatos  = useActualizarEmpresa();

  const [nombre, setNombre]       = useState('');
  const [nit, setNit]             = useState('');
  const [rubro, setRubro]         = useState('');
  const [telefono, setTelefono]   = useState('');
  const [email, setEmail]         = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad]       = useState('');
  const [logoUrl, setLogoUrl]     = useState('');
  const [registroSanitario, setRS] = useState('');
  const [tarifa, setTarifa] = useState('');

  const empresa = empresaQ.data;

  useEffect(() => {
    if (!empresa) return;
    setNombre(empresa.nombre ?? '');
    setNit(empresa.nit ?? '');
    setRubro(empresa.rubro ?? '');
    setTelefono(normalizePhone(empresa.telefono ?? ''));
    setEmail(empresa.email ?? '');
    setDireccion(empresa.direccion ?? '');
    setCiudad(empresa.ciudad ?? '');
    setLogoUrl(empresa.logoUrl ?? '');
  }, [empresa]);

  if (empresaQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  const rsActual = empresa?.configuracion?.registroSanitario ?? '';

  const hayCambiosDatos =
    nombre    !== (empresa?.nombre    ?? '') ||
    nit       !== (empresa?.nit       ?? '') ||
    rubro     !== (empresa?.rubro     ?? '') ||
    telefono  !== normalizePhone(empresa?.telefono  ?? '') ||
    email     !== (empresa?.email     ?? '') ||
    direccion !== (empresa?.direccion ?? '') ||
    ciudad    !== (empresa?.ciudad    ?? '') ||
    logoUrl   !== (empresa?.logoUrl   ?? '');

  async function handleGuardarDatos() {
    try {
      await actualizarDatos.mutateAsync({
        nombre:    nombre    || undefined,
        nit:       nit       || undefined,
        rubro:     rubro     || undefined,
        telefono:  telefono  || undefined,
        email:     email     || undefined,
        direccion: direccion || undefined,
        ciudad:    ciudad    || undefined,
        logoUrl:   logoUrl   || undefined,
      });
      toast('Datos de la empresa actualizados', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar'), 'error');
    }
  }

  async function handleGuardarRS() {
    try {
      await actualizarConfig.mutateAsync({ registroSanitario });
      toast('Registro sanitario actualizado', 'success');
      setRS('');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar'), 'error');
    }
  }

  async function handleGuardarTarifa() {
    const valor = parseFloat(tarifa);
    if (!Number.isFinite(valor) || valor < 0) return;
    try {
      await actualizarConfig.mutateAsync({ tarifaPorBolsaBs: valor });
      toast('Tarifa de carga actualizada', 'success');
      setTarifa('');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar'), 'error');
    }
  }

  const tarifaActual = Number(empresa?.configuracion?.tarifaPorBolsaBs ?? 0);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[var(--color-gr-primary)]" />
          <h2 className="font-800 text-[15px] text-[var(--color-gr-text)]">Datos de la empresa</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Razón social" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Grano Rey SRL" />
          </FormField>
          <FormField label="NIT">
            <Input value={nit} onChange={e => setNit(e.target.value)} placeholder="1234567890" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Rubro">
            <Input value={rubro} onChange={e => setRubro(e.target.value)} placeholder="Alimentos precocidos" />
          </FormField>
          <FormField label="Plan (solo lectura)">
            <Input value={empresa?.plan ?? ''} disabled />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Teléfono">
            <PhoneInput value={telefono} onChange={setTelefono} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.bo" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Ciudad">
            <Input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Santa Cruz" />
          </FormField>
          <FormField label="Dirección">
            <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Cristo Redentor #1234" />
          </FormField>
        </div>

        <FormField label="URL del logo">
          <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
        </FormField>

        <div className="flex justify-end">
          <Btn
            onClick={handleGuardarDatos}
            disabled={!hayCambiosDatos || !nombre.trim()}
            loading={actualizarDatos.isPending}>
            <Building2 size={14} /> Guardar datos
          </Btn>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--color-gr-primary)]" />
          <h2 className="font-800 text-[15px] text-[var(--color-gr-text)]">Registro sanitario SENASAG</h2>
        </div>
        <p className="text-[12.5px] text-[var(--color-gr-muted)] -mt-2">
          Conforme a Norma Boliviana NB 314001 y SENASAG R.A. 042/2023. Se imprime automáticamente en cada lote producido.
        </p>

        <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
          <p className="text-[12px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Registro actual</p>
          <p className="font-800 text-[15px] text-[var(--color-gr-primary)] font-mono">
            {rsActual || <span className="text-[var(--color-gr-muted)] font-normal italic">Sin configurar</span>}
          </p>
        </div>

        <FormField label="Nuevo número de registro sanitario">
          <Input placeholder={rsActual || 'RS-BO-2024-001234'} value={registroSanitario}
            onChange={e => setRS(e.target.value)} />
        </FormField>

        <div className="flex justify-end">
          <Btn onClick={handleGuardarRS} disabled={!registroSanitario.trim()} loading={actualizarConfig.isPending}>
            <ShieldCheck size={14} /> Guardar registro
          </Btn>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <HardHat size={18} className="text-[var(--color-gr-primary)]" />
          <h2 className="font-800 text-[15px] text-[var(--color-gr-text)]">Tarifa de carga (estibadores)</h2>
        </div>
        <p className="text-[12.5px] text-[var(--color-gr-muted)] -mt-2">
          Monto en Bs que se paga por cada bolsa cargada. Se aplica al registrar carga en entradas de MP y despachos.
        </p>

        <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
          <p className="text-[12px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Tarifa actual</p>
          <p className="font-800 text-[15px] text-[var(--color-gr-primary)]">
            {tarifaActual > 0
              ? `${formatBs(tarifaActual)} / bolsa`
              : <span className="text-[var(--color-gr-muted)] font-normal italic">Sin configurar</span>}
          </p>
        </div>

        <FormField label="Nueva tarifa (Bs por bolsa)">
          <Input type="number" min="0" step="0.1" placeholder="ej: 1.50" value={tarifa}
            onChange={e => setTarifa(e.target.value)} />
        </FormField>

        <div className="flex justify-end">
          <Btn
            onClick={handleGuardarTarifa}
            disabled={!tarifa.trim() || !Number.isFinite(parseFloat(tarifa)) || parseFloat(tarifa) < 0}
            loading={actualizarConfig.isPending}>
            <HardHat size={14} /> Guardar tarifa
          </Btn>
        </div>
      </div>
    </div>
  );
}
