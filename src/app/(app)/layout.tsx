'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setAccessToken } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { PageLoader } from '@/components/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Sincroniza el access token al interceptor de axios
    setAccessToken(session?.user?.accessToken ?? null);
  }, [session]);

  // No renderizar children hasta que la sesión esté resuelta — evita
  // que las queries de React Query se disparen sin token y reciban 401.
  if (status === 'loading') return <PageLoader />;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-gr-bg">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-300 mx-auto p-6 pt-20 md:pt-6 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
