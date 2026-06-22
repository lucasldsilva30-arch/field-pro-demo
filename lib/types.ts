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
  dueDate?: string;
  description: string;
  type: string;
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

export type MaterialStatus = "Disponivel" | "Baixo estoque" | "Sem estoque" | "Manutencao";

export type MaterialRecord = {
  id: string;
  empresa: CompanyName;
  material: string;
  categoria: string;
  unidade: string;
  estoque: number;
  estoqueMinimo: number;
  utilizado: number;
  local: string;
  responsavel: string;
  status: MaterialStatus;
  observacoes: string;
};

export type MaterialMovementType = "Entrada" | "Saída";

export type MaterialMovement = {
  id: string;
  empresa: CompanyName;
  materialId: string;
  material: string;
  date: string;
  quantity: number;
  type: MaterialMovementType;
  responsible: string;
  source: string;
  note: string;
};

export type WhatsAppMessageRecord = {
  id: string;
  empresa: CompanyName;
  recebidoEm: string;
  remetente: string;
  mensagem: string;
  sp: string;
  cabo: string;
  local: string;
  status: ProductionStatus;
  equipe: string;
  materiais: string[];
  confidence: number;
  launchedConecta: boolean;
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
  materials: MaterialRecord[];
  materialMovements: MaterialMovement[];
  whatsappMessages: WhatsAppMessageRecord[];
  employees: Employee[];
};
