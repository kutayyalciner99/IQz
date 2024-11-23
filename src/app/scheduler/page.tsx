'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';

interface Topic {
  subject: string;
  deadline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
}

interface ScheduleBlock {
  date: string;
  timeSlot: string;
  topic: string;
  activity: string;
  duration: string;
}

interface Schedule {
  blocks: ScheduleBlock[];
  summary: {
    totalHours: number;
    topicsPerWeek: number;
    suggestedPace: string;
  };
  recommendations: string[];
}

export default function SchedulePlanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic>({
    subject: '',
    deadline: '',
    difficulty: 'medium',
    estimatedHours: 2
  });
  const [scheduleType, setScheduleType] = useState<'weekly' | 'monthly'>('weekly');

  const addTopic = () => {
    if (!currentTopic.subject || !currentTopic.deadline) {
      setError('Please fill in all topic details');
      return;
    }
    setTopics([...topics, currentTopic]);
    setCurrentTopic({
      subject: '',
      deadline: '',
      difficulty: 'medium',
      estimatedHours: 2
    });
    setError(null);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, idx) => idx !== index));
  };

  const generateSchedule = async () => {
    if (topics.length === 0) {
      setError('Please add at least one topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics,
          scheduleType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSchedule(data);
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetSchedule = () => {
    setTopics([]);
    setSchedule(null);
    setCurrentTopic({
      subject: '',
      deadline: '',
      difficulty: 'medium',
      estimatedHours: 2
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <a href="/" className="inline-block mb-4">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </a>

      <Card className="p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Study Schedule Planner</h2>

          {/* Schedule Type Selection */}
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select
              value={scheduleType}
              onValueChange={(value: 'weekly' | 'monthly') => setScheduleType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Topic Form */}
          <div className="space-y-4 border-b pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Topic</Label>
                <Input
                  id="subject"
                  placeholder="Enter topic to study"
                  value={currentTopic.subject}
                  onChange={(e) => setCurrentTopic({
                    ...currentTopic,
                    subject: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={currentTopic.deadline}
                  onChange={(e) => setCurrentTopic({
                    ...currentTopic,
                    deadline: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={currentTopic.difficulty}
                  onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                    setCurrentTopic({
                      ...currentTopic,
                      difficulty: value
                    })
                  }
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
              <div>
                <Label htmlFor="hours">Estimated Study Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  value={currentTopic.estimatedHours}
                  onChange={(e) => setCurrentTopic({
                    ...currentTopic,
                    estimatedHours: parseInt(e.target.value) || 2
                  })}
                />
              </div>
            </div>
            <Button onClick={addTopic}>Add Topic</Button>
          </div>

          {/* Topics List */}
          {topics.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Added Topics</h3>
              <div className="space-y-2">
                {topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <div>
                      <span className="font-medium">{topic.subject}</span>
                      <div className="text-sm text-slate-500">
                        Due: {new Date(topic.deadline).toLocaleDateString()} •
                        {topic.estimatedHours}h •
                        <Badge variant="secondary" className="ml-2">
                          {topic.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTopic(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Schedule Button */}
          <div className="flex gap-4">
            <Button
              onClick={generateSchedule}
              disabled={loading || topics.length === 0}
              className="w-full"
            >
              {loading ? 'Generating Schedule...' : 'Generate Schedule'}
            </Button>
            {schedule && (
              <Button
                onClick={resetSchedule}
                variant="outline"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Schedule Display */}
          {schedule && (
            <div className="space-y-6 mt-8">
              <Alert>
                <AlertTitle>Schedule Summary</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Total Study Hours: {schedule.summary.totalHours}</p>
                    <p>Topics per Week: {schedule.summary.topicsPerWeek}</p>
                    <p>Suggested Pace: {schedule.summary.suggestedPace}</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Schedule</h3>
                <div className="space-y-2">
                  {schedule.blocks.map((block, idx) => (
                    <div key={idx} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{block.topic}</div>
                          <div className="text-sm text-slate-500">
                            {new Date(block.date).toLocaleDateString()} • {block.timeSlot}
                          </div>
                        </div>
                        <Badge>{block.duration}</Badge>
                      </div>
                      <p className="text-sm mt-2">{block.activity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {schedule.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}