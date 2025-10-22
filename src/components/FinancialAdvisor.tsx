import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2, FileText, Trash2, Plus, MessageSquare } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { z } from "zod";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface FinancialAdvisorProps {
  language: Language;
}

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000, "Message must be less than 2000 characters")
});

export const FinancialAdvisor = ({ language }: FinancialAdvisorProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([{ 
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: `Conversación del ${new Date().toLocaleDateString()}`
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentConversationId(data.id);
      setMessages([]);
      loadConversations();
      
      toast({
        title: language === 'en' ? "New Conversation" : "Nueva Conversación",
        description: language === 'en' ? "Started a new conversation" : "Se inició una nueva conversación"
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: language === 'en' ? "Failed to create conversation" : "Error al crear conversación",
        variant: "destructive"
      });
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (error) throw error;
      
      setMessages((data || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
      setCurrentConversationId(conversationId);
      setShowConversations(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      loadConversations();
      
      toast({
        title: language === 'en' ? "Conversation Deleted" : "Conversación Eliminada",
        description: language === 'en' ? "The conversation has been deleted" : "La conversación ha sido eliminada"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!currentConversationId) return;

    try {
      await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: currentConversationId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role,
          content
        }]);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent, customPrompt?: string) => {
    e.preventDefault();
    const messageContent = customPrompt || input.trim();
    if (!messageContent || isLoading) return;

    // Validate message length
    const validation = messageSchema.safeParse({ content: messageContent });
    if (!validation.success) {
      toast({
        title: language === 'en' ? "Message too long" : "Mensaje muy largo",
        description: language === 'en' ? "Maximum 2000 characters allowed" : "Máximo 2000 caracteres permitidos",
        variant: "destructive"
      });
      return;
    }

    // Create conversation if none exists
    if (!currentConversationId) {
      await createNewConversation();
      // Wait a bit for the conversation to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message
    await saveMessage('user', messageContent);
    
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
      
      // Save assistant message
      await saveMessage('assistant', assistantMessage.content);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>
              {language === 'en' ? 'AI Financial Chat' : 'Chat Financiero AI'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showConversations} onOpenChange={setShowConversations}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Conversations' : 'Conversaciones'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {language === 'en' ? 'Chat Conversations' : 'Conversaciones del Chat'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Button
                    onClick={createNewConversation}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'New Conversation' : 'Nueva Conversación'}
                  </Button>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="flex items-center gap-2">
                          <Button
                            variant={currentConversationId === conv.id ? "default" : "ghost"}
                            size="sm"
                            className="flex-1 justify-start truncate"
                            onClick={() => loadConversation(conv.id)}
                          >
                            {conv.title || `${language === 'en' ? 'Conversation' : 'Conversación'} ${new Date(conv.created_at).toLocaleDateString()}`}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConversation(conv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={createNewConversation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'New' : 'Nuevo'}
            </Button>
          </div>
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