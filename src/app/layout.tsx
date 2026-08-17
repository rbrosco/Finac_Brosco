import "./globals.css";
import type { Metadata } from "next";
import { SidebarProvider } from "@/context/SidebarContext";
import { TutorialProvider } from "@/context/TutorialContext";
import InteractiveTutorialModal from "@/components/common/InteractiveTutorialModal";

export const metadata: Metadata = {
  title: "Finac Brosco | Gestão Financeira Pessoal & Empresarial",
  description: "Sistema completo de controle financeiro, gestão de receitas, despesas fixas recorrentes e gastos variáveis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <TutorialProvider>
          <SidebarProvider>
            {children}
            <InteractiveTutorialModal />
          </SidebarProvider>
        </TutorialProvider>
      </body>
    </html>
  );
}
