import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const userIdSchema = z.string().trim().uuid("Invalid user ID format");

export const UserManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      return;
    }

    setUsers(data || []);
  };

  const grantAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      userIdSchema.parse(newUserId);
    } catch (error) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid UUID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", newUserId.trim())
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        throw new Error("User already has admin access");
      }

      // Grant admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: newUserId.trim(),
          role: "admin",
        });

      if (insertError) {
        if (insertError.message.includes("foreign key")) {
          throw new Error("User ID not found. The user must sign up first.");
        }
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Admin access granted successfully",
      });

      setNewUserId("");
      setIsDialogOpen(false);
      fetchUsers();
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

  const revokeAdminAccess = async (userId: string) => {
    if (!confirm("Revoke admin access for this user?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin access revoked",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">View and manage admin users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Admin Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Admin Access</DialogTitle>
            </DialogHeader>
            <form onSubmit={grantAdminAccess} className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The user will see their ID after signing up
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Granting..." : "Grant Access"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeAdminAccess(user.user_id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No admin users yet</p>
          </Card>
        )}
      </div>
    </div>
  );
};
