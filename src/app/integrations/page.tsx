"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
      Redirecionando para a Central de Configurações & Integrações...
    </div>
  );
}
