import { NextRequest, NextResponse } from "next/server";
import { companies } from "@/lib/companies";
import { defaultErpData } from "@/lib/defaults";
import { EMPLOYEE_SHEET_NAME, employeeSheetSources, parseEmployeeSheetRows } from "@/lib/employees";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const loadedEmployees: Employee[] = [];
  const loadedSources: string[] = [];
  const failedSources: string[] = [];

  for (const source of employeeSheetSources) {
    try {
      const rows = await fetchCsvRows(
        process.env.GOOGLE_FUNCIONARIOS_CSV_URL ??
          `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${source.gid}`,
      );
      const employees = parseEmployeeSheetRows(rows, "empresa" in source ? source.empresa : undefined);

      if (employees.length > 0) {
        loadedEmployees.push(...employees);
        loadedSources.push(source.label);
      }

      if (!("empresa" in source) && employees.length > 0) {
        break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "erro desconhecido";
      failedSources.push(`${source.label}: ${message}`);
    }
  }

  const employees = completeMissingCompanies(loadedEmployees);

  return NextResponse.json({
    employees: dedupeEmployees(employees),
    source: loadedSources.length > 0 ? "google-sheets" : "fallback",
    sheet: EMPLOYEE_SHEET_NAME,
    loadedSources,
    failedSources,
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

async function fetchCsvRows(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/csv,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets respondeu ${response.status}.`);
  }

  return parseCsv(await response.text());
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

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}
