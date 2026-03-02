import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Lead } from "../backend.d.ts";
import {
  useGetDashboardStats,
  useGetOverdueLeads,
  useGetRecentLeads,
  useGetTodayFollowups,
} from "../hooks/useQueries";
import { formatDate, getStatusBadgeClass, isOverdue } from "../lib/constants";

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: bigint | number | undefined;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground">
              {value !== undefined ? Number(value).toLocaleString() : "0"}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Row ────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: Lead }) {
  const overdue = isOverdue(lead.nextFollowupDate);
  return (
    <Link
      to="/leads/$id"
      params={{ id: lead.id.toString() }}
      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:shadow-card cursor-pointer group ${
        overdue
          ? "bg-red-50 border-red-100"
          : "bg-card border-border hover:border-navy-200"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm shrink-0">
          {lead.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {lead.fullName}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3 shrink-0" />
            {lead.phone}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
        >
          {lead.status}
        </span>
        {overdue && (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-navy-600 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Follow-up Card ──────────────────────────────────────────────────────────

function FollowupCard({ lead }: { lead: Lead }) {
  const overdue = isOverdue(lead.nextFollowupDate);
  return (
    <Link
      to="/leads/$id"
      params={{ id: lead.id.toString() }}
      className={`flex items-start gap-3 p-3 rounded-lg border group transition-all hover:shadow-card ${
        overdue
          ? "bg-red-50 border-red-200"
          : "bg-navy-50 border-navy-100 hover:border-navy-200"
      }`}
    >
      <div className="h-8 w-8 rounded-full bg-navy-700 flex items-center justify-center text-white font-semibold text-sm shrink-0 mt-0.5">
        {lead.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{lead.fullName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
          >
            {lead.status}
          </span>
          <span
            className={`text-xs font-medium flex items-center gap-1 ${overdue ? "text-red-500" : "text-navy-600"}`}
          >
            <Clock className="h-3 w-3 shrink-0" />
            {overdue
              ? `Overdue: ${formatDate(lead.nextFollowupDate)}`
              : formatDate(lead.nextFollowupDate)}
          </span>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-navy-600 transition-colors mt-1 shrink-0" />
    </Link>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Loading Skeletons ───────────────────────────────────────────────────────

function LeadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-24 rounded-md" />
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentLeads, isLoading: recentLoading } = useGetRecentLeads();
  const { data: todayFollowups, isLoading: todayLoading } =
    useGetTodayFollowups();
  const { data: overdueLeads, isLoading: overdueLoading } =
    useGetOverdueLeads();

  const statCards = [
    {
      label: "Total Leads",
      value: stats?.totalLeads,
      icon: <Users className="h-5 w-5" />,
      color: "#1e3a8a",
    },
    {
      label: "Follow-ups Today",
      value: stats?.followupsToday,
      icon: <CalendarClock className="h-5 w-5" />,
      color: "#0369a1",
    },
    {
      label: "Site Visits Planned",
      value: stats?.siteVisitsPlanned,
      icon: <MapPin className="h-5 w-5" />,
      color: "#0f766e",
    },
    {
      label: "Closed Leads",
      value: stats?.closedLeads,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "#166534",
    },
  ];

  const overdueCount = overdueLeads?.length ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Overdue alert */}
      {!overdueLoading && overdueCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdueCount} overdue follow-up{overdueCount > 1 ? "s" : ""}{" "}
            require your attention.
          </p>
          <Link
            to="/leads"
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 whitespace-nowrap"
          >
            View All →
          </Link>
        </div>
      )}

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Leads */}
        <section className="bg-card rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">
              Recent Leads
            </h3>
            <Link
              to="/leads"
              className="text-xs font-medium text-accent hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <LeadRowSkeleton key={i} />
              ))
            ) : recentLeads && recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <LeadRow key={lead.id.toString()} lead={lead} />
              ))
            ) : (
              <EmptyState message="No leads yet. Add your first lead to get started." />
            )}
          </div>
        </section>

        {/* Today's Follow-ups */}
        <section className="bg-card rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">
              Today's Follow-ups
            </h3>
            {!todayLoading && todayFollowups && todayFollowups.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-navy-100 text-navy-700">
                {todayFollowups.length} due
              </span>
            )}
          </div>

          <div className="space-y-2">
            {todayLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <LeadRowSkeleton key={i} />
              ))
            ) : todayFollowups && todayFollowups.length > 0 ? (
              todayFollowups.map((lead) => (
                <FollowupCard key={lead.id.toString()} lead={lead} />
              ))
            ) : (
              <EmptyState message="No follow-ups scheduled for today. Great job!" />
            )}
          </div>

          {/* Overdue section within follow-ups */}
          {!overdueLoading && overdueLeads && overdueLeads.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue ({overdueLeads.length})
              </p>
              <div className="space-y-2">
                {overdueLeads.slice(0, 3).map((lead) => (
                  <FollowupCard key={lead.id.toString()} lead={lead} />
                ))}
                {overdueLeads.length > 3 && (
                  <Link
                    to="/leads"
                    className="block text-center text-xs font-medium text-red-500 hover:underline py-1"
                  >
                    +{overdueLeads.length - 3} more overdue
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
