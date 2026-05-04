import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

export const metadata: Metadata = {
  title: 'Instagram Growth Suite',
  description: 'AI-Powered Instagram & LinkedIn Growth Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg-base text-text-base min-h-screen">
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
