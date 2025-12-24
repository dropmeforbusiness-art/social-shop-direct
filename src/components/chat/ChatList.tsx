import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  product?: {
    name: string;
    image_url: string | null;
  };
  otherUserName?: string;
}

interface ChatListProps {
  currentUserId: string;
  userType: "buyer" | "seller";
  onSelectConversation: (conversationId: string, otherUserName: string) => void;
  onClose: () => void;
}

export const ChatList = ({
  currentUserId,
  userType,
  onSelectConversation,
  onClose,
}: ChatListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [currentUserId, userType]);

  const fetchConversations = async () => {
    const query = supabase
      .from("conversations")
      .select(`
        *,
        product:products(name, image_url, seller_name)
      `)
      .order("updated_at", { ascending: false });

    if (userType === "buyer") {
      query.eq("buyer_id", currentUserId);
    } else {
      query.eq("seller_id", currentUserId);
    }

    const { data, error } = await query;

    if (!error && data) {
      const conversationsWithNames = data.map((conv: any) => ({
        ...conv,
        otherUserName: userType === "buyer" 
          ? conv.product?.seller_name || "Seller" 
          : "Buyer",
      }));
      setConversations(conversationsWithNames);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[400px] w-[350px] bg-background border rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <span className="font-medium">Messages</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-primary-foreground hover:bg-primary/80">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full p-4">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <span className="text-muted-foreground">No conversations yet</span>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id, conv.otherUserName || "User")}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
              >
                {conv.product?.image_url ? (
                  <img
                    src={conv.product.image_url}
                    alt={conv.product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{conv.product?.name || "Product"}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Chat with {conv.otherUserName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(conv.updated_at), "MMM d")}
                </span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
