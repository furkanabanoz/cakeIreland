import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN" | "STAFF";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: "CUSTOMER" | "ADMIN" | "STAFF";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "CUSTOMER" | "ADMIN" | "STAFF";
  }
}
