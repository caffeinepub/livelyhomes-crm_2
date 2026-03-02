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
