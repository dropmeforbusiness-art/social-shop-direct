import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Submission {
  id: string;
  seller_name: string;
  seller_location: string;
  product_name: string;
  product_description: string;
  price: number;
  currency: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdminRole = roles?.some((r) => r.role === "admin");

      if (!hasAdminRole) {
        navigate("/admin/login");
        return;
      }

      setIsAdmin(true);
      fetchSubmissions();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/admin/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("product_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    }
  };

  const approveSubmission = async (submission: Submission) => {
    try {
      // Get the current user for user_id requirement
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create product from submission
      const { error: productError } = await supabase.from("products").insert({
        user_id: user.id,
        name: submission.product_name,
        description: submission.product_description,
        price: submission.price,
        currency: submission.currency,
        image_url: submission.image_url,
        seller_name: submission.seller_name,
        seller_location: submission.seller_location,
        status: "available",
      });

      if (productError) throw productError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("product_submissions")
        .update({ status: "approved" })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Product approved and added to marketplace",
      });

      fetchSubmissions();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    }
  };

  const rejectSubmission = async (id: string) => {
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
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Product Submissions</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/products")}>
                Manage Products
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Add Product
              </Button>
              <Button variant="outline" onClick={() => navigate("/marketplace")}>
                Marketplace
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{submission.product_name}</CardTitle>
                    <Badge
                      variant={
                        submission.status === "pending"
                          ? "secondary"
                          : submission.status === "approved"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.image_url && (
                    <img
                      src={submission.image_url}
                      alt={submission.product_name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground line-clamp-3">
                      {submission.product_description}
                    </p>
                    <p className="font-semibold">
                      {submission.currency} {submission.price}
                    </p>
                    <p className="text-muted-foreground">
                      Seller: {submission.seller_name}
                    </p>
                    <p className="text-muted-foreground">
                      Location: {submission.seller_location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {submission.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveSubmission(submission)}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectSubmission(submission.id)}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}