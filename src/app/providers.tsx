'use client';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastContainer } from '@/components/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5s de "grace period" para evitar refetches innecesarios cuando
        // hay varios componentes montándose a la vez, pero corto para que
        // al cambiar de pestaña o volver a la ventana veas datos frescos.
        staleTime: 5_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
    },
  }));
  return (
    <SessionProvider>
      <QueryClientProvider client={qc}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </SessionProvider>
  );
}
