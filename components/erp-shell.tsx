"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useErpData } from "@/hooks/use-erp-data";
import { useModuleBadges } from "@/hooks/use-module-badges";
import { useErpTheme } from "@/hooks/use-erp-theme";
import { companies } from "@/lib/companies";
import type { CompanyName } from "@/lib/types";

type ErpShellProps = {
  active:
    | "dashboard"
    | "modulos"
    | "operacao"
  | "whatsapp"
  | "checklist"
  | "privacidade"
  | "indicadores"
  | "previafinanceira"
  | "funcionarios"
  | "materiais"
  | "vr"
    | "financeiro"
    | "configuracoes"
    | "seguranca";
  children: ReactNode;
};

const navigation = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "home" },
  { key: "modulos", label: "Módulos", href: "/modulos", icon: "grid" },
  { key: "operacao", label: "Produção", href: "/operacao", icon: "activity" },
  { key: "whatsapp", label: "WhatsApp", href: "/whatsapp", icon: "message" },
  { key: "checklist", label: "Checklist", href: "/checklist", icon: "clipboard" },
  { key: "indicadores", label: "Indicadores", href: "/indicadores", icon: "chart" },
  { key: "previafinanceira", label: "Prévia financeira", href: "/previa-financeira", icon: "calculator" },
  { key: "funcionarios", label: "Funcionários", href: "/funcionarios", icon: "users" },
  { key: "materiais", label: "Materiais", href: "/materiais", icon: "box" },
  { key: "vr", label: "VR", href: "/vr", icon: "wallet" },
  { key: "financeiro", label: "Financeiro", href: "/financeiro", icon: "wallet" },
  { key: "seguranca", label: "Segurança", href: "/seguranca", icon: "lock" },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes", icon: "settings" },
] as const;

type NavigationKey = (typeof navigation)[number]["key"];

