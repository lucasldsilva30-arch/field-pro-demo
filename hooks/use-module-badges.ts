"use client";

import { useMemo } from "react";
import { useErpData } from "@/hooks/use-erp-data";

export function useModuleBadges() {
  const { dataByCompany } = useErpData();

  return useMemo(() => {
    const pendingProduction = dataByCompany.production.filter((item) => !item.launchedConecta || item.status !== "OK").length;
    const pendingWhatsapp = dataByCompany.whatsappMessages.filter((item) => !item.launchedConecta).length;
    const pendingFinance = dataByCompany.finance.filter((item) => item.type.toLowerCase().includes("sa") && !item.paid).length;
    const lowStockMaterials = dataByCompany.materials.filter((item) => item.estoque <= item.estoqueMinimo).length;
    const pendingVr = dataByCompany.vr.filter((item) => item.amount > 0 && (!item.diasTrabalhados || !item.sabados)).length;
    const pendingEmployees = dataByCompany.employees.filter((item) =>
      [item.vencimentoContrato45, item.vencimentoContrato90, item.vencimentoNrs, item.feriasVencidas, item.nrsVencido].some(Boolean),
    ).length;

    return {
      dashboard: pendingProduction + pendingFinance,
      modulos: 0,
      operacao: pendingProduction,
      whatsapp: pendingWhatsapp,
      checklist: 0,
      indicadores: pendingProduction + pendingFinance + pendingWhatsapp,
      previafinanceira: pendingFinance > 0 ? pendingFinance : 0,
      funcionarios: pendingEmployees,
      materiais: lowStockMaterials,
      vr: pendingVr,
      financeiro: pendingFinance,
      seguranca: 0,
      configuracoes: 0,
    };
  }, [dataByCompany]);
}
