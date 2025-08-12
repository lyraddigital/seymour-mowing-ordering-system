import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { Credentials, AdminUser } from "@/app/types";

export const { signIn } = NextAuth({
  secret: "abc123",
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const formCredentials = credentials as Credentials;

        return await Promise.resolve({
          username: formCredentials.username,
          password: formCredentials.password,
        } as AdminUser);
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});
