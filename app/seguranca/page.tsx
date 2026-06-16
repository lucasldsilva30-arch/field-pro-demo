"use client";

import { ErpShell } from "@/components/erp-shell";

export default function SegurancaPage() {
  return (
    <ErpShell active="seguranca">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-black p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-yellow-500">Seguranca</p>
          <h1 className="mt-2 text-3xl font-black text-white">Painel de acesso em modo demonstracao</h1>
          <p className="mt-2 text-sm text-slate-400">
            A redefinicao de senha foi desativada para esta versao de apresentacao.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-black p-6">
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-4 text-sm text-yellow-200">
            Esta aba esta disponivel apenas para visualizacao. Nenhuma credencial pode ser alterada na demo.
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoBlock label="Login" value="Desativado" />
            <InfoBlock label="Troca de senha" value="Bloqueada" />
            <InfoBlock label="Perfil" value="Somente leitura" />
          </div>
        </section>
      </section>
    </ErpShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
