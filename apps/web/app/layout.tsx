import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../provider";
import { Geist } from "next/font/google";
import Nav from '@/components/Nav';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "T4 — Touch-Free Gesture Control",
  description: "Control your computer with intuitive, touch-free hand gestures powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
