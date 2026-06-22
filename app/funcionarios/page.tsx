"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ErpShell } from "@/components/erp-shell";
import { EmployeeTabbedForm } from "@/components/employee-tabbed-form";
import { ModuleSpreadsheetActions, type SpreadsheetRow } from "@/components/module-spreadsheet-actions";
import { createId, useErpData } from "@/hooks/use-erp-data";
import { useErpTheme } from "@/hooks/use-erp-theme";
import { formatDateBr } from "@/lib/date";
import { EMPLOYEE_SHEET_NAME, employeeColumns, normalizeEmployee, type EmployeeColumnKey } from "@/lib/employees";
import type { Employee, EmployeeStatus } from "@/lib/types";

type EmployeesApiResponse = {
  employees?: Employee[];
  error?: string;
  source?: "google-sheets" | "fallback";
  updatedAt?: string;
};

type StatusFilter = "TODOS" | EmployeeStatus;

const employeeStatusOptions: EmployeeStatus[] = ["ATIVO", "FERIAS", "ATESTADO", "AFASTADO", "INATIVO"];

export default function FuncionariosPage() {
  const { data, empresaAtiva, addEmployee, updateEmployee, deleteEmployee } = useErpData();
  const { theme } = useErpTheme();
  const isLight = theme.mode === "light";
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

  function handleEmployeeFieldChange(key: EmployeeColumnKey, value: string) {
    setEmployeeForm((current) => ({ ...current, [key]: value }));
  }

  function handleDeleteEmployee(employee: Employee) {
    const confirmed = window.confirm(`Excluir ${employee.funcionario} da lista?`);

    if (!confirmed) {
      return;
    }

    if (sheetEmployees) {
      setSheetEmployees((current) => current?.filter((item) => item.id !== employee.id) ?? current);
    } else {
      deleteEmployee(employee.id);
    }

    if (viewEmployee?.id === employee.id) {
      setViewEmployee(null);
    }

    if (editingEmployee?.id === employee.id) {
      setEditingEmployee(null);
    }
  }

  function handleToggleEmployeeStatus(employee: Employee) {
    const nextStatus: EmployeeStatus = employee.situacao === "ATIVO" ? "INATIVO" : "ATIVO";
    const updatedEmployee: Employee = {
      ...employee,
      situacao: nextStatus,
    };

    if (sheetEmployees) {
      setSheetEmployees((current) => current?.map((item) => (item.id === employee.id ? updatedEmployee : item)) ?? current);
    } else {
      updateEmployee(updatedEmployee);
    }
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
          <SummaryCard helper="Na empresa ativa" icon="users" label="Total de funcionários" tone="green" value={employees.length.toString()} />
          <SummaryCard helper={`${percent(activeEmployees, employees.length)}% do total`} icon="user" label="Ativos" tone="blue" value={activeEmployees.toString()} />
          <SummaryCard helper={`${teamCount} equipes`} icon="building" label="Equipes" tone="yellow" value={teamCount.toString()} />
          <SummaryCard helper="Podem tirar férias" icon="vacation" label="Em férias" tone="purple" value={vacationReady.toString()} />
          <SummaryCard helper={`${percent(inactiveEmployees, employees.length)}% do total`} icon="ban" label="Desligados" tone="red" value={inactiveEmployees.toString()} />
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
          <EmployeeTabbedForm
            companyName={empresaAtiva}
            draft={employeeForm}
            onChange={handleEmployeeFieldChange}
            onSecondaryAction={() => {
              setEmployeeForm(createEmptyEmployeeForm());
              setFormFeedback("");
            }}
            onSubmit={handleRegisterEmployee}
            secondaryLabel="Limpar formulário"
            submitLabel="Cadastrar funcionário"
            subtitle={`Formulário organizado por abas para manter o cadastro legível e salvar tudo em uma única requisição para ${empresaAtiva}.`}
            title="Novo funcionário"
          />
          {formFeedback ? (
            <p className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
              {formFeedback}
            </p>
          ) : null}
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
                          <EmployeeAvatar isLight={isLight} name={employee.funcionario} />
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
                      <td className="px-4 py-4 text-slate-300">{formatDateBr(employee.admissao || employee.dataAdmissao) || "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton isLight={isLight} label="Ver" onClick={() => setViewEmployee(employee)} tone="view" />
                          <ActionButton isLight={isLight} label="Editar" onClick={() => setEditingEmployee(employee)} tone="edit" />
                          <button
                            className={`grid size-9 place-items-center rounded-lg border transition ${
                              isLight
                                ? employee.situacao === "ATIVO"
                                  ? "border-emerald-200 bg-emerald-100 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-200"
                                  : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
                                : employee.situacao === "ATIVO"
                                  ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "border-slate-500/15 bg-slate-500/10 text-slate-200 hover:border-slate-500/30 hover:bg-slate-500/20"
                            }`}
                            onClick={() => handleToggleEmployeeStatus(employee)}
                            title={employee.situacao === "ATIVO" ? "Marcar como inativo" : "Marcar como ativo"}
                            type="button"
                          >
                            <PowerIcon />
                          </button>
                          <button
                            className={`grid size-9 place-items-center rounded-lg border transition ${
                              isLight
                                ? "border-red-200 bg-red-100 text-red-700 hover:border-red-300 hover:bg-red-200"
                                : "border-red-500/15 bg-red-500/10 text-red-300 hover:border-red-500/30 hover:bg-red-500/20"
                            }`}
                            onClick={() => handleDeleteEmployee(employee)}
                            title="Excluir funcionário"
                            type="button"
                          >
                            <DeleteIcon isLight={isLight} />
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
  icon: SummaryIconName;
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
      <div className={`grid size-12 place-items-center rounded-xl ${tones[tone][1]}`}>
        <SummaryIcon name={icon} tone={tone} />
      </div>
      <div>
        <p className={`text-xs font-extrabold uppercase tracking-[0.12em] ${tones[tone][0]}`}>{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function EmployeeAvatar({ isLight, name }: { isLight: boolean; name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-black ${
        isLight
          ? "bg-gradient-to-br from-amber-100 via-amber-300 to-yellow-500 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "bg-gradient-to-br from-slate-600 to-slate-900 text-white"
      }`}
    >
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

function ActionButton({
  isLight,
  label,
  onClick,
  tone,
}: {
  isLight: boolean;
  label: string;
  onClick: () => void;
  tone: "view" | "edit";
}) {
  const styles =
    isLight
      ? tone === "view"
        ? "border border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
        : "border border-amber-200 bg-amber-100 text-amber-700 hover:border-amber-300 hover:bg-amber-200"
      : tone === "view"
        ? "border border-slate-500/15 bg-slate-500/10 text-slate-200 hover:border-slate-500/30 hover:bg-slate-500/20"
        : "border border-yellow-500/15 bg-yellow-500/10 text-yellow-300 hover:border-yellow-500/30 hover:bg-yellow-500/20";

  return (
    <button className={`grid size-9 place-items-center rounded-lg transition ${styles}`} onClick={onClick} title={label} type="button">
      <ActionIcon isLight={isLight} tone={tone} />
    </button>
  );
}

type SummaryIconName = "users" | "user" | "building" | "vacation" | "ban";

function SummaryIcon({ name, tone }: { name: SummaryIconName; tone: string }) {
  const stroke = tone === "yellow" ? "#fde047" : tone === "blue" ? "#93c5fd" : tone === "purple" ? "#d8b4fe" : tone === "red" ? "#fca5a5" : "#86efac";

  const icons: Record<SummaryIconName, ReactNode> = {
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    user: <path d="M16 21v-2a4 4 0 0 0-4-4H12a4 4 0 0 0-4 4v2m8-12a4 4 0 1 0-8 0 4 4 0 0 0 8 0" />,
    building: <path d="M3 21h18M6 21V7l6-3v17m0 0h6V10l-6-3M9 21v-4h2v4m2-10h2m-4 4h2" />,
    vacation: <path d="M5 19h14M6 17c0-4 3-7 6-7s6 3 6 7M12 3v4m4.5-2.5L14.7 6.3M7.5 4.5 9.3 6.3" />,
    ban: <path d="m4 4 16 16M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" />,
  };

  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
}

function ActionIcon({ isLight, tone }: { isLight: boolean; tone: "view" | "edit" }) {
  const stroke = isLight ? (tone === "view" ? "#475569" : "#b45309") : tone === "view" ? "#cbd5e1" : "#fcd34d";
  const path = tone === "view" ? <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /> : <path d="M4 20h4l10-10-4-4L4 16v4Zm11-11 4 4" />;

  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {path}
    </svg>
  );
}

function DeleteIcon({ isLight }: { isLight: boolean }) {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke={isLight ? "#b91c1c" : "#fca5a5"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3v9" />
      <path d="M7.5 6.5a7 7 0 1 0 9 0" />
    </svg>
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

function mapEmployeeToForm(employee: Employee): Record<EmployeeColumnKey, string> {
  return employeeColumns.reduce(
    (form, column) => ({
      ...form,
      [column.key]:
        employee[column.key] ??
        (column.key === "situacao" ? employee.situacao : "") ??
        "",
    }),
    {} as Record<EmployeeColumnKey, string>,
  );
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
    ["Admissão", formatDateBr(employee.admissao || employee.dataAdmissao)],
    ["Nascimento", formatDateBr(employee.dataNascimento)],
    ["Contrato 45 dias", formatDateBr(employee.vencimentoContrato45)],
    ["Contrato 90 dias", formatDateBr(employee.vencimentoContrato90)],
    ["Vencimento NRS", formatDateBr(employee.vencimentoNrs)],
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
      <EmployeeTabbedForm
        companyName={employee.empresa}
        draft={mapEmployeeToForm(draft)}
        onChange={(key, value) =>
          setDraft((current) => {
            const next = { ...current, [key]: value } as Employee;

            if (key === "funcionario") {
              next.nome = value;
            }

            if (key === "admissao") {
              next.dataAdmissao = value;
            }

            return next;
          })
        }
        onSecondaryAction={onClose}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
        secondaryLabel="Cancelar"
        submitLabel="Salvar alterações"
        subtitle="Edite os dados em abas separadas para manter o formulário legível e evitar erros."
        title="Editar funcionário"
      />
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
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
