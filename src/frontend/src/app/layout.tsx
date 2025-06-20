import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/providers/WalletProvider";
import { WalletAwareLayout } from "@/components/WalletAwareLayout";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "DeGenie - From Idea to Viral Token in 60 Seconds",
  description: "AI-powered cryptocurrency token creation platform with automated design, marketing, and technical aspects. Create meme coins with AI-generated assets.",
  keywords: ['cryptocurrency', 'tokens', 'AI', 'meme coins', 'DeFi', 'Solana', 'Web3', 'bonding curve'],
  openGraph: {
    title: 'DeGenie - From Idea to Viral Token in 60 Seconds',
    description: 'AI-powered cryptocurrency token creation platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900`}
      >
        <WalletProvider>
          <WalletAwareLayout>
            {children}
          </WalletAwareLayout>
        </WalletProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
          }}
        />
      </body>
    </html>
  );
}
