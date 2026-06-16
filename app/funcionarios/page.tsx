"use client";

import { useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { EMPLOYEE_SHEET_NAME, employeeColumns, normalizeEmployee, type EmployeeColumnKey } from "@/lib/employees";
import type { Employee, EmployeeStatus } from "@/lib/types";

type EmployeesApiResponse = {
  employees?: Employee[];
  error?: string;
  source?: "google-sheets" | "fallback";
  updatedAt?: string;
};

type StatusFilter = "TODOS" | EmployeeStatus;

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

const employeeStatusOptions: EmployeeStatus[] = ["ATIVO", "FERIAS", "ATESTADO", "AFASTADO", "INATIVO"];

export default function FuncionariosPage() {
  const { data, empresaAtiva, addEmployee, updateEmployee } = useErpData();
  const [sheetEmployees, setSheetEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("Carregando funcionários do Google Sheets...");
  const [formFeedback, setFormFeedback] = useState("");
  const [employeeForm, setEmployeeForm] = useState<Record<EmployeeColumnKey, string>>(() => createEmptyEmployeeForm());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [source, setSource] = useState<"google-sheets" | "fallback">("fallback");
  const [updatedAt, setUpdatedAt] = useState("");
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fallbackEmployees = useMemo(
    () => data.employees.map((employee, index) => normalizeEmployee(employee, index)),
    [data.employees],
  );

  const employees = useMemo(() => {
    const sourceEmployees = sheetEmployees ?? fallbackEmployees;

    return sourceEmployees.filter((employee) => employee.empresa === empresaAtiva);
  }, [empresaAtiva, fallbackEmployees, sheetEmployees]);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      try {
        const response = await fetch("/api/funcionarios", { cache: "no-store" });
        const payload = (await response.json()) as EmployeesApiResponse;

        if (!response.ok || !payload.employees?.length) {
          throw new Error(payload.error ?? "Não foi possível carregar a planilha.");
        }

        if (active) {
          setSheetEmployees(payload.employees.map((employee, index) => normalizeEmployee(employee, index)));
          setSource("google-sheets");
          setUpdatedAt(payload.updatedAt ?? "");
          setFeedback(`Dados carregados da aba ${EMPLOYEE_SHEET_NAME}.`);
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : "Falha ao carregar Google Sheets.";
          setSource("fallback");
          setFeedback(`${message} Exibindo dados locais de validação.`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesStatus = statusFilter === "TODOS" || employee.situacao === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [employee.re, employee.funcionario, employee.cargo, employee.seguimento, employee.equipe, employee.projeto]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [employees, search, statusFilter]);

  const activeEmployees = employees.filter((employee) => employee.situacao === "ATIVO").length;
  const inactiveEmployees = employees.filter((employee) => employee.situacao === "INATIVO").length;
  const teamCount = new Set(employees.map((employee) => employee.equipe || "SEM EQUIPE")).size;
  const vacationReady = employees.filter((employee) => employee.podeTirarFerias.toUpperCase() === "SIM").length;

  function handleToggleStatus(employee: Employee) {
    const updatedEmployee: Employee = {
      ...employee,
      situacao: employee.situacao === "ATIVO" ? "INATIVO" : "ATIVO",
    };

    if (sheetEmployees) {
      setSheetEmployees((current) =>
        current?.map((item) => (item.id === employee.id ? updatedEmployee : item)) ?? current,
      );
    } else {
      updateEmployee(updatedEmployee);
    }
  }

  function handleEmployeeFieldChange(key: EmployeeColumnKey, value: string) {
    setEmployeeForm((current) => ({ ...current, [key]: value }));
  }

  function handleImportEmployees(rows: SpreadsheetRow[]) {
    const importedEmployees = rows
      .map((row, index) =>
        normalizeEmployee(
          {
            id: getImportedValue(row, ["id"]) || createId("emp-import"),
            empresa: empresaAtiva,
            re: getImportedValue(row, ["re", "RE"]),
            situacao: getImportedValue(row, ["situacao", "Situação", "Situacao", "status"]) as EmployeeStatus,
            funcionario: getImportedValue(row, ["funcionario", "Funcionário", "Funcionario", "nome", "Nome"]),
            cargo: getImportedValue(row, ["cargo", "Cargo"]),
            seguimento: getImportedValue(row, ["seguimento", "Seguimento", "segmento", "Segmento"]),
            equipe: getImportedValue(row, ["equipe", "EQUIPE", "Equipe"]),
            projeto: getImportedValue(row, ["projeto", "Projeto"]),
            vrDia: getImportedValue(row, ["vrDia", "R$ VR DIA", "R$ VR Dia", "VR DIA"]),
            vt: getImportedValue(row, ["vt", "R$ VT", "VT"]),
            salario: getImportedValue(row, ["salario", "SALARIO", "Salário", "Salario"]),
            clt: getImportedValue(row, ["clt", "CLT"]),
            carro: getImportedValue(row, ["carro", "Carro"]),
            placa: getImportedValue(row, ["placa", "Placa"]),
            admissao: getImportedValue(row, ["admissao", "Admissao", "Admissão"]),
            dataAdmissao: getImportedValue(row, ["dataAdmissao", "Admissao", "Admissão"]),
            vencimentoContrato45: getImportedValue(row, ["vencimentoContrato45", "VENCIMENTO CONTRATO 45 DIAS", "Contrato 45 dias"]),
            vencimentoContrato90: getImportedValue(row, ["vencimentoContrato90", "VENCIMENTO CONTRATO 90 DIAS", "Contrato 90 dias"]),
            eSocial: getImportedValue(row, ["eSocial", "E_social", "E-social"]),
            cracha: getImportedValue(row, ["cracha", "Cracha", "Crachá"]),
            cartaoVrVa: getImportedValue(row, ["cartaoVrVa", "CARTÃO VR/VA", "Cartão VR/VA"]),
            cpf: getImportedValue(row, ["cpf", "CPF"]),
            rg: getImportedValue(row, ["rg", "RG"]),
            nomeMae: getImportedValue(row, ["nomeMae", "NOME MAE", "Nome mãe"]),
            nomePai: getImportedValue(row, ["nomePai", "NOME PAI", "Nome pai"]),
            dataNascimento: getImportedValue(row, ["dataNascimento", "DATA NASCIMENTO", "Nascimento"]),
            enderecoCompleto: getImportedValue(row, ["enderecoCompleto", "ENDEREÇO COMPLETO", "Endereco completo"]),
            nrs1035: getImportedValue(row, ["nrs1035", "NRS_10_35", "NRS 10/35"]),
            vencimentoNrs: getImportedValue(row, ["vencimentoNrs", "Vencimento_NRS", "Vencimento NRS"]),
            possuiNrs: getImportedValue(row, ["possuiNrs", "Possui NRS?", "Possui NRS"]),
            nrsVencido: getImportedValue(row, ["nrsVencido", "NRS Vencido?", "NRS vencido?"]),
            feriasVencidas: getImportedValue(row, ["feriasVencidas", "Férias Vencidas?", "Ferias vencidas?"]),
            podeTirarFerias: getImportedValue(row, ["podeTirarFerias", "Já Pode Tirar Férias?", "Pode tirar férias?"]),
          },
          index,
        ),
      )
      .filter((employee) => employee.funcionario);

    if (importedEmployees.length === 0) {
      setFeedback("A planilha foi enviada, mas nenhuma linha com funcionário foi identificada.");
      return;
    }

    setSheetEmployees((current) => mergeEmployeesByKey(importedEmployees, current ?? fallbackEmployees));
    importedEmployees.forEach((employee) => {
      const alreadyExists = fallbackEmployees.some((currentEmployee) => getEmployeeMergeKey(currentEmployee) === getEmployeeMergeKey(employee));

      if (!alreadyExists) {
        addEmployee(employee);
      }
    });
    setSearch("");
    setStatusFilter("TODOS");
    setSource("google-sheets");
    setUpdatedAt(new Date().toISOString());
    setFeedback(`${importedEmployees.length} funcionários importados e exibidos em ${empresaAtiva}.`);
  }

  async function handleRegisterEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeeForm.re.trim() || !employeeForm.funcionario.trim() || !employeeForm.equipe.trim()) {
      setFormFeedback("Preencha pelo menos RE, Funcionário e EQUIPE para cadastrar.");
      return;
    }

    const newEmployee = normalizeEmployee(
      {
        id: createId("emp"),
        ...employeeForm,
        empresa: empresaAtiva,
        situacao: employeeForm.situacao as EmployeeStatus,
        nome: employeeForm.funcionario,
        dataAdmissao: employeeForm.admissao,
      },
      employees.length,
    );

    addEmployee(newEmployee);
    setSheetEmployees((current) => [newEmployee, ...(current ?? [])]);
    setEmployeeForm(createEmptyEmployeeForm());
    setFormFeedback(`Funcionário cadastrado em ${empresaAtiva}. Sincronizando...`);
    setSearch("");
    setStatusFilter("TODOS");

    try {
      const response = await fetch("/api/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string; persisted?: boolean } | null;

      setFormFeedback(
        payload?.persisted
          ? `Funcionário cadastrado em ${empresaAtiva} e enviado ao Google Sheets.`
          : (payload?.message ?? `Funcionário cadastrado em ${empresaAtiva} e salvo localmente neste navegador.`),
      );
    } catch {
      setFormFeedback(`Funcionário cadastrado em ${empresaAtiva}, mas a sincronização com Sheets falhou.`);
    }
  }

  return (
    <ErpShell active="funcionarios">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
              Cadastro Funcionários 2026
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Funcionários por equipe</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Visual no mesmo padrão da planilha: situação, funcionário, cargo, seguimento, equipe, projeto,
              benefícios, contrato, documentação e controles de NRS/férias.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 px-4 py-3 text-sm text-slate-300">
            <p className="font-bold text-white">{source === "google-sheets" ? "Google Sheets" : "Dados locais"}</p>
            <p className="mt-1 text-xs text-slate-500">
              {updatedAt ? `Atualizado: ${formatDateTime(updatedAt)}` : EMPLOYEE_SHEET_NAME}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard helper="Na empresa ativa" icon="👥" label="Total de funcionários" tone="green" value={employees.length.toString()} />
          <SummaryCard helper={`${percent(activeEmployees, employees.length)}% do total`} icon="👤" label="Ativos" tone="blue" value={activeEmployees.toString()} />
          <SummaryCard helper={`${teamCount} equipes`} icon="🏢" label="Equipes" tone="yellow" value={teamCount.toString()} />
          <SummaryCard helper="Podem tirar férias" icon="🏖" label="Em férias" tone="purple" value={vacationReady.toString()} />
          <SummaryCard helper={`${percent(inactiveEmployees, employees.length)}% do total`} icon="🚫" label="Desligados" tone="red" value={inactiveEmployees.toString()} />
        </section>

        <ModuleSpreadsheetActions
          description="Exporta e importa somente a planilha de funcionários da empresa ativa."
          empresa={empresaAtiva}
          moduleKey="funcionarios"
          moduleLabel="Funcionários"
          onImportRows={handleImportEmployees}
          rows={employees}
        />

        <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30">
          <div className="border-b border-white/10 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">Cadastrar</p>
            <h2 className="mt-2 text-xl font-bold text-white">Novo funcionário</h2>
            <p className="mt-1 text-sm text-slate-400">
              Formulário completo com os mesmos campos e ordem da planilha de cadastro para {empresaAtiva}.
            </p>
          </div>

          <form className="mt-5 space-y-5" onSubmit={handleRegisterEmployee}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {employeeColumns.map((column) => (
                <label className={column.key === "enderecoCompleto" ? "md:col-span-2 xl:col-span-4" : ""} key={column.key}>
                  <span className="text-sm font-semibold text-slate-300">{column.label}</span>
                  {column.key === "situacao" ? (
                    <select
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
                      onChange={(event) => handleEmployeeFieldChange(column.key, event.target.value)}
                      value={employeeForm[column.key]}
                    >
                      {employeeStatusOptions.map((option) => (
                        <option key={option} value={option}>{statusLabel(option)}</option>
                      ))}
                    </select>
                  ) : yesNoFields.has(column.key) ? (
                    <select
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
                      onChange={(event) => handleEmployeeFieldChange(column.key, event.target.value)}
                      value={employeeForm[column.key]}
                    >
                      <option value="">Selecione</option>
                      <option value="SIM">SIM</option>
                      <option value="NÃO">NÃO</option>
                      <option value="N/A">N/A</option>
                    </select>
                  ) : (
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
                      onChange={(event) => handleEmployeeFieldChange(column.key, event.target.value)}
                      placeholder={getEmployeePlaceholder(column.key)}
                      value={employeeForm[column.key]}
                    />
                  )}
                </label>
              ))}
            </div>

            {formFeedback ? (
              <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                {formFeedback}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-extrabold text-black transition hover:bg-yellow-400"
                type="submit"
              >
                Cadastrar funcionário
              </button>
              <button
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-300"
                onClick={() => {
                  setEmployeeForm(createEmptyEmployeeForm());
                  setFormFeedback("");
                }}
                type="button"
              >
                Limpar formulário
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
            <label>
              <span className="text-sm font-semibold text-slate-300">Buscar na planilha</span>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-500/60"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="RE, funcionário, cargo, seguimento, equipe ou projeto..."
                value={search}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-300">Situação</span>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/60"
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                value={statusFilter}
              >
                <option value="TODOS">Todos</option>
                {employeeStatusOptions.map((option) => (
                  <option key={option} value={option}>{statusLabel(option)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["TODOS", ...employeeStatusOptions] as StatusFilter[]).map((status) => {
              const selected = statusFilter === status;

              return (
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selected
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-black text-slate-300 hover:border-yellow-500/50 hover:text-yellow-300"
                  }`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status === "TODOS" ? "Todos" : statusLabel(status)}
                </button>
              );
            })}
          </div>

          <p
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
              source === "google-sheets"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-200"
            }`}
          >
            {loading ? "Carregando..." : feedback}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black p-5 shadow-2xl shadow-black/30">
          <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-white">Lista de funcionários</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.08em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">Funcionário</th>
                  <th className="px-4 py-4">Cargo / Função</th>
                  <th className="px-4 py-4">Departamento</th>
                  <th className="px-4 py-4">Projeto</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Admissão</th>
                  <th className="px-4 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      Nenhum funcionário encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr className="transition hover:bg-white/[0.03]" key={employee.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar name={employee.funcionario} />
                          <div>
                            <p className="font-extrabold text-white">{employee.funcionario}</p>
                            <p className="mt-1 text-xs text-slate-500">#{employee.re || employee.cpf || "SEM-RE"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {employee.cargo || "Não informado"} <RolePill value={employee.seguimento} />
                      </td>
                      <td className="px-4 py-4 text-slate-300">{employee.equipe || "SEM EQUIPE"}</td>
                      <td className="px-4 py-4 text-slate-300">{employee.projeto || "Não informado"}</td>
                      <td className="px-4 py-4"><StatusBadge status={employee.situacao} /></td>
                      <td className="px-4 py-4 text-slate-300">{employee.admissao || employee.dataAdmissao || "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Ver" onClick={() => setViewEmployee(employee)} tone="view" />
                          <ActionButton label="Editar" onClick={() => setEditingEmployee(employee)} tone="edit" />
                          <button
                            className="grid size-9 place-items-center rounded-lg bg-red-500/10 text-red-300 transition hover:bg-red-500/20"
                            onClick={() => handleToggleStatus(employee)}
                            title={employee.situacao === "ATIVO" ? "Marcar como inativo" : "Marcar como ativo"}
                            type="button"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Mostrando {filteredEmployees.length} de {employees.length} funcionários
          </p>
        </section>

        {viewEmployee ? (
          <EmployeeViewModal employee={viewEmployee} onClose={() => setViewEmployee(null)} />
        ) : null}

        {editingEmployee ? (
          <EmployeeEditModal
            employee={editingEmployee}
            onClose={() => setEditingEmployee(null)}
            onSave={(employee) => {
              updateEmployee(employee);
              setSheetEmployees((current) => current?.map((item) => (item.id === employee.id ? employee : item)) ?? current);
              setEditingEmployee(null);
            }}
          />
        ) : null}
      </div>
    </ErpShell>
  );
}

function SummaryCard({
  helper,
  icon,
  label,
  value,
  tone = "default",
}: {
  helper: string;
  icon: string;
  label: string;
  value: string;
  tone?: "default" | "green" | "slate" | "yellow" | "blue" | "purple" | "red";
}) {
  const tones = {
    default: ["text-white", "bg-white/10"],
    green: ["text-emerald-300", "bg-emerald-500/15"],
    slate: ["text-slate-300", "bg-slate-500/15"],
    yellow: ["text-yellow-300", "bg-yellow-500/15"],
    blue: ["text-blue-300", "bg-blue-500/15"],
    purple: ["text-purple-300", "bg-purple-500/15"],
    red: ["text-red-300", "bg-red-500/15"],
  };

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black p-5 shadow-2xl shadow-black/30">
      <div className={`grid size-12 place-items-center rounded-xl text-xl ${tones[tone][1]}`}>{icon}</div>
      <div>
        <p className={`text-xs font-extrabold uppercase tracking-[0.12em] ${tones[tone][0]}`}>{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function EmployeeAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-900 text-sm font-black text-white">
      {initials || "?"}
    </div>
  );
}

function RolePill({ value }: { value: string }) {
  if (!value) return null;

  return <span className="ml-2 rounded-full bg-yellow-500/10 px-2 py-1 text-[11px] font-bold text-yellow-300">{value}</span>;
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const styles: Record<EmployeeStatus, string> = {
    ATIVO: "bg-emerald-500/10 text-emerald-300",
    FERIAS: "bg-yellow-500/10 text-yellow-300",
    ATESTADO: "bg-blue-500/10 text-blue-300",
    AFASTADO: "bg-purple-500/10 text-purple-300",
    INATIVO: "bg-red-500/10 text-red-300",
  };
  const dot: Record<EmployeeStatus, string> = {
    ATIVO: "bg-emerald-300",
    FERIAS: "bg-yellow-300",
    ATESTADO: "bg-blue-300",
    AFASTADO: "bg-purple-300",
    INATIVO: "bg-red-300",
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {statusLabel(status)}
    </span>
  );
}

function ActionButton({ label, onClick, tone }: { label: string; onClick: () => void; tone: "view" | "edit" }) {
  const styles = tone === "view" ? "bg-slate-500/10 text-slate-300" : "bg-yellow-500/10 text-yellow-300";
  const icon = tone === "view" ? "👁" : "✎";

  return (
    <button className={`grid size-9 place-items-center rounded-lg transition hover:bg-white/10 ${styles}`} onClick={onClick} title={label} type="button">
      {icon}
    </button>
  );
}

function percent(value: number, total: number) {
  if (!total) return "0";
  return ((value / total) * 100).toFixed(1).replace(".", ",");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function createEmptyEmployeeForm(): Record<EmployeeColumnKey, string> {
  return employeeColumns.reduce(
    (form, column) => ({
      ...form,
      [column.key]: column.key === "situacao" ? "ATIVO" : "",
    }),
    {} as Record<EmployeeColumnKey, string>,
  );
}

function getEmployeePlaceholder(key: EmployeeColumnKey) {
  const placeholders: Partial<Record<EmployeeColumnKey, string>> = {
    re: "Ex: 33",
    funcionario: "Nome completo",
    cargo: "Ex: OFICIAL DE REDE",
    seguimento: "Ex: FTTA",
    equipe: "Ex: LFO-BRUNO J",
    projeto: "Ex: Cliente",
    vrDia: "Ex: 32,63",
    vt: "Ex: 0",
    salario: "Ex: R$ 2.009,11",
    carro: "Ex: GOL",
    placa: "Ex: ABC1D23",
    admissao: "Ex: 09/06/2026",
    vencimentoContrato45: "Ex: 24/07/2026",
    vencimentoContrato90: "Ex: 07/09/2026",
    eSocial: "Ex: BJ60",
    cpf: "000.000.000-00",
    rg: "00.000.000-0",
    nomeMae: "Nome da mãe",
    nomePai: "Nome do pai",
    dataNascimento: "Ex: 01/01/1990",
    enderecoCompleto: "Rua, número, complemento, bairro, cidade, CEP",
    vencimentoNrs: "Ex: 09/06/2027",
  };

  return placeholders[key] ?? "";
}

function getImportedValue(row: SpreadsheetRow, aliases: string[]) {
  const normalizedRow = new Map(
    Object.entries(row).map(([key, value]) => [normalizeImportKey(key), String(value ?? "").trim()]),
  );

  for (const alias of aliases) {
    const value = normalizedRow.get(normalizeImportKey(alias));

    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeImportKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function mergeEmployeesByKey(importedEmployees: Employee[], currentEmployees: Employee[]) {
  const importedKeys = new Set(importedEmployees.map(getEmployeeMergeKey));

  return [
    ...importedEmployees,
    ...currentEmployees.filter((employee) => !importedKeys.has(getEmployeeMergeKey(employee))),
  ];
}

function getEmployeeMergeKey(employee: Employee) {
  return `${employee.empresa}|${employee.re || employee.cpf || employee.funcionario}`.toUpperCase();
}

function EmployeeViewModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const details = [
    ["RE", employee.re],
    ["Funcionário", employee.funcionario],
    ["Cargo", employee.cargo],
    ["Equipe", employee.equipe],
    ["Projeto", employee.projeto],
    ["Status", statusLabel(employee.situacao)],
    ["Admissão", employee.admissao || employee.dataAdmissao],
    ["CPF", employee.cpf],
    ["RG", employee.rg],
    ["VR Dia", employee.vrDia],
    ["Telefone/VT", employee.vt],
    ["Endereço", employee.enderecoCompleto],
  ];

  return (
    <Modal title="Informações do funcionário" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        {details.map(([label, value]) => (
          <div className="rounded-xl border border-white/10 bg-black p-3" key={label}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{value || "Não informado"}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function EmployeeEditModal({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}) {
  const [draft, setDraft] = useState(employee);

  return (
    <Modal title="Editar funcionário" onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <EditField label="Funcionário" onChange={(value) => setDraft((current) => ({ ...current, funcionario: value, nome: value }))} value={draft.funcionario} />
        <EditField label="Cargo" onChange={(value) => setDraft((current) => ({ ...current, cargo: value }))} value={draft.cargo} />
        <EditField label="Equipe" onChange={(value) => setDraft((current) => ({ ...current, equipe: value }))} value={draft.equipe} />
        <EditField label="Projeto" onChange={(value) => setDraft((current) => ({ ...current, projeto: value }))} value={draft.projeto} />
        <label>
          <span className="text-sm font-bold text-slate-300">Status</span>
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none focus:border-yellow-500"
            onChange={(event) => setDraft((current) => ({ ...current, situacao: event.target.value as EmployeeStatus }))}
            value={draft.situacao}
          >
            {employeeStatusOptions.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
          <div className="mt-3 flex flex-wrap gap-2">
            {employeeStatusOptions.map((status) => {
              const selected = draft.situacao === status;

              return (
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    selected
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-white/10 bg-black text-slate-300 hover:border-yellow-500/50 hover:text-yellow-300"
                  }`}
                  key={status}
                  onClick={() => setDraft((current) => ({ ...current, situacao: status }))}
                  type="button"
                >
                  {statusLabel(status)}
                </button>
              );
            })}
          </div>
        </label>
        <EditField label="Admissão" onChange={(value) => setDraft((current) => ({ ...current, admissao: value, dataAdmissao: value }))} value={draft.admissao || draft.dataAdmissao} />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300" onClick={onClose} type="button">Cancelar</button>
        <button className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-black text-black" onClick={() => onSave(draft)} type="button">Salvar alterações</button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-white">{title}</h2>
          <button className="grid size-9 place-items-center rounded-xl bg-white/10 text-white" onClick={onClose} type="button">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none focus:border-yellow-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
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
