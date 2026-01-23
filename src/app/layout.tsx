import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HUB Property Management",
  description: "CRM per la gestione di affitti brevi in Valtellina, Valchiavenna e Lago di Como",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
