import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2, FileText } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FinancialAdvisorProps {
  language: Language;
}

export const FinancialAdvisor = ({ language }: FinancialAdvisorProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent, customPrompt?: string) => {
    e.preventDefault();
    const messageContent = customPrompt || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('financial-advisor', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: language === 'en' 
          ? "Failed to get advice. Please try again." 
          : "Error al obtener consejo. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateActionPlan = (e: React.FormEvent) => {
    const prompt = language === 'en'
      ? "Based on my financial data, please generate a detailed action plan document with the following sections:\n\n1. **Executive Summary**: Brief overview of my current financial situation\n2. **Short-term Goals (1-3 months)**: Specific actions I should take immediately\n3. **Medium-term Goals (3-6 months)**: Steps to improve my financial health\n4. **Long-term Goals (6-12 months)**: Strategic financial objectives\n5. **Debt Management Strategy**: Specific plan for managing and reducing debts\n6. **Savings Strategy**: Plan for building emergency fund and savings goals\n7. **Budget Optimization**: Recommendations for reducing expenses and increasing savings\n8. **Action Items Checklist**: A prioritized list of concrete steps to take\n\nPlease format this as a professional document that I can save and reference."
      : "Basándote en mis datos financieros, genera un documento detallado de plan de acción con las siguientes secciones:\n\n1. **Resumen Ejecutivo**: Breve descripción de mi situación financiera actual\n2. **Objetivos a Corto Plazo (1-3 meses)**: Acciones específicas que debo tomar inmediatamente\n3. **Objetivos a Mediano Plazo (3-6 meses)**: Pasos para mejorar mi salud financiera\n4. **Objetivos a Largo Plazo (6-12 meses)**: Objetivos financieros estratégicos\n5. **Estrategia de Manejo de Deudas**: Plan específico para gestionar y reducir deudas\n6. **Estrategia de Ahorro**: Plan para construir fondo de emergencia y metas de ahorro\n7. **Optimización de Presupuesto**: Recomendaciones para reducir gastos y aumentar ahorros\n8. **Lista de Acciones**: Una lista priorizada de pasos concretos a seguir\n\nPor favor, formatea esto como un documento profesional que pueda guardar y consultar.";

    sendMessage(e, prompt);
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'AI Financial Advisor' : 'Asesor Financiero AI'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' 
            ? 'Get personalized financial advice based on your data' 
            : 'Obtén consejos financieros personalizados basados en tus datos'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={generateActionPlan}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Generate Action Plan' : 'Generar Plan de Acción'}
          </Button>
        </div>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-2">🤖💰</div>
                {language === 'en' 
                  ? 'Ask me anything about your finances!' 
                  : '¡Pregúntame lo que quieras sobre tus finanzas!'}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-2xl mt-1">🤖</div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="text-2xl mt-1">👤</div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="text-2xl mt-1">🤖</div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'en' ? 'Ask for advice...' : 'Pide un consejo...'}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};