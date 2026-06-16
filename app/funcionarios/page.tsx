"use client";

import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions } from "@/components/module-spreadsheet-actions";
import { useErpData } from "@/hooks/use-erp-data";

export default function FuncionariosPage() {
  const { dataByCompany, empresaAtiva } = useErpData();
  const employees = dataByCompany.employees;

  return (
    <ErpShell active="funcionarios">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">Painel de colaboradores</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Funcionarios por equipe</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Esta versao demonstra a organizacao visual da base de colaboradores, sem cadastro, importacao ou edicao.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 px-4 py-3 text-sm text-slate-300">
            <p className="font-bold text-white">Modo leitura</p>
            <p className="mt-1 text-xs text-slate-500">Dados de exemplo desativados na demonstracao.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard helper="Na empresa ativa" label="Total de funcionarios" value={String(employees.length)} />
          <SummaryCard helper="Somente visualizacao" label="Ativos" value="0" />
          <SummaryCard helper="Sem base carregada" label="Equipes" value="0" />
          <SummaryCard helper="Sem lancamentos" label="Em ferias" value="0" />
          <SummaryCard helper="Sem desligamentos exibidos" label="Desligados" value="0" />
        </section>

        <ModuleSpreadsheetActions
          description="A planilha de funcionarios fica bloqueada na demonstracao para impedir importacao, exportacao e cadastro."
          empresa={empresaAtiva}
          moduleKey="funcionarios"
          moduleLabel="Funcionarios"
          rows={employees}
        />

        <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30">
          <div className="border-b border-white/10 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">Cadastro</p>
            <h2 className="mt-2 text-xl font-bold text-white">Formulario demonstrativo</h2>
            <p className="mt-1 text-sm text-slate-400">
              O formulario foi mantido apenas como referencia visual e nao aceita inclusoes nesta versao.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-10 text-center text-sm text-slate-500">
            Cadastro de funcionarios desativado na demo.
          </div>
        </section>

        <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Lista de funcionarios</h2>
              <p className="mt-1 text-sm text-slate-400">
                Nenhum colaborador real e exibido nesta demonstracao.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-500">
              Busca indisponivel em modo demonstracao
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Funcionario</th>
                  <th className="px-4 py-4">Cargo / Funcao</th>
                  <th className="px-4 py-4">Departamento</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Admissao</th>
                  <th className="px-4 py-4">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    Nenhum funcionario carregado para a empresa {empresaAtiva}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ErpShell>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-3 block text-xl tracking-tight text-white">{value}</strong>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </article>
  );
}
