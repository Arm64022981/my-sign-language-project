"use client";

import '@/app/globals.css';
import Header from './components/Header';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noHeaderRoutes = ['/Signlanguage/Login', '/Signlanguage/Register'];

  return (
    <html lang="en">
      <body>
        {!noHeaderRoutes.includes(pathname) && <Header />}
        <main>{children}</main>
      </body>
    </html>
  );
}
