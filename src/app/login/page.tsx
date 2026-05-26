'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { apiErrorMessage } from '@/lib/api';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #2E4434 0%, #3C5A44 50%, #567A5F 100%)' }}>

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden">

          {/* Logo section */}
          <div className="flex flex-col items-center pt-10 pb-6 px-8 border-b"
            style={{ borderColor: '#EAF0EB' }}>
            <div className="relative w-[200px] h-[120px]">
              <Image
                src="/logo-grano-rey.webp"
                alt="Grano Rey"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 style={{ color: '#1D2B1F', fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
              Ingresar al sistema
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#52665A', marginBottom: '6px' }}>
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8AA08A' }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%', height: '44px', paddingLeft: '36px', paddingRight: '12px',
                      borderRadius: '10px', border: '1.5px solid #D8E2D9', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3C5A44'}
                    onBlur={e => e.target.style.borderColor = '#D8E2D9'}
                    placeholder="usuario@granory.bo" required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#52665A', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8AA08A' }} />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%', height: '44px', paddingLeft: '36px', paddingRight: '12px',
                      borderRadius: '10px', border: '1.5px solid #D8E2D9', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3C5A44'}
                    onBlur={e => e.target.style.borderColor = '#D8E2D9'}
                    placeholder="••••••••" required
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626'
                }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px',
                  background: loading ? '#8AA08A' : '#3C5A44', color: 'white',
                  fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}>
                {loading ? <><Spinner size={18} color="white" /> Verificando...</> : 'Ingresar'}
              </button>
            </form>

          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '16px' }}>
          Grano Rey S.R.L. · Bolivia · v2.0
        </p>
      </div>
    </div>
  );
}
