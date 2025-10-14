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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Difficulty, QuestionType } from "@/types/quiz";

interface QuizConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: QuizConfig) => void;
  documentName: string;
}

export interface QuizConfig {
  useDocumentQuestions: boolean;
  questionType: QuestionType | "mixed";
  numberOfQuestions: number;
  difficulty: Difficulty | "mixed";
}

export function QuizConfigDialog({
  open,
  onClose,
  onConfirm,
  documentName,
}: QuizConfigDialogProps) {
  const [useDocumentQuestions, setUseDocumentQuestions] = useState<boolean>(true);
  const [questionType, setQuestionType] = useState<QuestionType | "mixed">("mixed");
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty | "mixed">("mixed");

  const handleConfirm = () => {
    onConfirm({
      useDocumentQuestions,
      questionType,
      numberOfQuestions,
      difficulty,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Your Quiz</DialogTitle>
          <DialogDescription>
            Customize your quiz based on "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Question Source</Label>
            <RadioGroup
              value={useDocumentQuestions ? "document" : "custom"}
              onValueChange={(value) => setUseDocumentQuestions(value === "document")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="document" id="document" />
                <Label htmlFor="document" className="font-normal cursor-pointer">
                  Use questions from the document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Generate custom quiz questions
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of Questions</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Question Type</Label>
            <Select value={questionType} onValueChange={(value) => setQuestionType(value as QuestionType | "mixed")}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="mcq">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty | "mixed")}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Generate Quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
