import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend.d.ts";
import EditLeadModal from "../components/EditLeadModal";
import ImportLeadsModal from "../components/ImportLeadsModal";
import { useDeleteLead, useGetLeads } from "../hooks/useQueries";
import {
  PROPERTY_TYPES,
  STATUS_OPTIONS,
  exportLeadsToCSV,
  formatDate,
  getStatusBadgeClass,
  isOverdue,
} from "../lib/constants";

type SortDirection = "asc" | "desc" | null;

export default function LeadsPage() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useGetLeads();
  const deleteMutation = useDeleteLead();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    let data = leads ?? [];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      data = data.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      data = data.filter((l) => l.status === statusFilter);
    }

    // Property type filter
    if (propertyTypeFilter !== "all") {
      data = data.filter((l) => l.propertyType === propertyTypeFilter);
    }

    // Location filter
    if (locationFilter !== "all") {
      data = data.filter(
        (l) =>
          l.preferredLocation?.toLowerCase().trim() ===
          locationFilter.toLowerCase().trim(),
      );
    }

    // Sort by follow-up date
    if (sortDir) {
      data = [...data].sort((a, b) => {
        if (!a.nextFollowupDate) return 1;
        if (!b.nextFollowupDate) return -1;
        const cmp = a.nextFollowupDate.localeCompare(b.nextFollowupDate);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [
    leads,
    search,
    statusFilter,
    propertyTypeFilter,
    locationFilter,
    sortDir,
  ]);

  // Derive unique locations from existing leads
  const uniqueLocations = useMemo(() => {
    const locs = (leads ?? [])
      .map((l) => l.preferredLocation?.trim())
      .filter((loc): loc is string => !!loc);
    return Array.from(new Set(locs)).sort();
  }, [leads]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Lead deleted successfully");
    } catch {
      toast.error("Failed to delete lead");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleSort = () => {
    setSortDir((prev) =>
      prev === null ? "asc" : prev === "asc" ? "desc" : null,
    );
  };

  const overdueCount = (leads ?? []).filter((l) =>
    isOverdue(l.nextFollowupDate),
  ).length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Leads
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leads?.length ?? 0} total leads
            {overdueCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            data-ocid="leads.import_button"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Leads
          </Button>
          <Button
            variant="outline"
            onClick={() => exportLeadsToCSV(filteredLeads)}
            disabled={filteredLeads.length === 0}
            data-ocid="leads.export_button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Leads
          </Button>
          <Button asChild className="bg-primary hover:bg-navy-600 text-white">
            <Link to="/add-lead">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={propertyTypeFilter}
              onValueChange={setPropertyTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Property Types</SelectItem>
                {PROPERTY_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className={`flex items-center gap-1.5 h-9 px-3 ${sortDir ? "border-primary text-primary" : ""}`}
            >
              {sortDir === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : sortDir === "desc" ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5" />
              )}
              Follow-up Date
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full leads-table">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  Budget
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  Location
                </th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">
                  Follow-up Date
                </th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {search ||
                        statusFilter !== "all" ||
                        propertyTypeFilter !== "all" ||
                        locationFilter !== "all"
                          ? "No leads match your filters."
                          : "No leads yet. Add your first lead!"}
                      </p>
                      {!search &&
                        statusFilter === "all" &&
                        propertyTypeFilter === "all" &&
                        locationFilter === "all" && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Link to="/add-lead">
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Lead
                            </Link>
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const overdue = isOverdue(lead.nextFollowupDate);
                  return (
                    <tr
                      key={lead.id.toString()}
                      className={overdue ? "row-overdue" : ""}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-semibold text-sm text-navy-700 hover:text-accent hover:underline text-left"
                          onClick={() =>
                            navigate({
                              to: "/leads/$id",
                              params: { id: lead.id.toString() },
                            })
                          }
                        >
                          {lead.fullName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {lead.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {lead.budget || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {lead.preferredLocation || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={`text-sm flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-foreground"}`}
                        >
                          {overdue && (
                            <AlertCircle className="h-3 w-3 shrink-0" />
                          )}
                          {formatDate(lead.nextFollowupDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View lead"
                            className="p-1.5 rounded-md hover:bg-navy-50 text-muted-foreground hover:text-navy-700 transition-colors"
                            onClick={() =>
                              navigate({
                                to: "/leads/$id",
                                params: { id: lead.id.toString() },
                              })
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Edit lead"
                            className="p-1.5 rounded-md hover:bg-navy-50 text-muted-foreground hover:text-navy-700 transition-colors"
                            onClick={() => setEditLead(lead)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete lead"
                            className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={() => setDeleteId(lead.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!isLoading && filteredLeads.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {filteredLeads.length} of {leads?.length ?? 0} leads
            </p>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be
              undone and will remove all associated dispositions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit modal */}
      {editLead && (
        <EditLeadModal
          lead={editLead}
          open={!!editLead}
          onClose={() => setEditLead(null)}
        />
      )}

      {/* Import modal */}
      <ImportLeadsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
