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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddQuestionsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (topic: string, count: number) => void;
}

export function AddQuestionsDialog({
  open,
  onClose,
  onConfirm,
}: AddQuestionsDialogProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);

  const handleConfirm = () => {
    onConfirm(topic, count);
    setTopic("");
    setCount(5);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add AI Questions</DialogTitle>
          <DialogDescription>
            Use AI to generate more questions about this material
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or difficulty prompt</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Focus on chapter 3 concepts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">How many questions to add?</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Generate Questions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
