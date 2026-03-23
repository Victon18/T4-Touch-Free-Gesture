import db from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
    GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID || "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }),
      CredentialsProvider({
          name: 'Credentials',
          credentials: {
            phone: { label: "Phone number", type: "text", placeholder: "1231231231" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials: any) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            const existingUser = await db.user.findFirst({
                where: {
                    number: credentials.phone
                }
            });
                        if (existingUser) {
                const passwordValidation = await bcrypt.compare(credentials.password, existingUser.password);
                if (passwordValidation) {
                    return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        email: existingUser.number
                    }
                }
                return null; // Invalid password
            }
            // User does not exist, reject login
            return null;
          },
        })
    ],
    secret: process.env.JWT_SECRET || "secret",
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        async session({ token, session }: any) {
            session.user.id = token.sub

            return session
        }
    }
  }

