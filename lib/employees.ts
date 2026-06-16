import { DEFAULT_COMPANY } from "./companies";
import type { CompanyName, Employee, EmployeeStatus } from "./types";

export const EMPLOYEE_SHEET_ID = "demo";
export const EMPLOYEE_SHEET_GID = "0";
export const EMPLOYEE_SHEET_NAME = "BASE_DEMO_FUNCIONARIOS";

export const employeeSheetSources = [] as const;

export const employeeColumns = [
  { key: "re", label: "RE" },
  { key: "situacao", label: "Situação" },
  { key: "funcionario", label: "Funcionário" },
  { key: "cargo", label: "Cargo" },
  { key: "seguimento", label: "Seguimento" },
  { key: "equipe", label: "Equipe" },
  { key: "projeto", label: "Projeto" },
  { key: "vrDia", label: "R$ VR Dia" },
  { key: "vt", label: "R$ VT" },
  { key: "salario", label: "Salário" },
  { key: "clt", label: "CLT" },
  { key: "carro", label: "Carro" },
  { key: "placa", label: "Placa" },
  { key: "admissao", label: "Admissão" },
  { key: "vencimentoContrato45", label: "Contrato 45 dias" },
  { key: "vencimentoContrato90", label: "Contrato 90 dias" },
  { key: "eSocial", label: "E-social" },
  { key: "cracha", label: "Crachá" },
  { key: "cartaoVrVa", label: "Cartão VR/VA" },
  { key: "cpf", label: "CPF" },
  { key: "rg", label: "RG" },
  { key: "nomeMae", label: "Nome mãe" },
  { key: "nomePai", label: "Nome pai" },
  { key: "dataNascimento", label: "Nascimento" },
  { key: "enderecoCompleto", label: "Endereço completo" },
  { key: "nrs1035", label: "NRS 10/35" },
  { key: "vencimentoNrs", label: "Vencimento NRS" },
  { key: "possuiNrs", label: "Possui NRS?" },
  { key: "nrsVencido", label: "NRS vencido?" },
  { key: "feriasVencidas", label: "Férias vencidas?" },
  { key: "podeTirarFerias", label: "Pode tirar férias?" },
] as const;

export type EmployeeColumnKey = (typeof employeeColumns)[number]["key"];

export function parseEmployeeSheetRows(rows: string[][], sourceCompany?: CompanyName): Employee[] {
  const header = rows[0] ?? [];
  const isCentralDatabase = normalizeHeader(header[0]) === "EMPRESA";
  const isTimSheet = normalizeHeader(header[0]) === "N. CPF";
  const isNewTelecomSheet = normalizeHeader(header[0]) === "ID_FUNCIONARIO";

  if (isCentralDatabase) {
    return rows
      .slice(1)
      .filter((row) => row.some(Boolean))
      .map((row, index) => normalizeCentralEmployeeRow(row, index))
      .filter((employee) => employee.funcionario);
  }

  if (isTimSheet) {
    return rows
      .slice(1)
      .filter((row) => row.some(Boolean))
      .map((row, index) => normalizeTimEmployeeRow(row, index, sourceCompany ?? "GAMMA TELECOM"))
      .filter((employee) => employee.funcionario);
  }

  if (isNewTelecomSheet) {
    return rows
      .slice(1)
      .filter((row) => row.some(Boolean))
      .map((row, index) => normalizeEmployee(mapNewTelecomSoftrRow(row, sourceCompany ?? "GAMMA TELECOM"), index))
      .filter((employee) => employee.funcionario);
  }

  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => normalizeEmployeeRow(row, index))
    .map((employee) => (sourceCompany ? { ...employee, empresa: sourceCompany } : employee))
    .filter((employee) => employee.funcionario);
}

