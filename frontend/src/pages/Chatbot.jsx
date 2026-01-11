import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { AudioButton } from '../components/AudioPlayer';
import { fetchApi } from '../lib/utils';
import { toast } from 'sonner';

const suggestedQuestions = [
  "What are the key differences between UAE and Saudi healthcare regulations?",
  "How much capital do I need to start a clinic in Dubai?",
  "What is the DataFlow verification process?",
  "How do I qualify for the Golden Visa as a healthcare professional?",
  "What are the most profitable medical specialties in the GCC?",
];

export default function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI course assistant, powered by Claude. I'm here to help you with any questions about launching your medical practice in the GCC.

I can help you with:
• **Regulatory requirements** - Licensing, certifications, compliance
• **Financial planning** - Startup costs, revenue projections, tax optimization
• **Market analysis** - Country comparisons, specialty demand, competition
• **Operations** - Staffing, facility setup, clinical workflows
• **Legal structures** - Entity formation, free zones, partnerships

What would you like to know?`,
    }]);
  }, [user]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetchApi('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      });

      setSessionId(response.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
      }]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or rephrase your question.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you today?",
    }]);
    setSessionId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-8 h-[calc(100vh-2rem)]" data-testid="chatbot-page">
        <div className="h-full flex flex-col max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  AI Course Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Powered by Claude Sonnet • Ask anything about GCC healthcare
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col overflow-hidden" data-testid="chat-area">
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    data-testid={`message-${idx}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-secondary/10'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content.split('\n').map((line, i) => {
                            // Handle bold text
                            const parts = line.split(/\*\*(.*?)\*\*/g);
                            return (
                              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                {parts.map((part, j) => 
                                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                )}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="bg-muted p-4 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="px-6 pb-4">
                <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(question)}
                      className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                      data-testid={`suggested-${idx}`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t" data-testid="chat-input">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about GCC healthcare regulations, licensing, financials..."
                  className="resize-none min-h-[56px] max-h-32"
                  rows={1}
                  data-testid="message-input"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="btn-primary-pill px-6"
                  data-testid="send-btn"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI responses are for educational purposes. Always consult licensed professionals for legal and medical advice.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
