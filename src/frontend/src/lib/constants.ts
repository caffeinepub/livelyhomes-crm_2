import type { Disposition, Lead } from "../backend.d.ts";

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

export interface ParsedDisposition {
  status: string;
  notes: string;
  dateTime: string;
  followupDate: string;
}

export interface ParsedLeadWithDispositions extends ParsedLead {
  dispositions: ParsedDisposition[];
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
  leads: ParsedLeadWithDispositions[];
  invalid: number;
} {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 1) return { leads: [], invalid: 0 };

  const headerCols = splitCSVRow(lines[0]);
  // Detect new format by checking if first column header is ROW_TYPE
  const hasRowType = headerCols[0]?.trim().toUpperCase() === "ROW_TYPE";

  const leads: ParsedLeadWithDispositions[] = [];
  let invalid = 0;

  if (hasRowType) {
    // New format: ROW_TYPE,Full Name,Phone,Budget,Preferred Location,Property Type,Lead Source,Status,Next Follow-up Date,Notes,Disposition Status,Disposition Notes,Disposition DateTime,Disposition FollowupDate
    let currentLead: ParsedLeadWithDispositions | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = splitCSVRow(line);
      const rowType = cols[0]?.trim().toUpperCase();

      if (rowType === "LEAD") {
        const [
          ,
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
          currentLead = null;
          continue;
        }

        currentLead = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          budget: budget.trim(),
          preferredLocation: preferredLocation.trim(),
          propertyType: propertyType.trim(),
          leadSource: leadSource.trim(),
          status: status.trim(),
          nextFollowupDate: parseDateDDMonYYYY(nextFollowupDateRaw.trim()),
          notes: notes.trim(),
          dispositions: [],
        };
        leads.push(currentLead);
      } else if (rowType === "DISPOSITION" && currentLead) {
        const [
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          dispStatus = "",
          dispNotes = "",
          dispDateTime = "",
          dispFollowupDate = "",
        ] = cols;

        currentLead.dispositions.push({
          status: dispStatus.trim(),
          notes: dispNotes.trim(),
          dateTime: dispDateTime.trim(),
          followupDate: dispFollowupDate.trim(),
        });
      }
    }
  } else {
    // Old format (backwards compat): Full Name,Phone,Budget,Preferred Location,Property Type,Lead Source,Status,Next Follow-up Date,Notes
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

      leads.push({
        fullName: fullName.trim(),
        phone: phone.trim(),
        budget: budget.trim(),
        preferredLocation: preferredLocation.trim(),
        propertyType: propertyType.trim(),
        leadSource: leadSource.trim(),
        status: status.trim(),
        nextFollowupDate: parseDateDDMonYYYY(nextFollowupDateRaw.trim()),
        notes: notes.trim(),
        dispositions: [],
      });
    }
  }

  return { leads, invalid };
}

export function exportLeadsToCSV(
  leads: Lead[],
  dispositionsMap: Map<string, Disposition[]>,
): void {
  const escapeCSV = (value: string): string => {
    const str = value ?? "";
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Headers: ROW_TYPE + lead columns + disposition columns
  const headers = [
    "ROW_TYPE",
    "Full Name",
    "Phone",
    "Budget",
    "Preferred Location",
    "Property Type",
    "Lead Source",
    "Status",
    "Next Follow-up Date",
    "Notes",
    "Disposition Status",
    "Disposition Notes",
    "Disposition DateTime",
    "Disposition FollowupDate",
  ];

  const csvRows: string[] = [headers.map((h) => `"${h}"`).join(",")];

  for (const lead of leads) {
    // LEAD row — disposition columns are empty
    const leadRow = [
      escapeCSV("LEAD"),
      escapeCSV(lead.fullName),
      escapeCSV(lead.phone),
      escapeCSV(lead.budget),
      escapeCSV(lead.preferredLocation),
      escapeCSV(lead.propertyType),
      escapeCSV(lead.leadSource),
      escapeCSV(lead.status),
      escapeCSV(formatDate(lead.nextFollowupDate)),
      escapeCSV(lead.notes),
      escapeCSV(""),
      escapeCSV(""),
      escapeCSV(""),
      escapeCSV(""),
    ];
    csvRows.push(leadRow.join(","));

    // DISPOSITION rows — sorted oldest first (dispositionsMap stores newest-first, so reverse)
    const dispositions = dispositionsMap.get(lead.id.toString()) ?? [];
    const sorted = [...dispositions].reverse();
    for (const disp of sorted) {
      const dispRow = [
        escapeCSV("DISPOSITION"),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(""),
        escapeCSV(disp.status),
        escapeCSV(disp.notes),
        escapeCSV(disp.dateTime),
        escapeCSV(disp.followupDate),
      ];
      csvRows.push(dispRow.join(","));
    }
  }

  const csvContent = csvRows.join("\n");
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