export function ErpShell({ active, children }: ErpShellProps) {
  const { empresaAtiva, setEmpresaAtiva } = useErpData();
  const badges = useModuleBadges();
  const { theme, setTheme } = useErpTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncMode = () => setIsMobile(mediaQuery.matches);

    syncMode();
    mediaQuery.addEventListener("change", syncMode);

    return () => mediaQuery.removeEventListener("change", syncMode);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <main className="min-h-screen bg-black text-slate-50 transition-colors duration-200 dark:bg-black dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-black" />
      <div className="relative flex min-h-screen">
        {!isMobile ? (
          <aside className="w-64 shrink-0 border-r border-white/10 bg-black shadow-2xl shadow-black/40 flex flex-col">
            <BrandBlock />

            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              <CompanySelector empresaAtiva={empresaAtiva} onChange={setEmpresaAtiva} />

            {navigation.map((item) => (
                <NavLink active={active === item.key} badge={badges[item.key as NavigationKey]} href={item.href} icon={item.icon} key={item.key} label={item.label} />
              ))}

              <div className="mt-2 border-t border-white/10 pt-3">
                <ThemeToggleButton themeMode={theme.mode} onToggle={() => setTheme({ ...theme, mode: theme.mode === "dark" ? "light" : "dark" })} />
              </div>
            </nav>

          </aside>
        ) : null}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
            <button
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.06] lg:hidden"
                aria-label="Abrir menu"
                type="button"
                data-demo-nav="true"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon name="menu" />
              </button>
              <BrandLogo compact />
            </div>

            <div className="ml-auto flex items-center gap-2 md:hidden">
              <ThemeToggleButton
                themeMode={theme.mode}
                onToggle={() => setTheme({ ...theme, mode: theme.mode === "dark" ? "light" : "dark" })}
              />
            </div>

            <div className="hidden text-right md:block">
              <p className="text-sm font-bold">Administrador</p>
              <p className="mt-1 text-xs text-slate-400">demo@fieldpro.local</p>
            </div>
            <div className="hidden lg:block">
              <CompanySelector compact empresaAtiva={empresaAtiva} onChange={setEmpresaAtiva} />
            </div>
            <div className="hidden md:block">
              <ThemeToggleButton themeMode={theme.mode} onToggle={() => setTheme({ ...theme, mode: theme.mode === "dark" ? "light" : "dark" })} compact />
            </div>
          </header>

          <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6">{children}</div>

          <footer className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-slate-600 sm:px-6 lg:px-8 dark:text-slate-500">
              <Link className="erp-footer-link transition hover:text-yellow-300" data-demo-nav="true" href="/privacidade">
              Termos de Privacidade
            </Link>
          </footer>
        </section>
      </div>

      {isMobile ? (
        <div
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity ${
            mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      {isMobile ? (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm border-r border-white/10 bg-black shadow-2xl shadow-black/40 transition-transform duration-300`}
          aria-hidden={!mobileMenuOpen}
          style={{
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            willChange: "transform",
          }}
        >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <BrandLogo compact />
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.06]"
              aria-label="Fechar menu"
              type="button"
              data-demo-nav="true"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MenuIcon name="close" />
            </button>
          </div>

          <div className="border-b border-white/10 px-4 py-4">
            <CompanySelector empresaAtiva={empresaAtiva} onChange={setEmpresaAtiva} />
          </div>

          <div className="border-b border-white/10 px-4 py-4">
            <ThemeToggleButton themeMode={theme.mode} onToggle={() => setTheme({ ...theme, mode: theme.mode === "dark" ? "light" : "dark" })} />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navigation.map((item) => (
              <Link
                className={`group mb-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active === item.key
                    ? "border border-white/10 bg-white/[0.03] text-white"
                    : "border border-transparent bg-transparent text-white hover:border-white/10 hover:bg-white/[0.03]"
                }`}
                href={item.href}
                key={item.key}
                data-demo-nav="true"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <MenuIcon name={item.icon} />
                  {item.label}
                </span>
                <span className="flex items-center gap-2 text-slate-500 group-hover:text-white">
                  {badges[item.key as NavigationKey] ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-black">
                      {badges[item.key as NavigationKey]}
                    </span>
                  ) : null}
                  <span>›</span>
                </span>
              </Link>
            ))}
          </nav>

          <form action="/api/auth/logout" method="post" className="border-t border-white/10 px-3 pb-4 pt-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-100" type="submit">
              <MenuIcon name="logout" />
              Sair
            </button>
          </form>
        </div>
        </aside>
      ) : null}
    </main>
  );
}

function BrandBlock() {
  return (
    <div className="border-b border-white/10 px-4 py-5">
      <BrandLogo compact />
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Sistema</p>
        <p className="mt-1 text-sm font-bold text-slate-100">ERP Operacional</p>
      </div>
    </div>
  );
}

function NavLink({
  active,
  badge,
  href,
  icon,
  label,
}: {
  active: boolean;
  badge?: number;
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? "border border-white/10 bg-white/[0.03] text-white"
          : "border border-transparent bg-transparent text-white hover:border-white/10 hover:bg-white/[0.03]"
      }`}
      data-demo-nav="true"
      href={href}
    >
      <span className="flex items-center gap-3">
        <MenuIcon name={icon} />
        {label}
      </span>
      <span className="flex items-center gap-2 text-slate-500 group-hover:text-white">
        {badge ? <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-black">{badge}</span> : null}
        <span>›</span>
      </span>
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

function ThemeToggleButton({
  compact = false,
  onToggle,
  themeMode,
}: {
  compact?: boolean;
  onToggle: () => void;
  themeMode: "dark" | "light";
}) {
  const isLight = themeMode === "light";

  return (
    <button
      data-theme-toggle
      aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      title={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      className={`inline-flex size-11 items-center justify-center rounded-full border transition ${
        isLight
          ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
          : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
      } ${compact ? "md:size-12" : ""}`}
      style={isLight ? { borderColor: "rgba(15, 23, 42, 0.12)" } : undefined}
      type="button"
      onClick={onToggle}
    >
      <ThemeGlyph mode={themeMode} />
    </button>
  );
}

function ThemeGlyph({ mode }: { mode: "dark" | "light" }) {
  const isLight = mode === "light";

  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      {isLight ? (
        <>
          <circle cx="12" cy="12" r="4.5" fill="#0f172a" />
          <g stroke="#0f172a" strokeLinecap="round" strokeWidth="2">
            <path d="M12 2.75v2.5" />
            <path d="M12 18.75v2.5" />
            <path d="M2.75 12h2.5" />
            <path d="M18.75 12h2.5" />
            <path d="m5.45 5.45 1.77 1.77" />
            <path d="m16.78 16.78 1.77 1.77" />
            <path d="m18.55 5.45-1.77 1.77" />
            <path d="m7.22 16.78-1.77 1.77" />
          </g>
        </>
      ) : (
        <path
          d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"
          fill="#f8fafc"
        />
      )}
    </svg>
  );
}

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    activity: <path d="M4 16h3l2-8 4 12 2-7h5" />,
    message: <path d="M4 5h16v11H7l-3 3z" />,
    clipboard: (
      <>
        <path d="M9 4h6l1 2h3v15H5V6h3z" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
      </>
    ),
    chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7" />,
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M6 6 18 18" />
        <path d="M18 6 6 18" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M8 8h8M8 12h2m4 0h2M8 16h2m4 0h2" />
      </>
    ),
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    box: <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5z" />,
    wallet: <path d="M3 7h18v13H3zM16 12h3M5 7V5a2 2 0 0 1 2-2h10v4" />,
    lock: <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />,
    settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v3m0 13v3m9.5-9.5h-3m-13 0h-3m16.02-6.52-2.12 2.12M7.6 16.4l-2.12 2.12m13.04 0-2.12-2.12M7.6 7.6 5.48 5.48" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07-1.41 1.41M8.34 15.66l-1.41 1.41m0-11.31-1.41-1.41m10.48 10.48 1.41 1.41" />
      </>
    ),
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    logout: <path d="M10 17l5-5-5-5m5 5H3m7 9h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-8" />,
  };

  return (
    <svg aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name] ?? paths.home}
    </svg>
  );
}
