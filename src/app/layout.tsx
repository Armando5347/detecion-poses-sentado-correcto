import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Detección poses / Correccion sentado",
  description: "Pequeña aplicación para detectar si una persona esta sentada correctamente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <meta charSet="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0, user-scalable=no"/>
      
      <body className={inter.className}>{children}</body>
    </html>
  );
}
