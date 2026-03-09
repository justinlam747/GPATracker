import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
    Send, Bot, User, Trash2, ArrowLeft, Sparkles, BookOpen, FileText,
    Upload, GraduationCap, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';

// ── Message Bubble ────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(
                    "text-xs font-semibold",
                    isUser ? "bg-honolulu_blue text-white" : "bg-gray-100 text-gray-700"
                )}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn("max-w-[80%] space-y-1", isUser ? "items-end" : "items-start")}>
                <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                        ? "bg-honolulu_blue text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}>
                    <MessageContent text={message.content} />
                </div>

                {/* Tool calls badges */}
                {message.toolCalls?.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                        {message.toolCalls.map((tc, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0">
                                {formatToolName(tc.tool)}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

// Simple markdown-like rendering for agent responses
function MessageContent({ text }) {
    if (!text) return null;

    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2">
            {parts.map((part, i) => {
                if (part.startsWith('```')) {
                    const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
                    return (
                        <pre key={i} className="bg-gray-800 text-green-400 rounded-lg p-3 text-xs overflow-x-auto font-mono">
                            <code>{code}</code>
                        </pre>
                    );
                }

                // Handle bold, inline code, bullet points
                const lines = part.split('\n');
                return (
                    <div key={i}>
                        {lines.map((line, j) => {
                            if (line.trim() === '') return <br key={j} />;

                            // Bullet points
                            if (line.match(/^\s*[-*]\s/)) {
                                return (
                                    <div key={j} className="flex gap-1.5 ml-1">
                                        <span className="text-gray-400 shrink-0">•</span>
                                        <span>{formatInline(line.replace(/^\s*[-*]\s/, ''))}</span>
                                    </div>
                                );
                            }

                            // Numbered lists
                            const numMatch = line.match(/^\s*(\d+)\.\s(.+)/);
                            if (numMatch) {
                                return (
                                    <div key={j} className="flex gap-1.5 ml-1">
                                        <span className="text-gray-400 shrink-0">{numMatch[1]}.</span>
                                        <span>{formatInline(numMatch[2])}</span>
                                    </div>
                                );
                            }

                            return <p key={j}>{formatInline(line)}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function formatInline(text) {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}

function formatToolName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Quick Actions ─────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    { label: 'Show my GPA', message: 'What is my current GPA?', icon: GraduationCap },
    { label: 'List courses', message: 'Show me all my courses', icon: BookOpen },
    { label: 'Import transcript', message: 'I want to import my transcript', icon: Upload },
    { label: 'Find template', message: 'Help me find a marking scheme template for my course', icon: FileText },
];

// ── Main Chat Component ───────────────────────────────────────────────────

const ChatAgent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (el) el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = useCallback(async (text) => {
        if (!text?.trim() || loading) return;

        const userMessage = { role: 'user', content: text.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/chat', { message: text.trim() });
            const agentMessage = {
                role: 'assistant',
                content: response.data.response,
                toolCalls: response.data.toolCalls,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, agentMessage]);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to get response';
            setError(errMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errMsg,
                isError: true,
                timestamp: Date.now()
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [loading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleClear = async () => {
        try {
            await api.delete('/chat/history');
        } catch { /* ignore */ }
        setMessages([]);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-honolulu_blue to-pacific_cyan flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">GPA Buddy</h1>
                                <p className="text-xs text-gray-500">AI-powered course assistant</p>
                            </div>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleClear} className="text-gray-500">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Chat Area */}
                <Card className="flex-1 flex flex-col min-h-0 border-gray-200">
                    <ScrollArea ref={scrollRef} className="flex-1 px-4 pt-4">
                        {messages.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-full py-12">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-honolulu_blue to-pacific_cyan flex items-center justify-center mb-4 shadow-lg">
                                    <Bot className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Hi{user?.firstName ? `, ${user.firstName}` : ''}!</h2>
                                <p className="text-sm text-gray-500 text-center max-w-md mb-8">
                                    I can help you manage courses, import transcripts, set up marking schemes, and track your GPA. What would you like to do?
                                </p>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                                    {QUICK_ACTIONS.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(action.message)}
                                            className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
                                        >
                                            <action.icon className="h-4 w-4 text-gray-400 group-hover:text-honolulu_blue shrink-0" />
                                            <span className="text-sm text-gray-700">{action.label}</span>
                                            <ChevronRight className="h-3 w-3 text-gray-300 ml-auto shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Message List */
                            <div className="pb-4">
                                {messages.map((msg, i) => (
                                    <MessageBubble key={i} message={msg} />
                                ))}

                                {/* Typing indicator */}
                                {loading && (
                                    <div className="flex gap-3 mb-4">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarFallback className="bg-gray-100 text-gray-700">
                                                <Bot className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Input Area */}
                    <CardContent className="p-3 border-t border-gray-100">
                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-600 mb-2 px-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your courses, GPA, or import data..."
                                disabled={loading}
                                className="flex-1 rounded-xl border-gray-200 focus-visible:ring-honolulu_blue"
                                maxLength={2000}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={loading || !input.trim()}
                                className="rounded-xl shrink-0"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            GPA Buddy uses AI and can make mistakes. Verify important information.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ChatAgent;
