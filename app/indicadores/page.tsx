"use client";

import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions } from "@/components/module-spreadsheet-actions";
import { useErpData } from "@/hooks/use-erp-data";
import { calcularResumoERP, formatCurrency } from "@/lib/calculator";
import { companies, filterErpDataByCompany } from "@/lib/companies";
import type { CompanyName, ErpData } from "@/lib/types";

export default function IndicadoresPage() {
  const { data, dataByCompany, empresaAtiva } = useErpData();
  const resumoAtivo = calcularResumoERP(dataByCompany);
  const indicadoresPorEmpresa = companies.map((company) => buildCompanyIndicators(data, company));
  const equipes = Object.entries(resumoAtivo.productionByTeam).sort(([, a], [, b]) => b.points - a.points);
  const totalVr = dataByCompany.vr.reduce((sum, record) => sum + record.amount, 0);
  const funcionariosAtivos = dataByCompany.employees.filter((employee) => employee.situacao === "ATIVO").length;

  return (
    <ErpShell active="indicadores">
      <section className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Indicadores de desempenho</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Painel analítico por empresa</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Acompanhe produção, faturamento, despesas, saldo previsto, pendências e VR da empresa selecionada.
            </p>
          </div>
          <div className="rounded-2xl border border-yellow-950/70 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-slate-500">Empresa ativa</p>
            <p className="mt-1 text-lg font-extrabold text-yellow-400">{empresaAtiva}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <IndicatorCard label="Produção do dia" value={String(resumoAtivo.productionDay.length)} helper="registros hoje" />
          <IndicatorCard label="Produção do mês" value={String(resumoAtivo.productionMonth.length)} helper="registros no mês" />
          <IndicatorCard label="Faturamento" value={formatCurrency(resumoAtivo.faturamentoEstimado)} helper="estimado no mês" />
          <IndicatorCard label="Saldo previsto" value={formatCurrency(resumoAtivo.saldoFinalPrevisto)} helper={resumoAtivo.resultadoPrevisto} />
          <IndicatorCard label="A pagar" value={formatCurrency(resumoAtivo.aPagar)} helper="contas pendentes" />
          <IndicatorCard label="VR previsto" value={formatCurrency(totalVr)} helper={`${funcionariosAtivos} ativos`} />
        </section>

        <ModuleSpreadsheetActions
          description="Exporta e importa indicadores operacionais apenas da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="indicadores"
          moduleLabel="Indicadores"
          rows={[
            {
              empresa: empresaAtiva,
              producaoDia: resumoAtivo.productionDay.length,
              producaoMes: resumoAtivo.productionMonth.length,
              faturamento: resumoAtivo.faturamentoEstimado,
              saldoPrevisto: resumoAtivo.saldoFinalPrevisto,
              aPagar: resumoAtivo.aPagar,
              vrPrevisto: totalVr,
              funcionariosAtivos,
            },
            ...equipes.map(([equipe, info]) => ({
              empresa: empresaAtiva,
              equipe,
              quantidade: info.count,
              pontos: info.points,
              faturamento: info.revenue,
            })),
          ]}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {indicadoresPorEmpresa.map((company) => (
            <article
              className={`rounded-2xl border p-5 text-left ${
                company.name === empresaAtiva
                  ? "border-yellow-500/70 bg-yellow-500/10"
                  : "border-yellow-950/60 bg-zinc-950"
              }`}
              key={company.name}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-yellow-400">{company.name}</h2>
                <span className={company.saldo >= 0 ? "text-xs font-bold text-emerald-300" : "text-xs font-bold text-red-300"}>
                  {company.saldo >= 0 ? "positivo" : "negativo"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <MiniStat label="Produção" value={String(company.producao)} />
                <MiniStat label="Faturamento" value={formatCurrency(company.faturamento)} />
                <MiniStat label="Despesas" value={formatCurrency(company.despesas)} />
                <MiniStat label="Saldo previsto" value={formatCurrency(company.saldo)} tone={company.saldo >= 0 ? "good" : "bad"} />
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Produção por equipe">
            <div className="space-y-4">
              {equipes.length === 0 ? (
                <EmptyState text="Nenhuma produção registrada para esta empresa." />
              ) : (
                equipes.map(([team, info]) => (
                  <div key={team}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-200">{team}</span>
                      <span className="text-slate-400">{info.points} pontos • {formatCurrency(info.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${Math.min(info.points * 18, 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Status operacional">
            <div className="grid gap-3">
              <StatusLine label="OK" value={dataByCompany.production.filter((record) => record.status === "OK").length} />
              <StatusLine label="Pendente" value={dataByCompany.production.filter((record) => record.status === "Pendente").length} />
              <StatusLine label="Refazer" value={dataByCompany.production.filter((record) => record.status === "Refazer").length} />
              <StatusLine label="Pendente Conecta" value={resumoAtivo.pendingLaunches.length} />
            </div>
          </Panel>
        </section>
      </section>
    </ErpShell>
  );
}

function IndicatorCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-yellow-950/60 bg-zinc-950 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-3 block text-xl tracking-tight text-white">{value}</strong>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </article>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : "text-white";

  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <strong className="text-yellow-300">{value}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-white/10 bg-black px-4 py-6 text-center text-sm text-slate-500">{text}</p>;
}

function buildCompanyIndicators(data: ErpData, company: CompanyName) {
  const companyData = filterErpDataByCompany(data, company);
  const resumo = calcularResumoERP(companyData);

  return {
    name: company,
    producao: resumo.productionMonth.length,
    faturamento: resumo.faturamentoEstimado,
    despesas: resumo.despesas,
    saldo: resumo.saldoFinalPrevisto,
  };
}
