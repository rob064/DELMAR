import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: {
            trabajador: true,
          },
        });

        if (!usuario || !usuario.activo) {
          throw new Error("Usuario no encontrado o inactivo");
        }

        const passwordMatch = await compare(credentials.password, usuario.password);

        if (!passwordMatch) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          role: usuario.role,
          trabajadorId: usuario.trabajador?.id || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.trabajadorId = user.trabajadorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.trabajadorId = token.trabajadorId as string | null;
      }
      return session;
    },
  },
};
