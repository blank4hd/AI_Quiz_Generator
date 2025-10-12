import { Question } from "@/types/quiz";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useState } from "react";
import { AddQuestionsDialog } from "./AddQuestionsDialog";
import { ExportDialog } from "./ExportDialog";

interface QuizBuilderProps {
  questions: Question[];
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onRegenerateQuestion: (id: string) => void;
  onAddQuestions: (topic: string, count: number) => void;
}

export function QuizBuilder({
  questions,
  onUpdateQuestion,
  onDeleteQuestion,
  onRegenerateQuestion,
  onAddQuestions,
}: QuizBuilderProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Your AI-Generated Quiz</h2>
          <p className="text-muted-foreground mt-2">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add AI Questions
          </Button>
          <Button
            onClick={() => setShowExportDialog(true)}
            disabled={questions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Quiz
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No questions yet — upload a document or add AI questions to start.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
              onDelete={() => onDeleteQuestion(question.id)}
              onRegenerate={() => onRegenerateQuestion(question.id)}
            />
          ))}
        </div>
      )}

      <AddQuestionsDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onConfirm={onAddQuestions}
      />

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        questions={questions}
      />
    </div>
  );
}
