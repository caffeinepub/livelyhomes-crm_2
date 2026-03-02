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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend.d.ts";
import { useUpdateLead } from "../hooks/useQueries";
import { LEAD_SOURCES, PROPERTY_TYPES, STATUS_OPTIONS } from "../lib/constants";

interface Props {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export default function EditLeadModal({ lead, open, onClose }: Props) {
  const updateLead = useUpdateLead();

  const [form, setForm] = useState({
    fullName: lead.fullName,
    phone: lead.phone,
    budget: lead.budget,
    preferredLocation: lead.preferredLocation,
    propertyType: lead.propertyType,
    leadSource: lead.leadSource,
    status: lead.status,
    nextFollowupDate: lead.nextFollowupDate,
    notes: lead.notes,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form when lead changes
  useEffect(() => {
    setForm({
      fullName: lead.fullName,
      phone: lead.phone,
      budget: lead.budget,
      preferredLocation: lead.preferredLocation,
      propertyType: lead.propertyType,
      leadSource: lead.leadSource,
      status: lead.status,
      nextFollowupDate: lead.nextFollowupDate,
      notes: lead.notes,
    });
    setErrors({});
  }, [lead]);

  const update = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.status) errs.status = "Status is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        budget: form.budget.trim(),
        preferredLocation: form.preferredLocation.trim(),
        propertyType: form.propertyType,
        leadSource: form.leadSource,
        status: form.status,
        nextFollowupDate: form.nextFollowupDate,
        notes: form.notes.trim(),
      });
      toast.success("Lead updated successfully");
      onClose();
    } catch {
      toast.error("Failed to update lead");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && !updateLead.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-fullName"
                value={form.fullName}
                onChange={(e) => update("fullName")(e.target.value)}
                className={errors.fullName ? "border-red-400" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => update("phone")(e.target.value)}
                className={errors.phone ? "border-red-400" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-budget">Budget</Label>
              <Input
                id="edit-budget"
                value={form.budget}
                onChange={(e) => update("budget")(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Preferred Location</Label>
              <Input
                id="edit-location"
                value={form.preferredLocation}
                onChange={(e) => update("preferredLocation")(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Property Type</Label>
              <Select
                value={form.propertyType}
                onValueChange={update("propertyType")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Lead Source</Label>
              <Select
                value={form.leadSource}
                onValueChange={update("leadSource")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={form.status} onValueChange={update("status")}>
                <SelectTrigger
                  className={errors.status ? "border-red-400" : ""}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-followup">Next Follow-up Date</Label>
              <Input
                id="edit-followup"
                type="date"
                value={form.nextFollowupDate}
                onChange={(e) => update("nextFollowupDate")(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => update("notes")(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateLead.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLead.isPending}
              className="bg-primary hover:bg-navy-600 text-white"
            >
              {updateLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
