"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { DatePickerField } from "@/components/date-picker-field";
import { formatDateBr, parseDateLike } from "@/lib/date";
import { employeeColumns, type EmployeeColumnKey } from "@/lib/employees";
import type { EmployeeStatus } from "@/lib/types";

type EmployeeFormValues = Record<EmployeeColumnKey, string>;
type EmployeeFormTab = "cadastrais" | "documentacao" | "financeiro" | "historico";
type ComplianceTone = "green" | "yellow" | "red";

const employeeStatusOptions: EmployeeStatus[] = ["ATIVO", "FERIAS", "ATESTADO", "AFASTADO", "INATIVO"];

const yesNoFields = new Set<EmployeeColumnKey>([
  "clt",
  "cracha",
  "cartaoVrVa",
  "nrs1035",
  "possuiNrs",
  "nrsVencido",
  "feriasVencidas",
  "podeTirarFerias",
]);

const dateFields = new Set<EmployeeColumnKey>(["admissao", "dataNascimento", "vencimentoContrato45", "vencimentoContrato90", "vencimentoNrs"]);
const moneyFields = new Set<EmployeeColumnKey>(["vrDia", "vt", "salario"]);

const tabs: Array<{ key: EmployeeFormTab; label: string; description: string }> = [
  { key: "cadastrais", label: "Dados Cadastrais", description: "Identificação, equipe e vínculo." },
  { key: "documentacao", label: "Documentação", description: "Documentos, contratos e alertas." },
  { key: "financeiro", label: "Financeiro e VR", description: "Salário, VR, VT e CLT." },
  { key: "historico", label: "Histórico", description: "Resumo consolidado do cadastro." },
];

const fieldGroups: Record<Exclude<EmployeeFormTab, "historico">, EmployeeColumnKey[]> = {
  cadastrais: ["re", "situacao", "funcionario", "cargo", "seguimento", "equipe", "projeto", "carro", "placa", "enderecoCompleto"],
  documentacao: [
    "cpf",
    "rg",
    "nomeMae",
    "nomePai",
    "dataNascimento",
    "admissao",
    "eSocial",
    "cracha",
    "cartaoVrVa",
    "vencimentoContrato45",
    "vencimentoContrato90",
    "nrs1035",
    "vencimentoNrs",
    "possuiNrs",
    "nrsVencido",
    "feriasVencidas",
    "podeTirarFerias",
  ],
  financeiro: ["vrDia", "vt", "salario", "clt"],
};

