import { useState, useEffect } from "react";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface QuizTakerProps {
  questions: Question[];
  onExit: () => void;
  timed: boolean;
  timeLimit?: number; // in minutes
}

export function QuizTaker({ questions, onExit, timed, timeLimit = 30 }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timed ? timeLimit * 60 : 0);

  useEffect(() => {
    if (!timed || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timed, showResults]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (q.type === "mcq" || q.type === "true-false") {
        const correctOption = q.options.find((opt) => opt.isCorrect);
        if (correctOption && userAnswer === correctOption.id) {
          correct++;
        }
      } else if (q.type === "short-answer") {
        const correctOption = q.options.find((opt) => opt.isCorrect);
        if (correctOption && userAnswer?.toLowerCase().trim() === correctOption.text.toLowerCase().trim()) {
          correct++;
        }
      }
    });
    return { correct, total: questions.length, percentage: (correct / questions.length) * 100 };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold">
                {score.percentage.toFixed(0)}%
              </div>
              <div className="text-xl text-muted-foreground">
                {score.correct} out of {score.total} correct
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, idx) => {
                const userAnswer = answers[question.id];
                const correctOption = question.options.find((opt) => opt.isCorrect);
                const isCorrect = question.type === "short-answer"
                  ? userAnswer?.toLowerCase().trim() === correctOption?.text.toLowerCase().trim()
                  : userAnswer === correctOption?.id;

                return (
                  <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium mb-2">
                            Question {idx + 1}: {question.stem}
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="text-muted-foreground">
                              Your answer: {question.type === "short-answer" 
                                ? userAnswer || "(not answered)"
                                : question.options.find(o => o.id === userAnswer)?.text || "(not answered)"}
                            </div>
                            {!isCorrect && (
                              <div className="text-green-600">
                                Correct answer: {correctOption?.text}
                              </div>
                            )}
                          </div>
                          {question.explanation && (
                            <div className="mt-2 text-sm p-3 bg-muted rounded-md">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button onClick={onExit} className="w-full" size="lg">
              Exit Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {timed && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.stem}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.type === "mcq" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={handleAnswer}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === "true-false" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={handleAnswer}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === "short-answer" && (
            <Input
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          )}

          <div className="flex gap-3 justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit}>
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
