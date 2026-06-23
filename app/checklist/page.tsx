"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { useErpData } from "@/hooks/use-erp-data";
import type { CompanyName } from "@/lib/types";

type ChecklistRecordItem = {
  itemId: string;
  deliveryId: string;
  epiId: string;
  epiName: string;
  quantity: number;
};

type ChecklistRecord = {
  deliveryId: string;
  companyId: string;
  companyName?: string;
  companyLegalName?: string;
  employeeId: string;
  employeeName: string;
  employeeFunction: string;
  employeeCargo: string;
  employeeSector: string;
  deliveryDate: string;
  nextDeadline: string;
  nextDate: string;
  rubric: string;
  signatureDate: string;
  submittedAt: string;
  inspectorName: string;
  signature: string;
  declarationAccept: boolean;
  pdfFileName: string;
  items: ChecklistRecordItem[];
};

const companyById: Record<string, CompanyName> = {
  ALPHA: "ALPHA TELECOM",
  BETA: "BETA TELECOM",
  GAMMA: "GAMMA TELECOM",
};

const legalCompanyById: Record<string, string> = {
  ALPHA: "ALPHA TELECOM",
  BETA: "BETA TELECOM",
  GAMMA: "GAMMA TELECOM",
};

function normalizeCompanyId(value?: string) {
  if (!value) return null;

  const normalized = value.trim().toUpperCase();

  if (normalized === "ALPHA" || normalized === "ALPHA TELECOM") {
    return "ALPHA";
  }

  if (normalized === "BETA" || normalized === "BETA TELECOM") {
    return "BETA";
  }

  if (normalized === "GAMMA" || normalized === "GAMMA TELECOM") {
    return "GAMMA";
  }

  return null;
}

function getCompanyName(record: ChecklistRecord) {
  return companyById[normalizeCompanyId(record.companyId) ?? ""] ?? record.companyName ?? record.companyId;
}

function getCompanyLegalName(record: ChecklistRecord) {
  return legalCompanyById[normalizeCompanyId(record.companyId) ?? ""] ?? record.companyLegalName ?? record.companyId;
}

function sanitizeFilePart(value: string) {
  const cleanValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleanValue || "sem_nome";
}

function formatDate(value: string) {
  if (!value) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
}

