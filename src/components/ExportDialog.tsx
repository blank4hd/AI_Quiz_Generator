import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Question } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
}

export function ExportDialog({ open, onClose, questions }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "aiken" | "qti">("csv");
  const { toast } = useToast();

  const exportToCSV = () => {
    const headers = ["Question", "Type", "Answer", "Difficulty", "Explanation"];
    const rows = questions.map((q) => [
      q.stem,
      q.type,
      q.options.find((o) => o.isCorrect)?.text || "",
      q.difficulty,
      q.explanation,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Quiz exported successfully!",
      description: "Your CSV file is ready.",
    });
    onClose();
  };

  const handleExport = () => {
    if (format === "csv") {
      exportToCSV();
    } else {
      toast({
        title: "Coming soon",
        description: `${format.toUpperCase()} export will be available soon.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Quiz</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Choose export format</Label>
            <Select
              value={format}
              onValueChange={(value: "csv" | "aiken" | "qti") =>
                setFormat(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="aiken">Aiken Format</SelectItem>
                <SelectItem value="qti">QTI Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Download Quiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
