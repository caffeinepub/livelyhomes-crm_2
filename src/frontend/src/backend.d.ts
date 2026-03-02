import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Lead {
    id: bigint;
    status: string;
    propertyType: string;
    createdAt: bigint;
    fullName: string;
    preferredLocation: string;
    notes: string;
    leadSource: string;
    phone: string;
    nextFollowupDate: string;
    budget: string;
}
export interface DashboardStats {
    followupsToday: bigint;
    totalLeads: bigint;
    closedLeads: bigint;
    siteVisitsPlanned: bigint;
}
export interface Disposition {
    id: bigint;
    status: string;
    createdAt: bigint;
    leadId: bigint;
    notes: string;
    followupDate: string;
    dateTime: string;
}
export interface backendInterface {
    addDisposition(leadId: bigint, status: string, notes: string, dateTime: string, followupDate: string): Promise<Disposition>;
    addLead(fullName: string, phone: string, budget: string, preferredLocation: string, propertyType: string, leadSource: string, status: string, nextFollowupDate: string, notes: string): Promise<Lead>;
    deleteLead(id: bigint): Promise<boolean>;
    getDashboardStats(todayDate: string): Promise<DashboardStats>;
    getDispositions(leadId: bigint): Promise<Array<Disposition>>;
    getLead(id: bigint): Promise<Lead>;
    getLeads(): Promise<Array<Lead>>;
    getOverdueLeads(todayDate: string): Promise<Array<Lead>>;
    getRecentLeads(): Promise<Array<Lead>>;
    getTodayFollowups(todayDate: string): Promise<Array<Lead>>;
    updateLead(id: bigint, fullName: string, phone: string, budget: string, preferredLocation: string, propertyType: string, leadSource: string, status: string, nextFollowupDate: string, notes: string): Promise<Lead>;
}
