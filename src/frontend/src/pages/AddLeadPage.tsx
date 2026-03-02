import { Button } from "@/components/ui/button";
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
import { useNavigate } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddLead } from "../hooks/useQueries";
import { LEAD_SOURCES, PROPERTY_TYPES, STATUS_OPTIONS } from "../lib/constants";

interface FormData {
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

const INITIAL: FormData = {
  fullName: "",
  phone: "",
  budget: "",
  preferredLocation: "",
  propertyType: "",
  leadSource: "",
  status: "",
  nextFollowupDate: "",
  notes: "",
};

export default function AddLeadPage() {
  const navigate = useNavigate();
  const addLead = useAddLead();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const update = (field: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
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
      await addLead.mutateAsync({
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
      toast.success("Lead added successfully!");
      navigate({ to: "/leads" });
    } catch {
      toast.error("Failed to add lead. Please try again.");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Add New Lead
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Fill in the details to add a new lead to the system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Rahul Sharma"
                value={form.fullName}
                onChange={(e) => update("fullName")(e.target.value)}
                className={errors.fullName ? "border-red-400" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => update("phone")(e.target.value)}
                className={errors.phone ? "border-red-400" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Property Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                placeholder="e.g. 50 Lakhs"
                value={form.budget}
                onChange={(e) => update("budget")(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preferredLocation">Preferred Location</Label>
              <Input
                id="preferredLocation"
                placeholder="e.g. Bandra West, Mumbai"
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
                  <SelectValue placeholder="Select property type" />
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
          </div>
        </div>

        {/* Status & Follow-up */}
        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Status & Follow-up
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="nextFollowupDate">Next Follow-up Date</Label>
              <Input
                id="nextFollowupDate"
                type="date"
                value={form.nextFollowupDate}
                onChange={(e) => update("nextFollowupDate")(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this lead..."
              value={form.notes}
              onChange={(e) => update("notes")(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/leads" })}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={addLead.isPending}
            className="flex-1 sm:flex-none bg-primary hover:bg-navy-600 text-white"
          >
            {addLead.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Lead...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Lead
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
