"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useErpData } from "@/hooks/use-erp-data";
import { useErpTheme } from "@/hooks/use-erp-theme";
import { companies } from "@/lib/companies";
import type { CompanyName } from "@/lib/types";

type ErpShellProps = {
  active: "dashboard" | "operacao" | "indicadores" | "funcionarios" | "financeiro" | "configuracoes" | "seguranca";
  children: ReactNode;
};

const navigation = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "home" },
  { key: "operacao", label: "Operação", href: "/operacao", icon: "activity" },
  { key: "indicadores", label: "Indicadores", href: "/indicadores", icon: "chart" },
  { key: "funcionarios", label: "Funcionários", href: "/funcionarios", icon: "users" },
  { key: "financeiro", label: "Financeiro", href: "/financeiro", icon: "wallet" },
  { key: "seguranca", label: "Segurança", href: "/seguranca", icon: "lock" },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes", icon: "settings" },
] as const;

export function ErpShell({ active, children }: ErpShellProps) {
  const { empresaAtiva, setEmpresaAtiva } = useErpData();
  useErpTheme();

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-black" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black shadow-2xl shadow-black/40 lg:flex lg:flex-col">
          <BrandBlock />

          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            <CompanySelector empresaAtiva={empresaAtiva} onChange={setEmpresaAtiva} />

            {navigation.map((item) => (
              <NavLink active={active === item.key} href={item.href} icon={item.icon} key={item.key} label={item.label} />
            ))}
          </nav>

          <div className="px-3 pb-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-slate-400">
              Acesso livre ao painel
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-16 flex-col gap-3 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between lg:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <LogoMark />
              <div>
                <p className="text-lg font-extrabold leading-none text-[#f5b900]">FIELD PRO</p>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-slate-400">OPERATIONS SUITE</p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2 lg:hidden">
              {navigation.map((item) => (
                <Link
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                    active === item.key
                      ? "border border-white/10 bg-white/5 text-white"
                      : "bg-transparent text-white"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  <MenuIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <CompanySelector compact empresaAtiva={empresaAtiva} onChange={setEmpresaAtiva} />

              <div className="hidden text-right md:block">
                <p className="text-sm font-bold">Administrador</p>
                <p className="mt-1 text-xs text-slate-400">admin@fieldpro.com</p>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

function BrandBlock() {
  return (
    <div className="border-b border-white/10 px-4 py-5">
      <div className="flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="text-lg font-black leading-none text-[#f5b900]">FIELD PRO</p>
          <p className="mt-1.5 text-[10px] tracking-[0.24em] text-slate-400">OPERATIONS SUITE</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Sistema</p>
        <p className="mt-1 text-sm font-bold text-slate-100">ERP Operacional</p>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="grid size-11 place-items-center rounded-2xl border border-yellow-500/40 bg-black shadow-[0_0_24px_rgba(245,185,0,0.18)]">
      <span className="bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-800 bg-clip-text text-2xl font-black italic text-transparent">
        E
      </span>
    </div>
  );
}

function NavLink({ active, href, icon, label }: { active: boolean; href: string; icon: string; label: string }) {
  return (
    <Link
      className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? "border border-white/10 bg-white/[0.03] text-white"
          : "border border-transparent bg-transparent text-white hover:border-white/10 hover:bg-white/[0.03]"
      }`}
      href={href}
    >
      <span className="flex items-center gap-3">
        <MenuIcon name={icon} />
        {label}
      </span>
      <span className="text-slate-500 group-hover:text-white">›</span>
    </Link>
  );
}

function CompanySelector({
  compact = false,
  empresaAtiva,
  onChange,
}: {
  compact?: boolean;
  empresaAtiva: CompanyName;
  onChange: (empresa: CompanyName) => void;
}) {
  return (
    <label className={compact ? "block md:min-w-52" : "mb-3 block rounded-2xl border border-white/10 bg-black/40 p-3"}>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] erp-accent-text">Empresa ativa</span>
      <div className="relative mt-2">
        <select
          className="w-full appearance-none rounded-xl border border-white/10 bg-black px-3 py-2.5 pr-9 text-sm font-bold text-white outline-none transition focus:border-[var(--erp-accent)]"
          onChange={(event) => onChange(event.target.value as CompanyName)}
          value={empresaAtiva}
        >
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 erp-accent-text">⌄</span>
      </div>
    </label>
  );
}

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    activity: <path d="M4 16h3l2-8 4 12 2-7h5" />,
    chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7" />,
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    wallet: <path d="M3 7h18v13H3zM16 12h3M5 7V5a2 2 0 0 1 2-2h10v4" />,
    lock: <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />,
    settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v3m0 13v3m9.5-9.5h-3m-13 0h-3m16.02-6.52-2.12 2.12M7.6 16.4l-2.12 2.12m13.04 0-2.12-2.12M7.6 7.6 5.48 5.48" />,
  };

  return (
    <svg aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name] ?? paths.home}
    </svg>
  );
}

