import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatWindow } from "./ChatWindow";
import { ChatList } from "./ChatList";
import { toast } from "sonner";

interface ChatButtonProps {
  productId?: string;
  sellerId?: string;
  sellerName?: string;
  userType: "buyer" | "seller";
  variant?: "icon" | "full";
}

export const ChatButton = ({
  productId,
  sellerId,
  sellerName,
  userType,
  variant = "icon",
}: ChatButtonProps) => {
  const [showChat, setShowChat] = useState(false);
  const [showList, setShowList] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUser();
  }, []);

  const startConversation = async () => {
    if (!currentUserId) {
      toast.error("Please log in to send messages");
      return;
    }

    if (!productId || !sellerId) {
      // Open chat list instead
      setShowList(true);
      return;
    }

    if (currentUserId === sellerId) {
      toast.error("You cannot message yourself");
      return;
    }

    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", currentUserId)
      .eq("seller_id", sellerId)
      .single();

    if (existing) {
      setConversationId(existing.id);
      setOtherUserName(sellerName || "Seller");
      setShowChat(true);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        product_id: productId,
        buyer_id: currentUserId,
        seller_id: sellerId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to start conversation");
      return;
    }

    setConversationId(newConv.id);
    setOtherUserName(sellerName || "Seller");
    setShowChat(true);
  };

  const handleSelectConversation = (convId: string, userName: string) => {
    setConversationId(convId);
    setOtherUserName(userName);
    setShowList(false);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setConversationId(null);
  };

  const handleCloseList = () => {
    setShowList(false);
  };

  if (!currentUserId) return null;

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="outline"
          size="icon"
          onClick={startConversation}
          title="Message"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" onClick={startConversation} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {productId ? "Message Seller" : "Messages"}
        </Button>
      )}

      {showList && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatList
            currentUserId={currentUserId}
            userType={userType}
            onSelectConversation={handleSelectConversation}
            onClose={handleCloseList}
          />
        </div>
      )}

      {showChat && conversationId && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatWindow
            conversationId={conversationId}
            currentUserId={currentUserId}
            otherUserName={otherUserName}
            onClose={handleCloseChat}
          />
        </div>
      )}
    </>
  );
};
