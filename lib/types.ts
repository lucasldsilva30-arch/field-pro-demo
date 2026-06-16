export type ProductionStatus = "OK" | "Pendente" | "Refazer";

export type CompanyName = "ALPHA TELECOM" | "BETA TELECOM" | "GAMMA TELECOM";

export type ConectaCode = {
  id: string;
  description: string;
  code: string;
  points: number;
  value: number;
};

export type ProductionRecord = {
  id: string;
  empresa: CompanyName;
  date: string;
  sp: string;
  cabo: string;
  local: string;
  status: ProductionStatus;
  equipe: string;
  materiais: string[];
  conectaCodeId: string;
  conectaCode: string;
  points: number;
  value: number;
  launchedConecta: boolean;
  rawMessage: string;
};

export type FinanceEntry = {
  id: string;
  empresa: CompanyName;
  date: string;
  description: string;
  type: "Entrada" | "Saída";
  category: string;
  amount: number;
  paid: boolean;
};

export type VrRecord = {
  id: string;
  empresa: CompanyName;
  funcionario: string;
  equipe: string;
  diasTrabalhados: number;
  sabados: number;
  valorDia: number;
  valorSabado: number;
  amount: number;
};

export type EmployeeStatus = "ATIVO" | "FERIAS" | "ATESTADO" | "AFASTADO" | "INATIVO";

export type EmployeeTeam = string;

export type Employee = {
  id: string;
  empresa: CompanyName;
  re: string;
  situacao: EmployeeStatus;
  nome: string;
  funcionario: string;
  cargo: string;
  seguimento: string;
  equipe: EmployeeTeam;
  projeto: string;
  vrDia: string;
  vt: string;
  salario: string;
  clt: string;
  carro: string;
  placa: string;
  admissao: string;
  dataAdmissao: string;
  vencimentoContrato45: string;
  vencimentoContrato90: string;
  eSocial: string;
  cracha: string;
  cartaoVrVa: string;
  cpf: string;
  rg: string;
  nomeMae: string;
  nomePai: string;
  dataNascimento: string;
  enderecoCompleto: string;
  nrs1035: string;
  vencimentoNrs: string;
  possuiNrs: string;
  nrsVencido: string;
  feriasVencidas: string;
  podeTirarFerias: string;
};

export type ErpData = {
  conectaCodes: ConectaCode[];
  production: ProductionRecord[];
  finance: FinanceEntry[];
  vr: VrRecord[];
  employees: Employee[];
};
