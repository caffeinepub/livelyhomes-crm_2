import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAddLead } from "../hooks/useQueries";
import { type ParsedLead, parseLeadsCSV } from "../lib/constants";

interface ImportLeadsModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "upload" | "preview" | "importing" | "done";

export default function ImportLeadsModal({
  open,
  onClose,
}: ImportLeadsModalProps) {
  const addLead = useAddLead();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [validLeads, setValidLeads] = useState<ParsedLead[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const reset = () => {
    setStep("upload");
    setIsDragging(false);
    setFileName("");
    setValidLeads([]);
    setInvalidCount(0);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { valid, invalid } = parseLeadsCSV(text);
      setValidLeads(valid);
      setInvalidCount(invalid);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleImport = async () => {
    if (validLeads.length === 0) return;
    setStep("importing");
    setProgress({ current: 0, total: validLeads.length });

    let failedCount = 0;

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      try {
        await addLead.mutateAsync({
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
      } catch {
        failedCount++;
      }
      setProgress({ current: i + 1, total: validLeads.length });
    }

    setStep("done");

    const successCount = validLeads.length - failedCount;
    if (successCount > 0) {
      toast.success(
        `Successfully imported ${successCount} lead${successCount !== 1 ? "s" : ""}`,
      );
    }
    if (failedCount > 0) {
      toast.warning(
        `${failedCount} lead${failedCount !== 1 ? "s" : ""} could not be imported`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="leads.import.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-display font-bold">
            Import Leads from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from this CRM to restore your leads.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Step: Upload */}
          {step === "upload" && (
            <button
              type="button"
              data-ocid="leads.import.dropzone"
              className={`relative w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors outline-none
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use a CSV file previously exported from this CRM
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                data-ocid="leads.import.upload_button"
              />
            </button>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div className="space-y-3">
              {/* File name */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">
                  {fileName}
                </span>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Found{" "}
                    <span className="font-semibold">{validLeads.length}</span>{" "}
                    valid lead{validLeads.length !== 1 ? "s" : ""} to import
                  </p>
                </div>

                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                    <XCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-semibold">{invalidCount}</span> row
                      {invalidCount !== 1 ? "s" : ""} skipped (missing name or
                      phone)
                    </p>
                  </div>
                )}

                {validLeads.length === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      No valid leads found. Check the file format.
                    </p>
                  </div>
                )}
              </div>

              {/* Option to change file */}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                onClick={() => {
                  setStep("upload");
                  setFileName("");
                  setValidLeads([]);
                  setInvalidCount(0);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Choose a different file
              </button>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Importing lead {progress.current} of {progress.total}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Please wait, do not close this window
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-950/50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Import complete!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.total} lead{progress.total !== 1 ? "s" : ""}{" "}
                  processed
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "upload" && (
            <Button
              variant="outline"
              onClick={handleClose}
              data-ocid="leads.import.cancel_button"
            >
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                data-ocid="leads.import.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validLeads.length === 0}
                data-ocid="leads.import.confirm_button"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {validLeads.length} Lead
                {validLeads.length !== 1 ? "s" : ""}
              </Button>
            </>
          )}

          {step === "importing" && (
            <Button variant="outline" disabled>
              Importing...
            </Button>
          )}

          {step === "done" && (
            <Button
              onClick={handleClose}
              data-ocid="leads.import.close_button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
