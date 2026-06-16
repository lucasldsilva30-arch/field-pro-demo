import type { ErpData } from "./types";

export const defaultErpData: ErpData = {
  conectaCodes: [
    {
      id: "code-install",
      description: "Instalacao FTTA",
      code: "CN-FTTA-001",
      points: 1,
      value: 420,
    },
    {
      id: "code-splice",
      description: "Fusao de fibra",
      code: "CN-FUSAO-002",
      points: 0.5,
      value: 180,
    },
    {
      id: "code-maintenance",
      description: "Manutencao corretiva",
      code: "CN-MANUT-003",
      points: 0.75,
      value: 260,
    },
  ],
  production: [],
  finance: [],
  vr: [],
  employees: [],
};
