-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = messages.conversation_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();