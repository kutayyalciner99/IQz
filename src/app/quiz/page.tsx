'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface FeedbackResponse {
  feedback: {
    questionIndex: number;
    isCorrect: boolean;
    explanation: string;
  }[];
  totalScore: string;
  suggestions: string;
}

export default function QuizPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizStarted, setQuizStarted] = useState(false);

  const generateNewQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedAnswers([]);
    setFeedback(null);
    setSubmitted(false);
    setQuizStarted(true);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          difficulty: difficulty
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;

    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const submitQuiz = async () => {
    if (selectedAnswers.length !== questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          action: 'feedback',
          userAnswers: questions.map((q, idx) => ({
            question: q.question,
            userAnswer: q.options[selectedAnswers[idx]],
            correctAnswer: q.options[q.correct],
            isCorrect: selectedAnswers[idx] === q.correct
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      setSubmitted(true);
    } catch (err) {
      console.error('Error getting feedback:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setSelectedAnswers([]);
    setFeedback(null);
    setSubmitted(false);
    setQuizStarted(false);
    setTopic('');
    setDifficulty('medium');
  };

  const getOptionClassName = (questionIdx: number, optionIdx: number) => {
    const baseClass = "p-2 rounded cursor-pointer pl-4 border transition-colors";

    if (!submitted) {
      return `${baseClass} ${selectedAnswers[questionIdx] === optionIdx
        ? 'bg-blue-50 border-blue-300'
        : 'hover:bg-slate-50'
        }`;
    }

    if (optionIdx === questions[questionIdx].correct) {
      return `${baseClass} bg-green-50 border-green-300`;
    }

    if (selectedAnswers[questionIdx] === optionIdx) {
      return `${baseClass} ${optionIdx === questions[questionIdx].correct
        ? 'bg-green-50 border-green-300'
        : 'bg-red-50 border-red-300'
        }`;
    }

    return `${baseClass} opacity-50`;
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
     <Link href="/" className="inline-block mb-4">
  <Button variant="ghost" className="gap-2">
    <ArrowLeft className="h-4 w-4" />
    Back to Home
  </Button>
</Link>

      <Card className="p-6">
        {!quizStarted ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Quiz Topic</Label>
              <Input
                id="topic"
                placeholder="Enter a topic (e.g., Linear Algebra, Cells, Programming)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateNewQuiz}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? 'Generating Quiz...' : 'Start Quiz'}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">{topic}</h2>
                <p className="text-sm text-gray-500 capitalize">{difficulty} difficulty</p>
              </div>
              <div className="flex gap-4">
                {submitted && (
                  <Button
                    onClick={resetQuiz}
                    variant="outline"
                  >
                    New Topic
                  </Button>
                )}
                {!submitted && questions.length > 0 && (
                  <Button
                    onClick={submitQuiz}
                    disabled={loading || selectedAnswers.length !== questions.length}
                    variant="secondary"
                  >
                    Submit Answers
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {feedback && (
              <Alert className="mb-6">
                <AlertTitle className="flex items-center gap-2">
                  Quiz Results
                  <Badge variant="secondary">
                    {feedback.totalScore}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {feedback.suggestions}
                </AlertDescription>
              </Alert>
            )}

            {questions.length > 0 && (
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={idx} className="border p-4 rounded shadow-sm">
                    <h3 className="font-bold mb-2">
                      {idx + 1}. {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          onClick={() => handleOptionSelect(idx, optIdx)}
                          className={getOptionClassName(idx, optIdx)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>

                    {submitted && feedback?.feedback[idx] && (
                      <div className={`mt-3 p-3 rounded ${feedback.feedback[idx].isCorrect
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                        }`}>
                        <p className="text-sm">{feedback.feedback[idx].explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}