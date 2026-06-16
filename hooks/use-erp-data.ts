"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COMPANY_STORAGE_KEY, DEFAULT_COMPANY, filterErpDataByCompany, isCompanyName } from "@/lib/companies";
import { defaultErpData } from "@/lib/defaults";
import type { CompanyName, ConectaCode, Employee, ErpData, FinanceEntry, ProductionRecord, VrRecord } from "@/lib/types";

const STORAGE_KEY = "fieldpro-erp-v4";
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

  const addVrRecord = useCallback((record: VrRecord) => {
    setData((current) => ({ ...current, vr: [record, ...current.vr] }));
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
      addVrRecord,
      addEmployee,
      updateEmployee,
    }),
    [
      addConectaCode,
      addEmployee,
      addFinanceEntry,
      addProduction,
      addVrRecord,
      data,
      empresaAtiva,
      setEmpresaAtiva,
      updateEmployee,
      updateFinanceEntry,
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
    production: mergedData.production.map((record) => ({ ...record, empresa: record.empresa ?? DEFAULT_COMPANY })),
    finance: mergedData.finance.map((record) => ({ ...record, empresa: record.empresa ?? DEFAULT_COMPANY })),
    vr: mergedData.vr.map((record) => ({ ...record, empresa: record.empresa ?? DEFAULT_COMPANY })),
    employees: mergedData.employees.map((record) => ({ ...record, empresa: record.empresa ?? DEFAULT_COMPANY })),
  };
}

function mergeWithDefaults(data: ErpData): ErpData {
  return {
    ...data,
    conectaCodes: mergeById(defaultErpData.conectaCodes, data.conectaCodes),
    production: mergeById(defaultErpData.production, data.production),
    finance: mergeById(defaultErpData.finance, data.finance),
    vr: mergeById(defaultErpData.vr, data.vr),
    employees: mergeById(defaultErpData.employees, data.employees),
  };
}

function mergeById<T extends { id: string }>(defaults: T[], stored: T[]) {
  const storedIds = new Set(stored.map((item) => item.id));
  return [...stored, ...defaults.filter((item) => !storedIds.has(item.id))];
}

