import 'next-auth';
import 'next-auth/jwt';
import type { RolUsuario } from '@/lib/types';

declare module 'next-auth' {
  interface User {
    nombre: string;
    rol: RolUsuario;
    iniciales: string;
    accessToken: string;
  }
  interface Session {
    user: {
      id: string;
      nombre: string;
      email: string;
      rol: RolUsuario;
      iniciales: string;
      accessToken: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    nombre: string;
    rol: RolUsuario;
    iniciales: string;
    accessToken: string;
  }
}
