import type { Metadata } from 'next';
import './globals.css';

const manifest = {
  name: 'HypnoHistory',
  short_name: 'HypnoHistory',
  description: "Apprenez l'Histoire en état modifié de conscience",
  start_url: '/',
  display: 'standalone',
  background_color: '#1e1432',
  theme_color: '#7c3aed',
  icons: [
    {
      src: 'https://i.ibb.co/Z66542nj/Hh.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: 'https://i.ibb.co/Z66542nj/Hh.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};

const manifestDataUrl = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;

export const metadata: Metadata = {
  title: 'HypnoHistory',
  description: "Apprenez l'Histoire en état modifié de conscience",
  themeColor: '#7c3aed',
  manifest: manifestDataUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Crimson+Pro:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full font-body bg-[#050308]">
        {children}
      </body>
    </html>
  );
}
