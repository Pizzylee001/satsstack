import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SatsStack | Trove-Aware Bitcoin DCA Accumulator on Mezo',
  description: 'Automated Bitcoin dollar-cost averaging on Mezo Tigris AMM with sMUSD yield and Trove ICR collateral safety circuits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="bg-[#0E1116] text-[#F0F4F8] antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
