import type { Lead } from "../backend.d.ts";

export const STATUS_OPTIONS = [
  "Tele Meeting Done",
  "Call Back",
  "Final Negotiation (FN) Planned",
  "Final Negotiation (FN) Done",
  "Final Negotiation (FN) Postponed",
  "Meeting (F2F) Done",
  "Meeting (F2F) Planned",
  "Meeting (F2F) Postponed",
  "Not Contactable",
  "Not Interested",
  "Site Visit (SV) Done",
  "Site Visit (SV) Planned",
  "Site Visit (SV) Postponed",
] as const;

export const PROPERTY_TYPES = [
  "1BHK",
  "2BHK",
  "3BHK",
  "Commercial",
  "New",
  "Resale",
] as const;

export const LEAD_SOURCES = [
  "Instagram",
  "Facebook",
  "Portal",
  "Cold Call",
  "Referral",
] as const;

export function getStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done")) return "badge-done";
  if (s.includes("planned")) return "badge-planned";
  if (s.includes("postponed")) return "badge-postponed";
  if (s.includes("not interested") || s.includes("not contactable"))
    return "badge-notinterested";
  if (s.includes("call back")) return "badge-callback";
  if (s.includes("tele")) return "badge-tele";
  return "badge-planned";
}

export function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return "—";
  try {
    const d = new Date(dateTimeStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTimeStr;
  }
}

export interface ParsedLead {
  fullName: string;
  phone: string;
  budget: string;
  preferredLocation: string;
  propertyType: string;
  leadSource: string;
  status: string;
  nextFollowupDate: string;
  notes: string;
}

const MONTH_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function parseDateDDMonYYYY(raw: string): string {
  if (!raw) return "";
  // Try "DD Mon YYYY" e.g. "15 Jan 2025"
  const match = raw.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const monthKey = match[2].toLowerCase();
    const month = MONTH_MAP[monthKey];
    const year = match[3];
    if (month) return `${year}-${month}-${day}`;
  }
  // Try ISO YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  return "";
}

function splitCSVRow(row: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function parseLeadsCSV(csvText: string): {
  valid: ParsedLead[];
  invalid: number;
} {
  const lines = csvText.split(/\r?\n/);
  const valid: ParsedLead[] = [];
  let invalid = 0;

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCSVRow(line);
    const [
      fullName = "",
      phone = "",
      budget = "",
      preferredLocation = "",
      propertyType = "",
      leadSource = "",
      status = "",
      nextFollowupDateRaw = "",
      notes = "",
    ] = cols;

    if (!fullName.trim() || !phone.trim()) {
      invalid++;
      continue;
    }

    valid.push({
      fullName: fullName.trim(),
      phone: phone.trim(),
      budget: budget.trim(),
      preferredLocation: preferredLocation.trim(),
      propertyType: propertyType.trim(),
      leadSource: leadSource.trim(),
      status: status.trim(),
      nextFollowupDate: parseDateDDMonYYYY(nextFollowupDateRaw.trim()),
      notes: notes.trim(),
    });
  }

  return { valid, invalid };
}

export function exportLeadsToCSV(leads: Lead[]): void {
  const headers = [
    "Full Name",
    "Phone",
    "Budget",
    "Preferred Location",
    "Property Type",
    "Lead Source",
    "Status",
    "Next Follow-up Date",
    "Notes",
  ];

  const escapeCSV = (value: string): string => {
    const str = value ?? "";
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.fullName),
    escapeCSV(lead.phone),
    escapeCSV(lead.budget),
    escapeCSV(lead.preferredLocation),
    escapeCSV(lead.propertyType),
    escapeCSV(lead.leadSource),
    escapeCSV(lead.status),
    escapeCSV(formatDate(lead.nextFollowupDate)),
    escapeCSV(lead.notes),
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `lively-homes-leads-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
