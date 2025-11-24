import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Submission {
  id: string;
  product_name: string;
  product_description: string;
  price: number;
  currency: string;
  image_url: string | null;
  seller_name: string;
  seller_location: string;
  status: string;
  created_at: string;
}

export const SubmissionsView = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from("product_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
      return;
    }

    setSubmissions(data || []);
  };

  const approveSubmission = async (submission: Submission) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("products").insert({
        user_id: session.user.id,
        name: submission.product_name,
        description: submission.product_description,
        price: submission.price,
        currency: submission.currency,
        image_url: submission.image_url,
        seller_name: submission.seller_name,
        seller_location: submission.seller_location,
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("product_submissions")
        .update({ status: "approved" })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Submission approved and product created",
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectSubmission = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("product_submissions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission rejected",
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Product Submissions</h2>
        <p className="text-muted-foreground">Review submissions from the chatbot</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader className="p-0">
              {submission.image_url ? (
                <img
                  src={submission.image_url}
                  alt={submission.product_name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{submission.product_name}</h3>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {submission.product_description}
              </p>
              <p className="text-xl font-bold mb-2">
                {submission.currency} {submission.price}
              </p>
              <div className="text-xs text-muted-foreground mb-3">
                <p>Seller: {submission.seller_name}</p>
                <p>Location: {submission.seller_location}</p>
              </div>

              {submission.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => approveSubmission(submission)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectSubmission(submission.id)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {submissions.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No submissions yet</p>
        </Card>
      )}
    </div>
  );
};
