'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, BrainCircuit, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">

      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-12">Learning Tools</h1>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center space-y-4 h-full">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold">Adaptive Quiz System</h2>
              <p className="text-center text-gray-600 flex-grow">
                Generate custom quizzes on any topic. Test your knowledge with interactive questions and get instant feedback.
              </p>
              <Link href="/quiz" className="w-full">
                <Button className="w-full mt-4">
                  Start Quiz
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center space-y-4 h-full">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold">Content Simplifier</h2>
              <p className="text-center text-gray-600 flex-grow">
                Transform long texts into clear, concise summaries. Perfect for quick understanding of complex content.
              </p>
              <Link href="/summarizer" className="w-full">
                <Button className="w-full mt-4">
                  Summarize Text
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center space-y-4 h-full">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold">Planner</h2>
              <p className="text-center text-gray-600 flex-grow">
                Efficiently manage your deadlines and generate a tailored schedule to optimize your work time.
              </p>
              <Link href="/scheduler" className="w-full">
                <Button className="w-full mt-4">
                  Schedule
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}