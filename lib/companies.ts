import type { CompanyName, ErpData } from "./types";

export const companies: CompanyName[] = ["ALPHA TELECOM", "BETA TELECOM", "GAMMA TELECOM"];

export const DEFAULT_COMPANY: CompanyName = "GAMMA TELECOM";

export const COMPANY_STORAGE_KEY = "fieldpro-active-company";

export const LEGACY_COMPANY: CompanyName = "ALPHA TELECOM";

export function isCompanyName(value: unknown): value is CompanyName {
  return typeof value === "string" && companies.includes(value as CompanyName);
}

export function getRecordCompany(record: { empresa?: CompanyName | string }) {
  return isCompanyName(record.empresa) ? record.empresa : LEGACY_COMPANY;
}

export function filterErpDataByCompany(data: ErpData, empresa: CompanyName): ErpData {
  return {
    ...data,
    production: data.production.filter((record) => getRecordCompany(record) === empresa),
    finance: data.finance.filter((record) => getRecordCompany(record) === empresa),
    vr: data.vr.filter((record) => getRecordCompany(record) === empresa),
    employees: data.employees.filter((record) => getRecordCompany(record) === empresa),
  };
}
