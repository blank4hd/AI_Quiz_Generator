import { Question, QuestionType, Difficulty } from "@/types/quiz";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, RotateCw, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  onRegenerate,
}: QuestionCardProps) {
  const addOption = () => {
    onUpdate({
      options: [
        ...question.options,
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    });
  };

  const removeOption = (optionId: string) => {
    onUpdate({
      options: question.options.filter((opt) => opt.id !== optionId),
    });
  };

  const updateOption = (optionId: string, text: string) => {
    onUpdate({
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const setCorrectAnswer = (optionId: string) => {
    onUpdate({
      options: question.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optionId,
      })),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                Q{index + 1}
              </Badge>
              <Select
                value={question.type}
                onValueChange={(value: QuestionType) =>
                  onUpdate({ type: value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={question.difficulty}
                onValueChange={(value: Difficulty) =>
                  onUpdate({ difficulty: value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onRegenerate}
              title="Regenerate this question"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              title="Delete question"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Question</Label>
          <Textarea
            value={question.stem}
            onChange={(e) => onUpdate({ stem: e.target.value })}
            placeholder="Enter your question..."
            rows={3}
          />
        </div>

        {question.type !== "short-answer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              {question.type === "mcq" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <div key={option.id} className="flex gap-2 items-center">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => setCorrectAnswer(option.id)}
                    className="w-4 h-4 text-primary"
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                  {question.type === "mcq" && question.options.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeOption(option.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Explanation</Label>
          <Textarea
            value={question.explanation}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            placeholder="Explain the correct answer..."
            rows={2}
          />
        </div>

        {question.sourceReference && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Source:</span> {question.sourceReference}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
