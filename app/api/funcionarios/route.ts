import { NextRequest, NextResponse } from "next/server";
import { companies } from "@/lib/companies";
import { defaultErpData } from "@/lib/defaults";
import { EMPLOYEE_SHEET_NAME } from "@/lib/employees";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const employees = dedupeEmployees(completeMissingCompanies(defaultErpData.employees));

  return NextResponse.json({
    employees,
    source: "fallback",
    sheet: EMPLOYEE_SHEET_NAME,
    loadedSources: [],
    failedSources: [],
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const employee = (await req.json()) as Employee;

    if (!employee?.funcionario || !employee?.empresa) {
      return NextResponse.json(
        { error: "Informe empresa e funcionário para cadastrar." },
        { status: 400 },
      );
    }

    const scriptUrl = process.env.GOOGLE_FUNCIONARIOS_SCRIPT_URL ?? process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json({
        success: true,
        persisted: false,
        message: "Funcionário salvo localmente. Configure GOOGLE_FUNCIONARIOS_SCRIPT_URL para gravar no Sheets.",
      });
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        type: "funcionario",
        sheet: EMPLOYEE_SHEET_NAME,
        row: employeeToSheetRow(employee),
        data: employee,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => response.statusText);
      throw new Error(details || response.statusText);
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar funcionário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function completeMissingCompanies(employees: Employee[]) {
  const fallbackEmployees = defaultErpData.employees;
  const result = [...employees];

  companies.forEach((company) => {
    const hasCompanyEmployees = result.some((employee) => employee.empresa === company);

    if (!hasCompanyEmployees) {
      result.push(...fallbackEmployees.filter((employee) => employee.empresa === company));
    }
  });

  return result;
}

function dedupeEmployees(employees: Employee[]) {
  const seen = new Set<string>();

  return employees.filter((employee) => {
    const key = [
      employee.empresa,
      employee.re,
      employee.cpf,
      employee.funcionario.toUpperCase().replace(/\s+/g, " ").trim(),
    ]
      .filter(Boolean)
      .join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function employeeToSheetRow(employee: Employee) {
  return [
    employee.empresa,
    "ERP",
    employee.re,
    employee.situacao,
    employee.funcionario,
    employee.cargo,
    employee.seguimento,
    employee.equipe,
    employee.projeto,
    employee.vrDia,
    employee.vt,
    employee.salario,
    employee.clt,
    employee.carro,
    employee.placa,
    employee.admissao,
    employee.vencimentoContrato45,
    employee.vencimentoContrato90,
    employee.eSocial,
    employee.cracha,
    employee.cartaoVrVa,
    employee.cpf,
    employee.rg,
    employee.nomeMae,
    employee.nomePai,
    employee.dataNascimento,
    employee.enderecoCompleto,
    employee.nrs1035,
    employee.vencimentoNrs,
    employee.possuiNrs,
    employee.nrsVencido,
    employee.feriasVencidas,
    employee.podeTirarFerias,
  ];
}
