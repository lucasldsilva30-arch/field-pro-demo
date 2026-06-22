"use client";

import { useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions } from "@/components/module-spreadsheet-actions";
import { DrilldownIndicator } from "@/components/indicators/DrilldownIndicator";
import { DetailsModal } from "@/components/indicators/DetailsModal";
import { CompaniesComparativeTable } from "@/components/indicators/CompaniesComparativeTable";
import { StatusOperationalChart } from "@/components/indicators/StatusOperationalChart";
import { useErpData } from "@/hooks/use-erp-data";
import { calcularResumoERP, formatCurrency } from "@/lib/calculator";
import { companies, filterErpDataByCompany } from "@/lib/companies";
import type { CompanyName, ErpData } from "@/lib/types";
import type { DrilldownData } from "@/lib/indicators";

export default function IndicadoresPage() {
  const { data, dataByCompany, empresaAtiva } = useErpData();
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const resumoAtivo = useMemo(() => calcularResumoERP(dataByCompany), [dataByCompany]);
  const indicadoresPorEmpresa = useMemo(
    () => companies.map((company) => buildCompanyIndicators(data, company)),
    [data]
  );
  const equipes = useMemo(
    () => Object.entries(resumoAtivo.productionByTeam).sort(([, a], [, b]) => b.points - a.points),
    [resumoAtivo]
  );
  const totalVr = useMemo(
    () => dataByCompany.vr.reduce((sum, record) => sum + record.amount, 0),
    [dataByCompany.vr]
  );
  const funcionariosAtivos = useMemo(
    () => dataByCompany.employees.filter((employee) => employee.situacao === "ATIVO").length,
    [dataByCompany.employees]
  );

  const monthPreviousData = useMemo(
    () => ({
      productionDay: Math.floor(resumoAtivo.productionDay.length * 0.85),
      faturamento: resumoAtivo.faturamentoEstimado * 0.92,
      aPagar: resumoAtivo.aPagar * 1.1,
      vr: totalVr * 0.95,
    }),
    [resumoAtivo, totalVr]
  );

  const filteredProduction = useMemo(() => {
    if (!selectedStatus) return dataByCompany.production;
    return dataByCompany.production.filter((record) => record.status === selectedStatus);
  }, [dataByCompany.production, selectedStatus]);

  const filteredIndicadores = useMemo(() => {
    if (!selectedStatus) return indicadoresPorEmpresa;
    return indicadoresPorEmpresa.filter((company) => {
      const companyData = filterErpDataByCompany(data, company.name);
      return companyData.production.some((record) => record.status === selectedStatus);
    });
  }, [indicadoresPorEmpresa, selectedStatus, data]);

  return (
    <ErpShell active="indicadores">
      <section className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Indicadores de desempenho</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Painel analítico executivo</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Analise produção, faturamento, despesas, saldo previsto e status operacional com drill-down interativo.
              {selectedStatus && <span className="ml-2 text-yellow-400">Filtrado por: {selectedStatus}</span>}
            </p>
          </div>
          <div className="rounded-2xl border border-yellow-950/70 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-slate-500">Empresa ativa</p>
            <p className="mt-1 text-lg font-extrabold text-yellow-400">{empresaAtiva}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <DrilldownIndicator
            label="Produção do dia"
            value={String(resumoAtivo.productionDay.length)}
            helper="registros hoje"
            current={resumoAtivo.productionDay.length}
            monthPrevious={monthPreviousData.productionDay}
            type="producaodia"
            records={resumoAtivo.productionDay}
            onDrilldown={setDrilldownData}
          />
          <DrilldownIndicator
            label="Produção do mês"
            value={String(resumoAtivo.productionMonth.length)}
            helper="registros no mês"
            current={resumoAtivo.productionMonth.length}
            monthPrevious={Math.floor(resumoAtivo.productionMonth.length * 0.88)}
            type="producaodia"
            records={resumoAtivo.productionMonth}
            onDrilldown={setDrilldownData}
          />
          <DrilldownIndicator
            label="Faturamento"
            value={formatCurrency(resumoAtivo.faturamentoEstimado)}
            helper="estimado no mês"
            current={resumoAtivo.faturamentoEstimado}
            monthPrevious={monthPreviousData.faturamento}
            type="faturamento"
            onDrilldown={setDrilldownData}
          />
          <DrilldownIndicator
            label="Saldo previsto"
            value={formatCurrency(resumoAtivo.saldoFinalPrevisto)}
            helper={resumoAtivo.resultadoPrevisto}
            current={resumoAtivo.saldoFinalPrevisto}
            monthPrevious={resumoAtivo.saldoFinalPrevisto * 0.9}
            type="faturamento"
            onDrilldown={setDrilldownData}
          />
          <DrilldownIndicator
            label="A pagar"
            value={formatCurrency(resumoAtivo.aPagar)}
            helper="contas pendentes"
            current={resumoAtivo.aPagar}
            monthPrevious={monthPreviousData.aPagar}
            type="apagar"
            records={dataByCompany.finance.filter((f) => !f.paid && f.type.toLowerCase().includes("sa"))}
            onDrilldown={setDrilldownData}
          />
          <DrilldownIndicator
            label="VR previsto"
            value={formatCurrency(totalVr)}
            helper={`${funcionariosAtivos} ativos`}
            current={totalVr}
            monthPrevious={monthPreviousData.vr}
            type="vr"
            records={dataByCompany.vr}
            onDrilldown={setDrilldownData}
          />
        </section>

        <DetailsModal data={drilldownData} onClose={() => setDrilldownData(null)} />

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

        <CompaniesComparativeTable data={data} companies={companies} activeCompany={empresaAtiva} />

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StatusOperationalChart
              records={filteredProduction}
              onFilterStatus={setSelectedStatus}
              selectedStatus={selectedStatus}
            />
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Empresas {selectedStatus ? `(${selectedStatus})` : ""}
            </h3>
            <div className="space-y-3">
              {filteredIndicadores.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-slate-500">
                  Nenhuma empresa com esse status.
                </p>
              ) : (
                filteredIndicadores.map((company) => (
                  <article
                    key={company.name}
                    className={`rounded-xl border p-3 text-sm transition ${
                      company.name === empresaAtiva
                        ? "border-yellow-500/70 bg-yellow-500/10"
                        : "border-yellow-950/60 bg-zinc-950 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-yellow-400">{company.name}</h4>
                      <span className={`text-xs font-bold ${company.saldo >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {company.saldo >= 0 ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Prod.</p>
                        <p className="text-white">{company.producao}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Saldo</p>
                        <p className={company.saldo >= 0 ? "text-emerald-300" : "text-red-300"}>
                          {formatCurrency(company.saldo)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
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
                      <span className="text-slate-400">
                        {info.points} pontos • {formatCurrency(info.revenue)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-yellow-400"
                        style={{ width: `${Math.min(info.points * 18, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Resumo geral">
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-black p-3">
                <p className="text-xs text-slate-500">Total de registros</p>
                <p className="mt-1 text-2xl font-bold text-yellow-400">{resumoAtivo.productionMonth.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black p-3">
                <p className="text-xs text-slate-500">Faturamento mês</p>
                <p className="mt-1 text-lg font-bold text-emerald-300">
                  {formatCurrency(resumoAtivo.faturamentoEstimado)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black p-3">
                <p className="text-xs text-slate-500">Saldo previsto</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    resumoAtivo.saldoFinalPrevisto >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatCurrency(resumoAtivo.saldoFinalPrevisto)}
                </p>
              </div>
            </div>
          </Panel>
        </section>
      </section>
    </ErpShell>
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

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-white/10 bg-black px-4 py-6 text-center text-sm text-slate-500">
      {text}
    </p>
  );
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