type EmployeeTabbedFormProps = {
  companyName: string;
  draft: EmployeeFormValues;
  onChange: (key: EmployeeColumnKey, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  title: string;
  subtitle: string;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
};

export function EmployeeTabbedForm({
  companyName,
  draft,
  onChange,
  onSubmit,
  submitLabel,
  title,
  subtitle,
  secondaryLabel,
  onSecondaryAction,
}: EmployeeTabbedFormProps) {
  const [activeTab, setActiveTab] = useState<EmployeeFormTab>("cadastrais");
  const columnByKey = useMemo(
    () => new Map(employeeColumns.map((column) => [column.key, column.label])),
    [],
  );
  const compliance = useMemo(() => buildComplianceStatus(draft), [draft]);

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <header className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-500">Funcionário • {companyName}</p>
        <h3 className="mt-2 text-2xl font-extrabold text-white">{title}</h3>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{subtitle}</p>
      </header>

      <nav className="grid gap-3 lg:grid-cols-4">
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <button
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-200"
                  : "border-white/10 bg-black text-slate-300 hover:border-yellow-500/40 hover:bg-yellow-500/5 hover:text-yellow-200"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.12em]">{tab.label}</p>
              <p className="mt-1 text-xs text-slate-400">{tab.description}</p>
            </button>
          );
        })}
      </nav>

      {activeTab === "historico" ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-black p-5">
            <h4 className="text-lg font-bold text-white">Histórico consolidado</h4>
            <p className="mt-1 text-sm text-slate-400">
              Esta visão reúne os principais marcos do cadastro sem espalhar informações em telas diferentes.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Admissão", formatDateBr(draft.admissao)],
                ["Nascimento", formatDateBr(draft.dataNascimento)],
                ["Contrato 45 dias", formatDateBr(draft.vencimentoContrato45)],
                ["Contrato 90 dias", formatDateBr(draft.vencimentoContrato90)],
                ["Vencimento NRS", formatDateBr(draft.vencimentoNrs)],
                ["Status", draft.situacao],
              ].map(([label, value]) => (
                <article className="rounded-xl border border-white/10 bg-zinc-950 p-3" key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value || "Não informado"}</p>
                </article>
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              compliance.tone === "red"
                ? "border-red-500/30 bg-red-500/10"
                : compliance.tone === "yellow"
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Status de conformidade</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                  compliance.tone === "red"
                    ? "bg-red-500 text-white"
                    : compliance.tone === "yellow"
                      ? "bg-yellow-500 text-black"
                      : "bg-emerald-500 text-black"
                }`}
              >
                {compliance.label}
              </span>
              <p className="text-sm text-slate-200">{compliance.summary}</p>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-100">
              {compliance.items.map((item) => (
                <li className="flex items-start gap-2 rounded-xl bg-black/20 px-3 py-2" key={item}>
                  <span className="mt-1 size-2 rounded-full bg-current" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-black p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(fieldGroups[activeTab] ?? []).map((key) => (
              <EmployeeField
                columnLabel={columnByKey.get(key) ?? key}
                draft={draft}
                fieldKey={key}
                key={key}
                onChange={onChange}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          <span className="font-semibold text-white">Salvamento único:</span> todas as abas vão para a mesma requisição ao banco.
        </div>

        <div className="flex flex-wrap gap-3">
          {onSecondaryAction ? (
            <button
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-200"
              onClick={onSecondaryAction}
              type="button"
            >
              {secondaryLabel ?? "Cancelar"}
            </button>
          ) : null}

          <button
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-extrabold text-black transition hover:bg-yellow-400"
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </footer>
    </form>
  );
}

function EmployeeField({
  columnLabel,
  draft,
  fieldKey,
  onChange,
}: {
  columnLabel: string;
  draft: EmployeeFormValues;
  fieldKey: EmployeeColumnKey;
  onChange: (key: EmployeeColumnKey, value: string) => void;
}) {
  const value = draft[fieldKey];

  if (fieldKey === "situacao") {
    return (
      <FieldShell label={columnLabel}>
        <select
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
          onChange={(event) => onChange(fieldKey, event.target.value)}
          value={value}
        >
          {employeeStatusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option)}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (yesNoFields.has(fieldKey)) {
    return (
      <FieldShell label={columnLabel}>
        <select
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
          onChange={(event) => onChange(fieldKey, event.target.value)}
          value={value}
        >
          <option value="">Selecione</option>
          <option value="SIM">SIM</option>
          <option value="NÃO">NÃO</option>
          <option value="N/A">N/A</option>
        </select>
      </FieldShell>
    );
  }

  if (dateFields.has(fieldKey)) {
    return (
      <FieldShell label={columnLabel}>
        <DatePickerField
          label=""
          onChange={(nextValue) => onChange(fieldKey, nextValue)}
          placeholder="Selecionar data"
          value={value}
        />
      </FieldShell>
    );
  }

  if (moneyFields.has(fieldKey)) {
    return (
      <FieldShell label={columnLabel}>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
          inputMode="decimal"
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder={moneyPlaceholder(fieldKey)}
          value={value}
        />
      </FieldShell>
    );
  }

  return (
    <FieldShell className={fieldKey === "enderecoCompleto" ? "md:col-span-2 xl:col-span-2" : ""} label={columnLabel}>
      <input
        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
        onChange={(event) => onChange(fieldKey, event.target.value)}
        placeholder={placeholderForKey(fieldKey)}
        value={value}
      />
    </FieldShell>
  );
}

function FieldShell({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function buildComplianceStatus(draft: EmployeeFormValues): { tone: ComplianceTone; label: string; summary: string; items: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  const checks = [
    { label: "Contrato 45 dias", value: draft.vencimentoContrato45 },
    { label: "Contrato 90 dias", value: draft.vencimentoContrato90 },
    { label: "Vencimento NRS", value: draft.vencimentoNrs },
  ];

  for (const check of checks) {
    const parsed = parseDateLike(check.value);

    if (!parsed) {
      warnings.push(`${check.label} ainda não foi preenchido.`);
      continue;
    }

    const diffDays = diffInDays(parsed, new Date());
    if (diffDays < 0) {
      issues.push(`${check.label} vencido há ${Math.abs(diffDays)} dia(s).`);
    } else if (diffDays <= 30) {
      warnings.push(`${check.label} vence em ${diffDays} dia(s).`);
    }
  }

  if (normalizeYesNo(draft.nrsVencido) === "SIM") {
    issues.push("O colaborador está com NRS vencido.");
  }

  if (normalizeYesNo(draft.feriasVencidas) === "SIM") {
    issues.push("Existem férias vencidas registradas.");
  }

  if (!draft.cpf.trim()) warnings.push("CPF não preenchido.");
  if (!draft.cracha.trim()) warnings.push("Crachá não informado.");
  if (!draft.cartaoVrVa.trim()) warnings.push("Cartão VR/VA não informado.");

  if (issues.length > 0) {
    return {
      tone: "red",
      label: "Atenção crítica",
      summary: "Há pendências que pedem revisão imediata.",
      items: [...issues, ...warnings].slice(0, 6),
    };
  }

  if (warnings.length > 0) {
    return {
      tone: "yellow",
      label: "Revisar",
      summary: "Alguns documentos precisam de atenção próxima.",
      items: warnings.slice(0, 6),
    };
  }

  return {
    tone: "green",
    label: "Conforme",
    summary: "Documentação principal está organizada no cadastro.",
    items: [
      "Contrato e documentos principais sem alerta imediato.",
      "Cadastro pronto para acompanhamento operacional e financeiro.",
    ],
  };
}

function normalizeYesNo(value: string) {
  return value.trim().toUpperCase();
}

function diffInDays(first: Date, second: Date) {
  const firstTime = new Date(first.getFullYear(), first.getMonth(), first.getDate()).getTime();
  const secondTime = new Date(second.getFullYear(), second.getMonth(), second.getDate()).getTime();
  return Math.round((firstTime - secondTime) / (1000 * 60 * 60 * 24));
}

function moneyPlaceholder(fieldKey: EmployeeColumnKey) {
  if (fieldKey === "vrDia") return "Ex: 32,63";
  if (fieldKey === "vt") return "Ex: 0,00";
  return "Ex: R$ 2.009,11";
}

function placeholderForKey(key: EmployeeColumnKey) {
  const placeholders: Partial<Record<EmployeeColumnKey, string>> = {
    re: "Ex: 33",
    funcionario: "Nome completo",
    cargo: "Ex: OFICIAL DE REDE",
    seguimento: "Ex: FTTA",
    equipe: "Ex: EQUIPE ALPHA",
    projeto: "Ex: PROJETO DEMO",
    carro: "Ex: GOL",
    placa: "Ex: ABC1D23",
    cpf: "000.000.000-00",
    rg: "00.000.000-0",
    nomeMae: "Nome da mãe",
    nomePai: "Nome do pai",
    enderecoCompleto: "Rua, número, complemento, bairro, cidade, CEP",
    eSocial: "Ex: BJ60",
  };

  return placeholders[key] ?? "";
}

function statusLabel(status: EmployeeStatus) {
  const labels: Record<EmployeeStatus, string> = {
    ATIVO: "Ativo",
    FERIAS: "Férias",
    ATESTADO: "Atestado",
    AFASTADO: "Afastado",
    INATIVO: "Desligado",
  };

  return labels[status];
}
