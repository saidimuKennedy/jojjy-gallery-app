import "next-auth";
import { UserRole } from "@prisma/client"; // Import your Prisma UserRole enum

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Add user ID
      role: UserRole; // Add user role
    } & DefaultSession["user"];
  }

  interface User {
    id: string; // Add user ID
    role: UserRole; // Add user role
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string; // Add user ID
    role: UserRole; // Add user role
  }
}
