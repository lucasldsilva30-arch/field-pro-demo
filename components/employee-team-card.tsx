import type { Employee, EmployeeTeam } from "@/lib/types";
import { employeeColumns } from "@/lib/employees";

type EmployeeTeamCardProps = {
  team: EmployeeTeam;
  employees: Employee[];
  onToggleStatus: (employee: Employee) => void;
};

export function EmployeeTeamCard({ team, employees, onToggleStatus }: EmployeeTeamCardProps) {
  const activeEmployees = employees.filter((employee) => employee.situacao === "ATIVO").length;

  return (
    <section className="overflow-hidden rounded-2xl border border-yellow-950/60 bg-zinc-950/80 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="px-5 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Equipe</p>
          <h2 className="mt-1 text-xl font-bold text-white">{team}</h2>
        </div>

        <div className="mx-5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-950/20 px-4 py-2 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/20 sm:mt-5">
          {activeEmployees} ativos / {employees.length} total
        </div>
      </div>

      <div>
        {employees.length === 0 ? (
          <div className="m-5 rounded-xl border border-dashed border-white/10 bg-black/30 p-4 text-sm text-slate-500">
            Nenhum funcionário cadastrado nesta equipe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[2200px] text-left text-sm">
              <thead className="bg-black/60 text-[11px] uppercase tracking-[0.12em] text-yellow-500">
                <tr>
                  {employeeColumns.map((column) => (
                    <th className="whitespace-nowrap border-b border-yellow-950/60 px-3 py-3 font-extrabold" key={column.key}>
                      {column.label}
                    </th>
                  ))}
                  <th className="sticky right-0 whitespace-nowrap border-b border-yellow-950/60 bg-black px-3 py-3 font-extrabold">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr className="border-b border-white/5 text-slate-300 hover:bg-white/[0.03]" key={employee.id}>
                    {employeeColumns.map((column) => (
                      <td className="max-w-72 whitespace-nowrap px-3 py-3 align-top" key={column.key}>
                        {column.key === "situacao" ? (
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                              employee.situacao === "ATIVO"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {employee.situacao}
                          </span>
                        ) : (
                          <span className={column.key === "funcionario" ? "font-bold text-white" : ""}>
                            {employee[column.key] || "-"}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="sticky right-0 bg-zinc-950 px-3 py-3 align-top">
                      <button
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-300"
                        onClick={() => onToggleStatus(employee)}
                        type="button"
                      >
                        {employee.situacao === "ATIVO" ? "Inativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
