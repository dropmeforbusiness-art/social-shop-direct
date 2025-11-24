import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">View and manage admin users</p>
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
              <Badge variant="secondary">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </Card>
        )}
      </div>

      <Card className="mt-6 bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> To add new admin users, you need to manually insert records into the user_roles table using the Lovable Cloud backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
