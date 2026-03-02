import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Share2,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Disposition } from "../backend.d.ts";
import EditLeadModal from "../components/EditLeadModal";
import {
  useAddDisposition,
  useGetDispositions,
  useGetLead,
} from "../hooks/useQueries";
import {
  STATUS_OPTIONS,
  formatDate,
  formatDateTime,
  getStatusBadgeClass,
  isOverdue,
} from "../lib/constants";

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-600 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Disposition Card ────────────────────────────────────────────────────────

function DispositionCard({
  disposition,
  isLast,
}: {
  disposition: Disposition;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-5">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
      )}

      {/* Dot */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border-2 border-primary mt-0.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-4 shadow-xs hover:shadow-card transition-shadow">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClass(disposition.status)}`}
          >
            {disposition.status}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatDateTime(disposition.dateTime)}
          </span>
        </div>
        {disposition.notes && (
          <p className="mt-2.5 text-sm text-foreground leading-relaxed">
            {disposition.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Add Disposition Modal ────────────────────────────────────────────────────

function AddDispositionModal({
  open,
  leadId,
  onClose,
}: {
  open: boolean;
  leadId: bigint;
  onClose: () => void;
}) {
  const addDisposition = useAddDisposition();
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [dateTime, setDateTime] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [followupDate, setFollowupDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setError("Please select a status");
      return;
    }
    try {
      await addDisposition.mutateAsync({
        leadId,
        status,
        notes: notes.trim(),
        dateTime,
        followupDate,
      });
      toast.success("Disposition added successfully");
      onClose();
      setStatus("");
      setNotes("");
      setDateTime(new Date().toISOString().slice(0, 16));
      setFollowupDate("");
      setError("");
    } catch {
      toast.error("Failed to add disposition");
    }
  };

  const handleClose = () => {
    if (!addDisposition.isPending) {
      onClose();
      setStatus("");
      setNotes("");
      setFollowupDate("");
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Disposition</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setError("");
              }}
            >
              <SelectTrigger className={error ? "border-red-400" : ""}>
                <SelectValue placeholder="Select interaction status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dispo-datetime">Date & Time</Label>
            <Input
              id="dispo-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dispo-followup">
              Next Follow-up Date{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional — updates lead's follow-up date)
              </span>
            </Label>
            <Input
              id="dispo-followup"
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dispo-notes">Notes</Label>
            <Textarea
              id="dispo-notes"
              placeholder="Add notes about this interaction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addDisposition.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addDisposition.isPending}
              className="bg-primary hover:bg-navy-600 text-white"
            >
              {addDisposition.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Disposition"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Detail Page ─────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams({ from: "/leads/$id" });
  const leadId = BigInt(id);

  const { data: lead, isLoading: leadLoading } = useGetLead(leadId);
  const { data: dispositions, isLoading: dispositionsLoading } =
    useGetDispositions(leadId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);

  const sortedDispositions = dispositions
    ? [...dispositions].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      )
    : [];

  const overdue = lead ? isOverdue(lead.nextFollowupDate) : false;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {/* Lead Header Card */}
      {leadLoading ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : lead ? (
        <div
          className={`bg-card rounded-xl border shadow-card overflow-hidden ${
            overdue ? "border-red-200" : "border-border"
          }`}
        >
          {/* Card top bar */}
          {overdue && (
            <div className="flex items-center gap-2 px-5 py-2 bg-red-50 border-b border-red-200">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-xs font-medium text-red-600">
                Follow-up overdue since {formatDate(lead.nextFollowupDate)}
              </p>
            </div>
          )}

          <div className="p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-navy-700 flex items-center justify-center text-white font-display font-bold text-lg">
                  {lead.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    {lead.fullName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClass(lead.status)}`}
                    >
                      {lead.status}
                    </span>
                    {lead.leadSource && (
                      <span className="text-xs text-muted-foreground">
                        via {lead.leadSource}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDispositionModal(true)}
                  className="bg-primary hover:bg-navy-600 text-white gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Disposition
                </Button>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <InfoRow
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={lead.phone}
              />
              <InfoRow
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label="Budget"
                value={lead.budget}
              />
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Preferred Location"
                value={lead.preferredLocation}
              />
              <InfoRow
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="Property Type"
                value={lead.propertyType}
              />
              <InfoRow
                icon={<Share2 className="h-3.5 w-3.5" />}
                label="Lead Source"
                value={lead.leadSource}
              />
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Next Follow-up"
                value={
                  lead.nextFollowupDate
                    ? formatDate(lead.nextFollowupDate)
                    : "—"
                }
              />
            </div>

            {lead.notes && (
              <div className="mt-5 p-4 bg-muted/40 rounded-lg border border-border">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Lead not found.</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link to="/leads">Back to Leads</Link>
          </Button>
        </div>
      )}

      {/* Disposition Timeline */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Disposition History
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sortedDispositions.length} interaction
              {sortedDispositions.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDispositionModal(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {dispositionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="h-20 flex-1 rounded-xl" />
              </div>
            ))}
          </div>
        ) : sortedDispositions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No dispositions yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Track each interaction with this lead by adding a disposition.
            </p>
            <Button
              size="sm"
              onClick={() => setShowDispositionModal(true)}
              className="mt-3 bg-primary hover:bg-navy-600 text-white gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Disposition
            </Button>
          </div>
        ) : (
          <div className="relative">
            {sortedDispositions.map((d, i) => (
              <DispositionCard
                key={d.id.toString()}
                disposition={d}
                isLast={i === sortedDispositions.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {lead && (
        <EditLeadModal
          lead={lead}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <AddDispositionModal
        open={showDispositionModal}
        leadId={leadId}
        onClose={() => setShowDispositionModal(false)}
      />
    </div>
  );
}
