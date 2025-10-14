import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { QuizBuilder } from "@/components/QuizBuilder";
import { QuizConfigDialog, QuizConfig } from "@/components/QuizConfigDialog";
import { QuizFormatDialog, QuizFormatConfig } from "@/components/QuizFormatDialog";
import { QuizTaker } from "@/components/QuizTaker";
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
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [quizFormatConfig, setQuizFormatConfig] = useState<QuizFormatConfig>({ timed: false, timeLimit: 30 });
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

  const handleGenerateQuiz = async (config: QuizConfig) => {
    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch('/functions/v1/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: documentContent,
          type: 'generate',
          options: { 
            count: config.numberOfQuestions, 
            difficulty: config.difficulty,
            questionType: config.questionType,
            useDocumentQuestions: config.useDocumentQuestions
          }
        })
      });

      clearInterval(progressInterval);

      // Check if response is empty or not JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response. Please check if Supabase functions are running.");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Server returned empty response. Please check if Supabase functions are running.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error("Server returned invalid JSON. Please check if Supabase functions are running.");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }

      setQuestions(data.questions);
      setProgress(100);
      
      toast({
        title: "Quiz generated!",
        description: `Created ${data.questions.length} questions from your document.`,
      });
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate quiz. Please try again.",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsGenerating(false), 500);
    }
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

  const handleRegenerateQuestion = async (id: string) => {
    const questionIndex = questions.findIndex(q => q.id === id);
    if (questionIndex === -1) return;

    const existingQuestion = questions[questionIndex];

    try {
      const response = await fetch('/functions/v1/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: documentContent,
          type: 'regenerate',
          options: { existingQuestion }
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate question');
      }

      const newQuestion = data.questions[0];

      const newQuestions = [...questions];
      newQuestions[questionIndex] = newQuestion;
      setQuestions(newQuestions);

      toast({
        title: "Question regenerated",
        description: "A new question has been created.",
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Could not regenerate question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestions = async (topic: string, count: number) => {
    try {
      const response = await fetch('/functions/v1/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: documentContent,
          type: 'add',
          options: { topic, count }
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add questions');
      }

      setQuestions([...questions, ...data.questions]);

      toast({
        title: "Questions added",
        description: `Added ${data.questions.length} new questions about ${topic}.`,
      });
    } catch (error) {
      console.error('Add questions error:', error);
      toast({
        title: "Failed to add questions",
        description: error instanceof Error ? error.message : "Could not generate new questions. Please try again.",
        variant: "destructive",
      });
    }
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
                onClick={() => setShowConfigDialog(true)}
                disabled={isGenerating}
              >
                Configure & Generate Quiz
              </Button>
            </div>
          </div>
        ) : isTakingQuiz ? (
          <QuizTaker
            questions={questions}
            onExit={() => setIsTakingQuiz(false)}
            timed={quizFormatConfig.timed}
            timeLimit={quizFormatConfig.timeLimit}
          />
        ) : (
          <QuizBuilder
            questions={questions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRegenerateQuestion={handleRegenerateQuestion}
            onAddQuestions={handleAddQuestions}
            onTakeQuiz={() => setShowFormatDialog(true)}
          />
        )}

        <QuizConfigDialog
          open={showConfigDialog}
          onClose={() => setShowConfigDialog(false)}
          onConfirm={(config) => {
            setShowConfigDialog(false);
            handleGenerateQuiz(config);
          }}
          documentName={documentName}
        />

        <QuizFormatDialog
          open={showFormatDialog}
          onClose={() => setShowFormatDialog(false)}
          onStart={(config) => {
            setQuizFormatConfig(config);
            setIsTakingQuiz(true);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
