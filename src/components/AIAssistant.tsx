import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'আসসালামু আলাইকুম! আমি আপনাকে আইডি কার্ডের নিয়ম, পদ্ধতি বা সাধারণ তথ্য সম্পর্কে সাহায্য করতে পারি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = getAI();
      if (!ai) {
        throw new Error("AI is not configured. Missing API key.");
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are 'Padma', a helpful AI assistant for the Padma AWT Rest House ID Manager application. Your primary language is Bengali (Bangla). You MUST respond to all queries in Bengali unless the user explicitly requests another language. When greeting, use 'Assalamualaikum' (আসসালামু আলাইকুম) instead of 'Namaskar' or 'নমস্কার'. Your sole purpose is to help users with tasks, policies, procedures, and information related to this specific application (ID cards, nametags, attendance, employee management, daily works, and inventory). If a user asks a question that is NOT related to this application, its features, or its domain, you MUST politely refuse to answer in Bengali and remind them that you can only assist with Padma AWT Rest House ID Manager related queries.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleSearch: {} }],
        },
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'I could not find an answer.' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 p-1 rounded-full shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(37,99,235,0.6)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 z-50 flex items-center justify-center border border-slate-200 dark:border-slate-700"
        >
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Padma" 
              className="w-12 h-12 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] shadow-2xl flex flex-col z-50 border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="bg-primary-600/90 dark:bg-primary-600/80 backdrop-blur-md text-white p-4 rounded-t-2xl flex flex-row justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80" 
                alt="Padma" 
                className="w-8 h-8 rounded-full object-cover border border-white/30 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <CardTitle className="text-lg font-medium">Padma</CardTitle>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden rounded-b-2xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <img 
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80" 
                      alt="Padma" 
                      className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm backdrop-blur-md border ${
                    msg.role === 'user' 
                      ? 'bg-primary-600/90 text-white rounded-br-sm border-primary-500/50' 
                      : 'bg-slate-100/80 dark:bg-white/10 border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <img 
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80" 
                    alt="Padma" 
                    className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="bg-slate-100/80 dark:bg-white/10 border border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-slate-300 p-3 rounded-2xl rounded-bl-sm shadow-sm text-sm flex items-center gap-2 backdrop-blur-md">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/60 dark:border-white/10 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                className="flex-1 bg-white/50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary-500"
                disabled={loading}
              />
              <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
