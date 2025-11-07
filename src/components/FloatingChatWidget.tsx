import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Loader2, Trash2, Plus, Sparkles } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface FloatingChatWidgetProps {
  language?: Language;
}

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000, "Message must be less than 2000 characters")
});

export const FloatingChatWidget = ({ language = 'en' as Language }: FloatingChatWidgetProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Limitar el movimiento dentro de la ventana
      const maxX = window.innerWidth - 56;
      const maxY = window.innerHeight - 56;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return; // No arrastrar cuando está abierto
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

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
          title: `${language === 'en' ? 'Chat' : 'Conversación'} ${new Date().toLocaleDateString()}`
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentConversationId(data.id);
      setMessages([]);
      setShowConversations(false);
      loadConversations();
      
      toast({
        title: language === 'en' ? "New Chat" : "Nuevo Chat",
        description: language === 'en' ? "Started a new conversation" : "Se inició una nueva conversación"
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: language === 'en' ? "Failed to create chat" : "Error al crear chat",
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
        title: language === 'en' ? "Chat Deleted" : "Chat Eliminado"
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = input.trim();
    if (!messageContent || isLoading) return;

    const validation = messageSchema.safeParse({ content: messageContent });
    if (!validation.success) {
      toast({
        title: language === 'en' ? "Message too long" : "Mensaje muy largo",
        description: language === 'en' ? "Maximum 2000 characters" : "Máximo 2000 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!currentConversationId) {
      await createNewConversation();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    
    await saveMessage('user', messageContent);
    
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('financial-advisor', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) {
        if (error.message?.includes('429')) {
          throw new Error(language === 'en' ? 'Rate limit exceeded. Please try again later.' : 'Límite de solicitudes excedido. Intenta más tarde.');
        }
        if (error.message?.includes('402')) {
          throw new Error(language === 'en' ? 'AI credits depleted. Please add credits in Settings.' : 'Créditos de IA agotados. Añade créditos en Configuración.');
        }
        throw error;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      await saveMessage('assistant', assistantMessage.content);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || (language === 'en' 
          ? "Failed to get advice. Please try again." 
          : "Error al obtener consejo. Intenta de nuevo."),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={buttonRef}
      className="fixed z-50"
      style={{
        bottom: position.y === 0 ? '1rem' : 'auto',
        right: position.x === 0 ? '1rem' : 'auto',
        top: position.y !== 0 ? `${position.y}px` : 'auto',
        left: position.x !== 0 ? `${position.x}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {!isOpen && (
        <Button
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging && setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="bg-background border border-border rounded-lg shadow-2xl w-[380px] h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {language === 'en' ? 'AI Financial Assistant' : 'Asistente Financiero AI'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Your active profile data' : 'Datos de tu perfil activo'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showConversations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversations(true)}
                  className="h-8 w-8 p-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          {showConversations && (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">
                  {language === 'en' ? 'Conversations' : 'Conversaciones'}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversations(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={createNewConversation}
                className="w-full mb-3"
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'New Chat' : 'Nuevo Chat'}
              </Button>
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="flex items-center gap-1">
                      <Button
                        variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                        size="sm"
                        className="flex-1 justify-start text-xs truncate"
                        onClick={() => loadConversation(conv.id)}
                      >
                        {conv.title || new Date(conv.created_at).toLocaleDateString()}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => deleteConversation(conv.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Messages */}
          {!showConversations && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <div className="text-4xl mb-3">💡</div>
                      <p className="text-sm">
                        {language === 'en' 
                          ? 'Ask me about your finances!' 
                          : '¡Pregúntame sobre tus finanzas!'}
                      </p>
                      <p className="text-xs mt-2 opacity-70">
                        {language === 'en' 
                          ? 'I can analyze your active profile data' 
                          : 'Puedo analizar los datos de tu perfil activo'}
                      </p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-2",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        )}
                      >
                        <div className={cn(
                          "prose prose-sm dark:prose-invert max-w-none",
                          msg.role === 'user' ? 'prose-invert' : ''
                        )}>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                              ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                              li: ({ children }) => <li className="my-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                          {language === 'en' ? 'You' : 'Tú'}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === 'en' ? 'Ask me anything...' : 'Pregúntame lo que sea...'}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
