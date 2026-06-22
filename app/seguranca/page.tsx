import { ErpShell } from "@/components/erp-shell";

export default function SegurancaPage() {
  return (
    <ErpShell active="seguranca">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-black p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-yellow-500">Segurança</p>
          <h1 className="mt-2 text-3xl font-black text-white">Demonstração sem autenticação</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Esta versão pública não possui login, senha ou dados privados. Controles de acesso ficam disponíveis apenas na versão contratada.
          </p>
        </header>

        <article className="rounded-3xl border border-white/10 bg-black p-6">
          <p className="text-sm font-bold text-white">Modo somente demonstração</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Nenhuma credencial real é armazenada neste projeto e nenhuma senha pode ser alterada por esta tela.
          </p>
        </article>
      </section>
    </ErpShell>
  );
}