function normalizeCentralEmployeeRow(row: string[], index: number): Employee {
  const empresa = normalizeCompany(row[0]);
  const origem = clean(row[1]);
  const columns = row.slice(2);

  if (origem.toUpperCase().includes("CADASTRO FUNCIONARIOS")) {
    return normalizeEmployee({ ...mapCadastroFuncionariosRow(columns), empresa }, index);
  }

  if (clean(row[0]).toUpperCase() === "GAMMA") {
    return normalizeTimCentralRow(columns, index, "GAMMA TELECOM");
  }

  return normalizeEmployee(
    {
      empresa,
      id: `${empresa.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
      re: String(index + 1),
      situacao: "ATIVO",
      funcionario: columns[1],
      cargo: columns[10],
      seguimento: origem,
      equipe: columns[10] || empresa,
      projeto: empresa,
      salario: columns[5],
      admissao: columns[9],
      dataAdmissao: columns[9],
      cpf: columns[8],
      rg: columns[7],
      dataNascimento: columns[6],
      enderecoCompleto: columns[3],
      nrs1035: columns[15],
      possuiNrs: columns[15],
      nrsVencido: columns[16],
    },
    index,
  );
}

function normalizeTimCentralRow(row: string[], index: number, empresa: CompanyName): Employee {
  return normalizeEmployee(
    {
      empresa,
      id: `tim-${clean(row[0]) || index + 1}`,
      re: clean(row[0]) || String(index + 1),
      situacao: "ATIVO",
      funcionario: row[3],
      cargo: row[4],
      seguimento: row[2],
      equipe: row[2] || row[12] || "GAMMA",
      projeto: "GAMMA",
      carro: row[8],
      placa: row[7],
      admissao: row[5],
      dataAdmissao: row[5],
      eSocial: row[0],
      cpf: row[14],
      rg: row[15],
      dataNascimento: row[13],
      enderecoCompleto: row[16],
    },
    index,
  );
}

function normalizeTimEmployeeRow(row: string[], index: number, empresa: CompanyName): Employee {
  return normalizeEmployee(
    {
      empresa,
      id: `tim-${clean(row[4]) || clean(row[9]) || index + 1}`,
      re: row[4] || String(index + 1),
      situacao: "ATIVO",
      funcionario: row[5],
      cargo: row[6],
      seguimento: row[3],
      equipe: row[7] || "GAMMA",
      projeto: "GAMMA",
      carro: row[14],
      placa: row[13],
      admissao: row[1],
      dataAdmissao: row[1],
      cpf: row[9] || row[0],
      rg: row[10],
      nomeMae: row[11],
      dataNascimento: row[8],
      nrs1035: row[23],
      possuiNrs: row[24],
    },
    index,
  );
}

function mapNewTelecomSoftrRow(row: string[], empresa: CompanyName): Partial<Employee> {
  return {
    empresa,
    id: row[0],
    re: row[1],
    situacao: normalizeStatus(row[2]),
    funcionario: row[3],
    cargo: row[4],
    seguimento: row[5],
    equipe: row[6],
    projeto: row[7],
    vrDia: row[8],
    vt: row[9],
    salario: row[10],
    clt: row[11],
    carro: row[12],
    placa: row[13],
    admissao: row[14],
    dataAdmissao: row[14],
    vencimentoContrato45: row[15],
    vencimentoContrato90: row[16],
    eSocial: row[17],
    cracha: row[18],
    cartaoVrVa: row[19],
    cpf: row[20],
    rg: row[21],
    nomeMae: row[22],
    nomePai: row[23],
    dataNascimento: row[24],
    enderecoCompleto: row[25],
    nrs1035: row[26],
    vencimentoNrs: row[27],
    possuiNrs: row[28],
    nrsVencido: row[29],
    feriasVencidas: row[30],
    podeTirarFerias: row[31],
  };
}

export function normalizeEmployee(employee: Partial<Employee>, index = 0): Employee {
  const funcionario = clean(employee.funcionario ?? employee.nome);
  const legacyStatus = (employee as Partial<Employee> & { status?: string }).status;
  const situacao = normalizeStatus(employee.situacao ?? legacyStatus);

  return {
    id: clean(employee.id) || `emp-${clean(employee.re) || index + 1}`,
    empresa: normalizeCompany(employee.empresa),
    re: clean(employee.re),
    situacao,
    nome: funcionario,
    funcionario,
    cargo: clean(employee.cargo),
    seguimento: clean(employee.seguimento),
    equipe: clean(employee.equipe) || "SEM EQUIPE",
    projeto: clean(employee.projeto),
    vrDia: clean(employee.vrDia),
    vt: clean(employee.vt),
    salario: clean(employee.salario),
    clt: clean(employee.clt),
    carro: clean(employee.carro),
    placa: clean(employee.placa),
    admissao: clean(employee.admissao ?? employee.dataAdmissao),
    dataAdmissao: clean(employee.dataAdmissao ?? employee.admissao),
    vencimentoContrato45: clean(employee.vencimentoContrato45),
    vencimentoContrato90: clean(employee.vencimentoContrato90),
    eSocial: clean(employee.eSocial),
    cracha: clean(employee.cracha),
    cartaoVrVa: clean(employee.cartaoVrVa),
    cpf: clean(employee.cpf),
    rg: clean(employee.rg),
    nomeMae: clean(employee.nomeMae),
    nomePai: clean(employee.nomePai),
    dataNascimento: clean(employee.dataNascimento),
    enderecoCompleto: clean(employee.enderecoCompleto),
    nrs1035: clean(employee.nrs1035),
    vencimentoNrs: clean(employee.vencimentoNrs),
    possuiNrs: clean(employee.possuiNrs),
    nrsVencido: clean(employee.nrsVencido),
    feriasVencidas: clean(employee.feriasVencidas),
    podeTirarFerias: clean(employee.podeTirarFerias),
  };
}

function normalizeEmployeeRow(row: string[], index: number): Employee {
  return normalizeEmployee(mapCadastroFuncionariosRow(row), index);
}

function mapCadastroFuncionariosRow(row: string[]): Partial<Employee> {
  return {
    re: row[0],
    situacao: normalizeStatus(row[1]),
    funcionario: row[2],
    cargo: row[3],
    seguimento: row[4],
    equipe: row[5],
    projeto: row[6],
    vrDia: row[7],
    vt: row[8],
    salario: row[9],
    clt: row[10],
    carro: row[11],
    placa: row[12],
    admissao: row[13],
    dataAdmissao: row[13],
    vencimentoContrato45: row[14],
    vencimentoContrato90: row[15],
    eSocial: row[16],
    cracha: row[17],
    cartaoVrVa: row[18],
    cpf: row[19],
    rg: row[20],
    nomeMae: row[21],
    nomePai: row[22],
    dataNascimento: row[23],
    enderecoCompleto: row[24],
    nrs1035: row[25],
    vencimentoNrs: row[26],
    possuiNrs: row[27],
    nrsVencido: row[28],
    feriasVencidas: row[29],
    podeTirarFerias: row[30],
  };
}

function normalizeStatus(value?: string): EmployeeStatus {
  const status = clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (status.includes("FERIA")) return "FERIAS";
  if (status.includes("ATEST")) return "ATESTADO";
  if (status.includes("AFAST")) return "AFASTADO";
  if (status.includes("INAT") || status.includes("DESLIG")) return "INATIVO";

  return "ATIVO";
}

function normalizeCompany(value?: string): CompanyName {
  const company = clean(value).toUpperCase();

  if (company === "GAMMA TELECOM" || company === "ALPHA TELECOM" || company === "BETA TELECOM") {
    return company;
  }

  return DEFAULT_COMPANY;
}

function clean(value?: string) {
  return fixEncoding(String(value ?? "").trim());
}

function normalizeHeader(value?: string) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function fixEncoding(value: string) {
  return value
    .replaceAll("ÃƒÆ’O", "ÃƒO")
    .replaceAll("ÃƒÆ’o", "Ã£o")
    .replaceAll("ÃƒÆ’A", "Ãƒ")
    .replaceAll("ÃƒÆ’a", "Ã£")
    .replaceAll("ÃƒÆ’", "Ãƒ")
    .replaceAll("ÃƒÂ§", "Ã§")
    .replaceAll("ÃƒÂ£", "Ã£")
    .replaceAll("ÃƒÂ¡", "Ã¡")
    .replaceAll("ÃƒÂ¢", "Ã¢")
    .replaceAll("ÃƒÂ©", "Ã©")
    .replaceAll("ÃƒÂª", "Ãª")
    .replaceAll("ÃƒÂ­", "Ã­")
    .replaceAll("ÃƒÂ³", "Ã³")
    .replaceAll("ÃƒÂ´", "Ã´")
    .replaceAll("ÃƒÂº", "Ãº")
    .replaceAll("NÃƒO", "NÃƒO");
}

