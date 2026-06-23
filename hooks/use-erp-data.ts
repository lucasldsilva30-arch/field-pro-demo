"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COMPANY_STORAGE_KEY, DEFAULT_COMPANY, filterErpDataByCompany, isCompanyName } from "@/lib/companies";
import { defaultErpData } from "@/lib/defaults";
import { normalizeEmployee } from "@/lib/employees";
import type {
  CompanyName,
  ConectaCode,
  Employee,
  ErpData,
  FinanceEntry,
  MaterialRecord,
  MaterialMovement,
  ProductionRecord,
  VrRecord,
  WhatsAppMessageRecord,
} from "@/lib/types";

const STORAGE_KEY = "fieldpro-demo-erp-v2";
const COMPANY_CHANGE_EVENT = "fieldpro-company-change";

export function useErpData() {
  const [data, setData] = useState<ErpData>(() => {
    if (typeof window === "undefined") {
      return defaultErpData;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeStoredData({ ...defaultErpData, ...JSON.parse(stored) }) : defaultErpData;
  });
  const [empresaAtiva, setEmpresaAtivaState] = useState<CompanyName>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COMPANY;
    }

    const stored = window.localStorage.getItem(COMPANY_STORAGE_KEY);
    return isCompanyName(stored) ? stored : DEFAULT_COMPANY;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncCompany = () => {
      const stored = window.localStorage.getItem(COMPANY_STORAGE_KEY);
      setEmpresaAtivaState(isCompanyName(stored) ? stored : DEFAULT_COMPANY);
    };

    window.addEventListener("storage", syncCompany);
    window.addEventListener(COMPANY_CHANGE_EVENT, syncCompany);

    return () => {
      window.removeEventListener("storage", syncCompany);
      window.removeEventListener(COMPANY_CHANGE_EVENT, syncCompany);
    };
  }, []);

  const setEmpresaAtiva = useCallback((empresa: CompanyName) => {
    setEmpresaAtivaState(empresa);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMPANY_STORAGE_KEY, empresa);
      window.dispatchEvent(new CustomEvent(COMPANY_CHANGE_EVENT));
    }
  }, []);

  const addProduction = useCallback((record: ProductionRecord) => {
    setData((current) => ({ ...current, production: [record, ...current.production] }));
  }, []);

  const updateProduction = useCallback((record: ProductionRecord) => {
    setData((current) => ({
      ...current,
      production: current.production.map((item) => (item.id === record.id ? record : item)),
    }));
  }, []);

  const addConectaCode = useCallback((code: ConectaCode) => {
    setData((current) => ({ ...current, conectaCodes: [code, ...current.conectaCodes] }));
  }, []);

  const addFinanceEntry = useCallback((entry: FinanceEntry) => {
    setData((current) => ({ ...current, finance: [entry, ...current.finance] }));
  }, []);

  const updateFinanceEntry = useCallback((entry: FinanceEntry) => {
    setData((current) => ({
      ...current,
      finance: current.finance.map((item) => (item.id === entry.id ? entry : item)),
    }));
  }, []);

  const deleteFinanceEntry = useCallback((entryId: string) => {
    setData((current) => ({
      ...current,
      finance: current.finance.filter((item) => item.id !== entryId),
    }));
  }, []);

  const addVrRecord = useCallback((record: VrRecord) => {
    setData((current) => ({ ...current, vr: [record, ...current.vr] }));
  }, []);

  const updateVrRecord = useCallback((record: VrRecord) => {
    setData((current) => ({
      ...current,
      vr: current.vr.map((item) => (item.id === record.id ? record : item)),
    }));
  }, []);

  const deleteVrRecord = useCallback((recordId: string) => {
    setData((current) => ({
      ...current,
      vr: current.vr.filter((item) => item.id !== recordId),
    }));
  }, []);

  const addMaterial = useCallback((material: MaterialRecord) => {
    setData((current) => ({ ...current, materials: [material, ...current.materials] }));
  }, []);

  const updateMaterial = useCallback((material: MaterialRecord) => {
    setData((current) => ({
      ...current,
      materials: current.materials.map((item) => (item.id === material.id ? material : item)),
    }));
  }, []);

  const deleteMaterial = useCallback((materialId: string) => {
    setData((current) => ({
      ...current,
      materials: current.materials.filter((item) => item.id !== materialId),
    }));
  }, []);

  const addMaterialMovement = useCallback((movement: MaterialMovement) => {
    setData((current) => ({
      ...current,
      materialMovements: [movement, ...current.materialMovements],
    }));
  }, []);

  const addWhatsAppMessage = useCallback((message: WhatsAppMessageRecord) => {
    setData((current) => ({ ...current, whatsappMessages: [message, ...current.whatsappMessages] }));
  }, []);

  const addEmployee = useCallback((employee: Employee) => {
    setData((current) => ({ ...current, employees: [employee, ...current.employees] }));
  }, []);

  const updateEmployee = useCallback((employee: Employee) => {
    setData((current) => ({
      ...current,
      employees: current.employees.map((item) => (item.id === employee.id ? employee : item)),
    }));
  }, []);

  const deleteEmployee = useCallback((employeeId: string) => {
    setData((current) => ({
      ...current,
      employees: current.employees.filter((item) => item.id !== employeeId),
    }));
  }, []);

  return useMemo(
    () => ({
      data,
      dataByCompany: filterErpDataByCompany(data, empresaAtiva),
      empresaAtiva,
      setEmpresaAtiva,
      addProduction,
      updateProduction,
      addConectaCode,
      addFinanceEntry,
      updateFinanceEntry,
      deleteFinanceEntry,
      addVrRecord,
      updateVrRecord,
      deleteVrRecord,
      addMaterial,
      addMaterialMovement,
      updateMaterial,
      deleteMaterial,
      addWhatsAppMessage,
      addEmployee,
      updateEmployee,
      deleteEmployee,
    }),
    [
      addConectaCode,
      addEmployee,
      addFinanceEntry,
      addProduction,
      addVrRecord,
      updateVrRecord,
      deleteVrRecord,
      addMaterial,
      addMaterialMovement,
      updateMaterial,
      deleteMaterial,
      addWhatsAppMessage,
      deleteEmployee,
      data,
      empresaAtiva,
      setEmpresaAtiva,
      updateEmployee,
      updateFinanceEntry,
      deleteFinanceEntry,
      updateProduction,
    ],
  );
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStoredData(data: ErpData): ErpData {
  const mergedData = mergeWithDefaults(data);

  return {
    ...mergedData,
    production: mergedData.production.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      equipe: sanitizeText(record.equipe),
      cabo: sanitizeText(record.cabo),
      local: sanitizeText(record.local),
      status: record.status,
      materiais: record.materiais.map((item) => sanitizeText(item)).filter(Boolean),
      rawMessage: sanitizeText(record.rawMessage),
    })),
    finance: mergedData.finance.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      description: sanitizeText(record.description),
      type: sanitizeText(record.type),
      category: sanitizeText(record.category),
    })),
    vr: mergedData.vr.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      funcionario: sanitizeText(record.funcionario),
      equipe: sanitizeText(record.equipe),
    })),
    materials: mergedData.materials.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      material: sanitizeText(record.material),
      categoria: sanitizeText(record.categoria),
      local: sanitizeText(record.local),
      responsavel: sanitizeText(record.responsavel),
      observacoes: sanitizeText(record.observacoes),
    })),
    materialMovements: mergedData.materialMovements.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      material: sanitizeText(record.material),
      responsible: sanitizeText(record.responsible),
      source: sanitizeText(record.source),
      note: sanitizeText(record.note),
    })),
    whatsappMessages: mergedData.whatsappMessages.map((record) => ({
      ...record,
      empresa: record.empresa ?? "ALPHA TELECOM",
      remetente: sanitizeText(record.remetente),
      mensagem: sanitizeText(record.mensagem),
      sp: sanitizeText(record.sp),
      cabo: sanitizeText(record.cabo),
      local: sanitizeText(record.local),
      equipe: sanitizeText(record.equipe),
      materiais: record.materiais.map((item) => sanitizeText(item)).filter(Boolean),
    })),
    employees: mergedData.employees.map((record, index) => normalizeEmployee(record, index)),
  };
}

