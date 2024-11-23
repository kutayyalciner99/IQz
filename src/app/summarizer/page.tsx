'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const SummarizerPage = () => {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleSubmit = async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to summarize');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/summarizer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    // Handle rate limiting
                    const retryAfter = data.retryAfter || 5000;
                    setError(`Service is busy. Retry available in ${Math.ceil(retryAfter / 1000)} seconds`);

                    // Clear any existing timeout
                    if (retryTimeout) {
                        clearTimeout(retryTimeout);
                    }

                    // Set up automatic retry
                    const timeout = setTimeout(() => {
                        setError(null);
                        handleSubmit();
                    }, retryAfter);

                    setRetryTimeout(timeout);
                    return;
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            setSummary(data.summary);
        } catch (err) {
            console.error('Error summarizing text:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        
    };

    // Clean up timeout on unmount
    React.useEffect(() => {
        return () => {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [retryTimeout]);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-6">Text Summarizer</h1>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Enter your text (max 10,000 characters)
                        </label>
                        <Textarea
                            placeholder="Paste your text here..."
                            className="min-h-[200px]"
                            value={inputText}
                            onChange={(e) => {
                                if (e.target.value.length <= 10000) {
                                    setInputText(e.target.value);
                                }
                            }}
                            maxLength={10000}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {inputText.length}/10000 characters
                        </p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !inputText.trim()}
                        className="w-full"
                    >
                        {loading ? 'Summarizing...' : 'Summarize'}
                    </Button>

                    {summary && (
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-semibold">Summary</h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                            <Card className="p-4 bg-slate-50">
                                <p className="whitespace-pre-wrap">{summary}</p>
                            </Card>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default SummarizerPage;