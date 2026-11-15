import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/lib/walletContext';
import WalletConnectModal from '@/components/WalletConnectModal';
import SwapMusdModal from '@/components/SwapMusdModal';
import Footer from '@/components/Footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SatsStack | Trove-Aware Bitcoin DCA Accumulator on Mezo',
  description:
    'Automated Bitcoin dollar-cost averaging on Mezo Tigris AMM with sMUSD yield and Trove ICR collateral safety circuits.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#0E1116] satsstack-grid-bg text-[#F0F4F8] antialiased min-h-screen flex flex-col">
        <WalletProvider>
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
          <Footer />
          <WalletConnectModal />
          <SwapMusdModal />
        </WalletProvider>
      </body>
    </html>
  );
}
