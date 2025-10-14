import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuizFormatDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (config: QuizFormatConfig) => void;
}

export interface QuizFormatConfig {
  timed: boolean;
  timeLimit: number; // in minutes
}

export function QuizFormatDialog({ open, onClose, onStart }: QuizFormatDialogProps) {
  const [timed, setTimed] = useState<boolean>(false);
  const [timeLimit, setTimeLimit] = useState<number>(30);

  const handleStart = () => {
    onStart({ timed, timeLimit });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quiz Format</DialogTitle>
          <DialogDescription>
            Configure how you want to take this quiz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Quiz Mode</Label>
            <RadioGroup
              value={timed ? "timed" : "untimed"}
              onValueChange={(value) => setTimed(value === "timed")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="untimed" id="untimed" />
                <Label htmlFor="untimed" className="font-normal cursor-pointer">
                  Untimed - Take as long as you need
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="timed" id="timed" />
                <Label htmlFor="timed" className="font-normal cursor-pointer">
                  Timed - Complete within a time limit
                </Label>
              </div>
            </RadioGroup>
          </div>

          {timed && (
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={1}
                max={180}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart}>
            Start Quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