async function downloadChecklistPdf(record: ChecklistRecord) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  const legalCompanyName = getCompanyLegalName(record);
  const declarationLines = [
    `Por estar exclusivamente a serviço da ${legalCompanyName}, declaro ter recebido gratuitamente e é de minha inteira responsabilidade a guarda e conservação dos equipamentos de proteção individual constantes nesta ficha controle.`,
    "Assumo também a responsabilidade de devolvê-los integralmente ou parcialmente, quando solicitado, ou por ocasião de eventual rescisão de contrato, na data do respectivo aviso de qualquer das partes.",
    "Também estou ciente que, na eventualidade de danificar ou extraviar o equipamento por ato doloso ou culposo, estarei sujeito ao desconto do valor em meu salário, conforme parágrafo único do art. 462 da CLT.",
    "Também me comprometo a utilizá-los de forma correta e de acordo com as instruções de treinamento referentes ao uso correto, guarda, conservação e higienização dos EPI.",
    "Também estou ciente que a não utilização dos mesmos em minhas atividades profissionais, é ato faltoso e passível de punições legais e disciplinares de acordo com a Consolidação das leis do Trabalho (CLT) - Art. 158."
  ];

  const drawTextBlock = (text: string, startY: number, maxWidth: number, lineHeight = 4) => {
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, margin, startY);
    return startY + lines.length * lineHeight;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= 285) return;
    pdf.addPage();
    y = 14;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("FICHA DE CONTROLE DE ENTREGA DE EPI", pageWidth / 2, y, { align: "center" });
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Empresa: ${legalCompanyName}`, margin, y);
  pdf.text(`Fiscal: ${record.inspectorName || "-"}`, pageWidth / 2, y);
  y += 6;
  pdf.text(`Funcionario: ${record.employeeName || "-"}`, margin, y);
  pdf.text(`Cargo: ${record.employeeCargo || "-"}`, pageWidth / 2, y);
  y += 6;
  pdf.text(`Funcao: ${record.employeeFunction || "-"}`, margin, y);
  pdf.text(`Setor: ${record.employeeSector || "-"}`, pageWidth / 2, y);
  y += 6;
  pdf.text(`Data entrega: ${record.deliveryDate || "-"}`, margin, y);
  pdf.text(`Prazo proxima: ${record.nextDeadline || "-"}`, pageWidth / 2, y);
  y += 6;
  pdf.text(`Data proxima: ${record.nextDate || "-"}`, margin, y);
  pdf.text(`Data assinatura: ${record.signatureDate || "-"}`, pageWidth / 2, y);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.text("EPIs entregues", margin, y);
  y += 5;
  pdf.setDrawColor(180, 180, 180);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;

  pdf.setFontSize(8);
  record.items.forEach((item, index) => {
    ensureSpace(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${index + 1}. ${item.epiName}`, margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Qtd: ${item.quantity}`, 172, y);
    y += 6;
  });

  y += 4;
  ensureSpace(56);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Declaracao", margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  declarationLines.forEach((line) => {
    y = drawTextBlock(line, y, pageWidth - margin * 2, 4);
    y += 2;
  });

  ensureSpace(45);
  y += 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Assinatura do funcionario", margin, y);
  y += 4;

  if (record.signature) {
    pdf.addImage(record.signature, "PNG", margin, y, 78, 30);
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.text("Assinatura nao capturada.", margin, y + 10);
  }

  pdf.setFont("helvetica", "normal");
  pdf.text(`Data: ${record.signatureDate || "-"}`, pageWidth - margin - 45, y + 30);

  const fallbackFileName = `Checklist_${sanitizeFilePart(record.employeeName)}_${sanitizeFilePart(record.inspectorName)}_${(
    record.submittedAt || new Date().toISOString()
  ).slice(0, 10)}.pdf`;
  pdf.save(record.pdfFileName || fallbackFileName);
}

export default function ChecklistPage() {
  const { empresaAtiva } = useErpData();
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/checklists", { cache: "no-store", signal: options?.signal });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; records?: ChecklistRecord[]; error?: string }
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Nao foi possivel carregar os checklists.");
        }

        setRecords(payload.records ?? []);
      } catch (currentError) {
        if (currentError instanceof DOMException && currentError.name === "AbortError") {
          return;
        }

        setError(currentError instanceof Error ? currentError.message : "Falha ao carregar os checklists.");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadRecords({ signal: controller.signal });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadRecords]);

  const filteredRecords = useMemo(
    () => records.filter((record) => getCompanyName(record) === empresaAtiva),
    [empresaAtiva, records]
  );

  return (
    <ErpShell active="checklist">
      <section className="space-y-5">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-black p-5 shadow-2xl shadow-black/20 transition-colors dark:bg-black sm:flex-row sm:items-center sm:justify-between lg:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-yellow-500">Checklist EPI</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Documentos e fichas do checklist
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              O fiscal abre o portal separado, salva a ficha e o ERP lista aqui os registros da empresa ativa com download do PDF.
            </p>
          </div>

          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-black text-slate-500">
            Portal externo indisponível na demo
          </span>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard label="Empresa ativa" value={empresaAtiva} helper="filtro aplicado automaticamente" />
          <StatusCard label="Registros" value={String(filteredRecords.length)} helper="fichas encontradas nesta empresa" />
          <StatusCard
            label="Itens entregues"
            value={String(filteredRecords.reduce((sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0))}
            helper="soma das quantidades registradas"
          />
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500">Aba do sistema</p>
              <h2 className="mt-1 text-xl font-black text-white">Checklists salvos</h2>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-70"
              type="button"
              disabled={loading}
              onClick={() => void loadRecords()}
            >
              {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <RefreshIcon className="h-4 w-4" />}
              Atualizar lista
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-sm text-slate-400">Carregando registros do checklist...</div>
          ) : error ? (
            <div className="px-5 py-10 text-sm text-red-300">{error}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-400">Nenhum checklist encontrado para {empresaAtiva}.</div>
          ) : (
            <ChecklistRecordsTable records={filteredRecords} />
          )}
        </section>
      </section>
    </ErpShell>
  );
}

function ChecklistRecordsTable({ records }: { records: ChecklistRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] table-fixed text-left">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[20%]" />
          <col className="w-[16%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-5 py-3">Funcionário</th>
            <th className="px-5 py-3">Fiscal</th>
            <th className="px-5 py-3">Entrega</th>
            <th className="px-5 py-3 text-center">Itens</th>
            <th className="px-5 py-3">Arquivo</th>
            <th className="px-5 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const totalItems = record.items.reduce((sum, item) => sum + item.quantity, 0);
            const employeeDetails = `${record.employeeCargo || "-"} • ${record.employeeFunction || "-"}`;
            const fileName = record.pdfFileName || "Arquivo PDF";

            return (
              <tr className="border-t border-white/10 text-sm text-slate-200 transition hover:bg-white/[0.02]" key={record.deliveryId}>
                <td className="px-5 py-4 align-middle">
                  <p className="truncate font-bold text-white" title={record.employeeName || "-"}>
                    {record.employeeName || "-"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500" title={employeeDetails}>
                    {employeeDetails}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-500/90">
                    {getCompanyName(record)}
                  </p>
                </td>
                <td className="px-5 py-4 align-middle">
                  <p className="truncate" title={record.inspectorName || "-"}>
                    {record.inspectorName || "-"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500" title={formatDateTime(record.submittedAt)}>
                    {formatDateTime(record.submittedAt)}
                  </p>
                </td>
                <td className="px-5 py-4 align-middle">
                  <p className="whitespace-nowrap">{formatDate(record.deliveryDate)}</p>
                  <p className="mt-1 truncate text-xs text-slate-500" title={`Próxima: ${formatDate(record.nextDate)}`}>
                    Próxima: {formatDate(record.nextDate)}
                  </p>
                </td>
                <td className="px-5 py-4 text-center align-middle">
                  <p className="font-semibold">{record.items.length} itens</p>
                  <p className="mt-1 text-xs text-slate-500">{totalItems} unidades</p>
                </td>
                <td className="px-5 py-4 align-middle">
                  <div
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs text-slate-300"
                    title={fileName}
                  >
                    <PdfIcon className="h-4 w-4 shrink-0 text-red-400" />
                    <span className="truncate">{fileName}</span>
                  </div>
                </td>
                <td className="px-5 py-4 align-middle">
                  <div className="flex justify-end gap-2">
                    <button
                      className="whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.06]"
                      type="button"
                      onClick={() => void downloadChecklistPdf(record)}
                    >
                      Baixar PDF
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-black p-5 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </article>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h6l4 4v14H7V3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M13 3v5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M8.8 15.5h6.4M8.8 18h4.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 11a8 8 0 0 0-14.8-4.2M4 6.5V3m0 3.5h3.5M4 13a8 8 0 0 0 14.8 4.2M20 17.5V21m0-3.5h-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 1-8.5 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