function mergeWithDefaults(data: ErpData): ErpData {
  return {
    ...data,
    conectaCodes: mergeById(defaultErpData.conectaCodes, data.conectaCodes),
    production: mergeById(defaultErpData.production, data.production),
    finance: mergeById(defaultErpData.finance, data.finance),
    vr: mergeById(defaultErpData.vr, data.vr),
    materials: mergeById(defaultErpData.materials, data.materials),
    materialMovements: mergeById(defaultErpData.materialMovements, data.materialMovements),
    whatsappMessages: mergeById(defaultErpData.whatsappMessages, data.whatsappMessages),
    employees: mergeById(defaultErpData.employees, data.employees),
  };
}

function mergeById<T extends { id: string }>(defaults: T[], stored: T[]) {
  const storedIds = new Set(stored.map((item) => item.id));
  return [...stored, ...defaults.filter((item) => !storedIds.has(item.id))];
}

function sanitizeText(value: string | undefined) {
  return String(value ?? "")
    .replaceAll("ÃƒÂ§", "ç")
    .replaceAll("ÃƒÂ£", "ã")
    .replaceAll("ÃƒÂ¡", "á")
    .replaceAll("ÃƒÂ¢", "â")
    .replaceAll("ÃƒÂ©", "é")
    .replaceAll("ÃƒÂª", "ê")
    .replaceAll("ÃƒÂ­", "í")
    .replaceAll("ÃƒÂ³", "ó")
    .replaceAll("ÃƒÂ´", "ô")
    .replaceAll("ÃƒÂº", "ú")
    .replaceAll("ÃƒO", "ÃO")
    .replaceAll("Ãƒo", "ão")
    .replaceAll("NÃƒO", "NÃO")
    .replaceAll("SÃƒO", "SÃO")
    .replaceAll("GIRÃƒO", "GIRÃO")
    .replaceAll("TABOÃƒO", "TABOÃO")
    .trim();
}
