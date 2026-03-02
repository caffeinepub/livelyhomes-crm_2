import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import {
  Bell,
  Home,
  LayoutDashboard,
  Menu,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGetOverdueLeads, useGetTodayFollowups } from "./hooks/useQueries";
import AddLeadPage from "./pages/AddLeadPage";
import DashboardPage from "./pages/DashboardPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import LeadsPage from "./pages/LeadsPage";

// ─── Layout ──────────────────────────────────────────────────────────────────

function NotificationBadge() {
  const { data: todayFollowups } = useGetTodayFollowups();
  const { data: overdueLeads } = useGetOverdueLeads();
  const count = (todayFollowups?.length ?? 0) + (overdueLeads?.length ?? 0);
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/add-lead", label: "Add Lead", icon: UserPlus },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`crm-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Home className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white leading-tight">
              LivelyHomes
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">
              Rental & New Property
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] uppercase tracking-widest font-semibold text-sidebar-foreground/40 mb-2">
            Navigation
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "active" }}
              activeOptions={to === "/" ? { exact: true } : undefined}
              className="crm-sidebar-item"
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border space-y-1">
          <p className="text-[11px] text-sidebar-foreground/40 text-center">
            LivelyHomes CRM v1.0
          </p>
          <p className="text-[10px] text-sidebar-foreground/30 text-center">
            © {new Date().getFullYear()} Built with{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sidebar-foreground/60 underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display font-bold text-navy-700 text-base lg:text-lg leading-tight">
              LivelyHomes{" "}
              <span className="text-muted-foreground font-normal hidden sm:inline">
                Rental & New Property
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <NotificationBadge />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leads",
  component: LeadsPage,
});

const addLeadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-lead",
  component: AddLeadPage,
});

const leadDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leads/$id",
  component: LeadDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  leadsRoute,
  addLeadRoute,
  leadDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
