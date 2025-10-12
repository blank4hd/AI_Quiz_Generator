import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { QuizBuilder } from "@/components/QuizBuilder";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileProcessed = (content: string, fileName: string) => {
    setDocumentContent(content);
    setDocumentName(fileName);
  };

  const generateMockQuestions = (count: number = 5): Question[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: crypto.randomUUID(),
      type: "mcq" as const,
      stem: `Sample question ${i + 1} generated from your document?`,
      options: [
        { id: crypto.randomUUID(), text: "Option A", isCorrect: true },
        { id: crypto.randomUUID(), text: "Option B", isCorrect: false },
        { id: crypto.randomUUID(), text: "Option C", isCorrect: false },
        { id: crypto.randomUUID(), text: "Option D", isCorrect: false },
      ],
      explanation: "This is a sample explanation for the correct answer.",
      difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)] as any,
      sourceReference: `Page ${Math.floor(Math.random() * 10) + 1}`,
    }));
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Simulate AI processing with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Mock AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    clearInterval(interval);
    setProgress(100);
    
    const newQuestions = generateMockQuestions(5);
    setQuestions(newQuestions);
    setIsGenerating(false);

    toast({
      title: "Quiz generated!",
      description: `Created ${newQuestions.length} questions from your document.`,
    });
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast({
      title: "Question deleted",
      description: "The question has been removed from your quiz.",
    });
  };

  const handleRegenerateQuestion = (id: string) => {
    const newQuestion = generateMockQuestions(1)[0];
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...newQuestion, id } : q))
    );
    toast({
      title: "Question regenerated",
      description: "A new question has been generated.",
    });
  };

  const handleAddQuestions = async (topic: string, count: number) => {
    toast({
      title: "Generating questions...",
      description: `Creating ${count} new questions about: ${topic || "your document"}`,
    });

    // Mock AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newQuestions = generateMockQuestions(count);
    setQuestions((prev) => [...prev, ...newQuestions]);

    toast({
      title: "Questions added!",
      description: `Added ${count} new questions to your quiz.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        {!documentContent ? (
          <FileUpload onFileProcessed={handleFileProcessed} />
        ) : questions.length === 0 ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Document Ready</h2>
              <p className="text-muted-foreground">
                We've processed <span className="font-semibold">{documentName}</span>
              </p>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <Progress value={progress} />
                <p className="text-center text-sm text-muted-foreground">
                  AI is analyzing your document and generating questions...
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Quiz"}
              </Button>
            </div>
          </div>
        ) : (
          <QuizBuilder
            questions={questions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRegenerateQuestion={handleRegenerateQuestion}
            onAddQuestions={handleAddQuestions}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
