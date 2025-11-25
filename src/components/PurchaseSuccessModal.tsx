import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  amount: number;
}

export const PurchaseSuccessModal = ({
  open,
  onOpenChange,
  productName,
  amount,
}: PurchaseSuccessModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Thank You for Your Purchase!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your payment has been successfully processed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-accent/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Product</p>
            <p className="font-semibold text-foreground">{productName}</p>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
            <p className="font-semibold text-foreground text-xl">₹{amount.toFixed(2)}</p>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/buyer/dashboard");
              }}
              className="w-full"
            >
              View My Purchases
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate("/marketplace");
              }}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};