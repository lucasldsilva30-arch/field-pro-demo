"use client";

import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions } from "@/components/module-spreadsheet-actions";
import { useErpData } from "@/hooks/use-erp-data";

const sampleMessage = [
  "SP: 00000",
  "Cabo: Exemplo demonstrativo",
  "Local: Base de apresentacao",
  "Status: Em analise",
  "Equipe: Time demonstracao",
  "Materiais: Item A, Item B",
].join("\n");

const sampleJson = {
  sp: "00000",
  cabo: "Exemplo demonstrativo",
  local: "Base de apresentacao",
  status: "Em analise",
  equipe: "Time demonstracao",
  materiais: ["Item A", "Item B"],
};

export default function OperacaoPage() {
  const { dataByCompany, empresaAtiva } = useErpData();

  return (
    <ErpShell active="operacao">
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Operacao</h1>
          <p className="mt-2 text-slate-400">
            Esta tela demonstra como o ERP organiza mensagens operacionais, sem permitir novos lancamentos.
          </p>
        </div>

        <ModuleSpreadsheetActions
          description="Durante a demonstracao, a importacao e a exportacao de planilhas ficam desativadas."
          empresa={empresaAtiva}
          moduleKey="operacao"
          moduleLabel="Operacao"
          rows={dataByCompany.production}
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
            <h2 className="text-lg font-bold text-white">Exemplo de mensagem recebida</h2>
            <p className="mt-2 text-sm text-slate-400">
              O conteudo abaixo e apenas ilustrativo para mostrar o fluxo da operacao.
            </p>
            <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black p-4 text-sm leading-6 text-slate-200">
              {sampleMessage}
            </pre>
          </section>

          <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
            <h2 className="text-lg font-bold text-white">Preview estruturado</h2>
            <p className="mt-2 text-sm text-slate-400">
              Exemplo de como a mensagem seria convertida em dados organizados.
            </p>
            <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black p-4 text-sm leading-6 text-emerald-300">
              {JSON.stringify(sampleJson, null, 2)}
            </pre>
          </section>
        </div>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold text-white">Catalogo Conecta</h2>
          <p className="mt-2 text-sm text-slate-400">
            O catalogo foi ocultado nesta demonstracao para nao exibir nenhuma regra operacional interna.
          </p>

          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-10 text-center text-sm text-slate-500">
            Nenhum codigo operacional exibido na demo.
          </div>
        </section>

        <section className="rounded-xl border border-yellow-950/70 bg-zinc-950 p-6">
          <h2 className="text-lg font-bold text-white">Controle de producao</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3">SP</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Conecta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataByCompany.production.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                      Nenhum lancamento exibido nesta demonstracao.
                    </td>
                  </tr>
                ) : (
                  dataByCompany.production.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-bold text-yellow-300">{record.sp}</td>
                      <td className="px-4 py-3">{record.equipe}</td>
                      <td className="px-4 py-3">{record.status}</td>
                      <td className="px-4 py-3">{record.conectaCode}</td>
                      <td className="px-4 py-3">{record.launchedConecta ? "Lancado" : "Pendente"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}
