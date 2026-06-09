'use client';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { setAccessToken } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Sincroniza el token al interceptor de axios
    setAccessToken(session?.user?.accessToken ?? null);

    // Si el backend JWT expiró, cierra sesión automáticamente
    if (session?.error === 'AccessTokenExpired') {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-gr-bg)]">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto p-6 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
