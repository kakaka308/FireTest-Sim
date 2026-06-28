import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ISO 11820 建材不燃性试验仿真系统',
  description: '建筑材料不燃性试验仿真系统 - ISO 11820',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
