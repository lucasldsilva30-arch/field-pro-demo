"use client";

import Link from "next/link";
import { ErpShell } from "@/components/erp-shell";

const modules = [
  {
    href: "/operacao",
    title: "Produção",
    icon: "▮▮",
    color: "border-blue-500/60 text-blue-300",
    description: "Controle operacional, registros e integração com códigos Conecta.",
  },
  {
    href: "/whatsapp",
    title: "WhatsApp",
    icon: "✉",
    color: "border-emerald-500/60 text-emerald-300",
    description: "Leitura de mensagens, parsing dos dados e geração automática do JSON.",
  },
  {
    href: "/checklist",
    title: "Checklist",
    icon: "✓",
    color: "border-yellow-500/60 text-yellow-300",
    description: "Portal de entrega de EPIs integrado ao ERP para os fiscais.",
  },
  {
    href: "/funcionarios",
    title: "Gestão de equipes",
    icon: "👥",
    color: "border-violet-500/60 text-violet-300",
    description: "Cadastro, importação, visualização e edição de colaboradores.",
  },
  {
    href: "/materiais",
    title: "Controle de materiais",
    icon: "◼",
    color: "border-orange-500/60 text-orange-300",
    description: "Estoque, consumo, edição, exclusão e leitura por empresa.",
  },
  {
    href: "/vr",
    title: "VR",
    icon: "⌂",
    color: "border-yellow-500/60 text-yellow-300",
    description: "Lançamentos de VR com dias, sábados e cálculo dedicado.",
  },
  {
    href: "/financeiro",
    title: "Financeiro",
    icon: "$",
    color: "border-cyan-500/60 text-cyan-300",
    description: "Entradas, despesas, saldo e previsões do caixa por empresa.",
  },
  {
    href: "/previa-financeira",
    title: "Prévia financeira",
    icon: "⌦",
    color: "border-yellow-500/60 text-yellow-300",
    description: "Faturamento estimado, custos operacionais e lucro projetado em tempo real.",
  },
  {
    href: "/indicadores",
    title: "Indicadores",
    icon: "▤",
    color: "border-pink-500/60 text-pink-300",
    description: "Resumo gerencial com gráficos e leitura consolidada.",
  },
  {
    href: "/seguranca",
    title: "Segurança",
    icon: "🔒",
    color: "border-white/20 text-white",
    description: "Área protegida e preparada para controle de acesso.",
  },
] as const;

export default function ModulosPage() {
  return (
    <ErpShell active="modulos">
      <section className="space-y-6">
        <header className="rounded-[1.75rem] border border-white/10 bg-black p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Módulos do sistema</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Acesso rápido por área</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            A proposta aqui é manter os módulos visuais e fáceis de entender, separando cada função do ERP em uma área específica.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <Link
              className={`group rounded-3xl border bg-zinc-950 p-5 transition hover:-translate-y-1 hover:bg-white/[0.03] ${module.color}`}
              href={module.href}
              key={module.href}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl border border-current/20 bg-black/40 text-xl font-black">
                    {module.icon}
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight text-white">{module.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Abrir módulo</p>
                  </div>
                </div>
                <span className="mt-1 text-slate-500 transition group-hover:text-white">›</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">{module.description}</p>
            </Link>
          ))}
        </section>
      </section>
    </ErpShell>
  );
}
