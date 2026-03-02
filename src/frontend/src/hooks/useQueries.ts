import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardStats, Disposition, Lead } from "../backend.d.ts";
import { useActor } from "./useActor";

const TODAY = () => new Date().toISOString().split("T")[0];

// ─── Leads ──────────────────────────────────────────────────────────────────

export function useGetLeads() {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLead(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Lead>({
    queryKey: ["lead", id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getLead(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRecentLeads() {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ["recent-leads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTodayFollowups() {
  const { actor, isFetching } = useActor();
  const today = TODAY();
  return useQuery<Lead[]>({
    queryKey: ["today-followups", today],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodayFollowups(today);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOverdueLeads() {
  const { actor, isFetching } = useActor();
  const today = TODAY();
  return useQuery<Lead[]>({
    queryKey: ["overdue-leads", today],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOverdueLeads(today);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  const today = TODAY();
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", today],
    queryFn: async () => {
      if (!actor)
        return {
          totalLeads: BigInt(0),
          followupsToday: BigInt(0),
          closedLeads: BigInt(0),
          siteVisitsPlanned: BigInt(0),
        };
      return actor.getDashboardStats(today);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      phone: string;
      budget: string;
      preferredLocation: string;
      propertyType: string;
      leadSource: string;
      status: string;
      nextFollowupDate: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addLead(
        data.fullName,
        data.phone,
        data.budget,
        data.preferredLocation,
        data.propertyType,
        data.leadSource,
        data.status,
        data.nextFollowupDate,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["today-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-leads"] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      fullName: string;
      phone: string;
      budget: string;
      preferredLocation: string;
      propertyType: string;
      leadSource: string;
      status: string;
      nextFollowupDate: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateLead(
        data.id,
        data.fullName,
        data.phone,
        data.budget,
        data.preferredLocation,
        data.propertyType,
        data.leadSource,
        data.status,
        data.nextFollowupDate,
        data.notes,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({
        queryKey: ["lead", variables.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["recent-leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["today-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-leads"] });
    },
  });
}

export function useDeleteLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteLead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["today-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-leads"] });
    },
  });
}

// ─── Dispositions ────────────────────────────────────────────────────────────

export function useGetDispositions(leadId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Disposition[]>({
    queryKey: ["dispositions", leadId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDispositions(leadId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDisposition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      leadId: bigint;
      status: string;
      notes: string;
      dateTime: string;
      followupDate: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addDisposition(
        data.leadId,
        data.status,
        data.notes,
        data.dateTime,
        data.followupDate,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dispositions", variables.leadId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["lead", variables.leadId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["today-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-leads"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leads"] });
    },
  });
}
