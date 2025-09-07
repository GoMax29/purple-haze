import "../styles/globals.css";
// Import de police personnalisé retiré pour éviter les 404 sur les polices auto-hébergées

export const metadata = {
  title: "Purple Haze",
  description: "Application météo et surf pour la Bretagne",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/icons/pwa/purple-haze-app.svg"
        />
        <link rel="apple-touch-icon" href="/icons/pwa/purple-haze-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
