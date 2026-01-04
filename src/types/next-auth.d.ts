/**
 * NextAuth.js 타입 확장
 */
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      credits?: number;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    credits?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
