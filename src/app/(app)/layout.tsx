'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setAccessToken } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // Sync the NextAuth token into the axios interceptor (in-memory only)
  useEffect(() => {
    setAccessToken(session?.user?.accessToken ?? null);
  }, [session?.user?.accessToken]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gr-bg">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-300 mx-auto p-6 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
