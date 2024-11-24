import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
  


// Reusable ReportDialog component for both blog posts and comments
const ReportDialog = ({ reportType, reportId, handleReport }) => {
  const [showReportDialog, setShowReportDialog] = useState(true); // Report dialog visibility
  const [showSuccessDialog, setShowSuccessDialog] = useState(false); // Success dialog visibility
  const [explanation, setExplanation] = useState(""); // Explanation text

  const handleSubmit = async () => {
    if (!explanation.trim()) { // Validation: Ensure explanation is provided
        toast.error("Please provide an explanation.");
        return;
    }

    await handleReport(reportId, explanation, reportType);
    setExplanation("");
    setShowReportDialog(false);
    setShowSuccessDialog(true);
  };

  return (
    <>
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={(open) => setShowReportDialog(open)}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Report {reportType === "post" ? "Post" : "Comment"}</DialogTitle>
            <DialogDescription>Please enter an explanation below</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
              Explanation
            </Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Thank You</DialogTitle>
            <DialogDescription>Thanks, we have received your report. Our team will review it shortly.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportDialog;
