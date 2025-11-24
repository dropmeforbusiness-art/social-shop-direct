import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, Users, DollarSign } from "lucide-react";

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSubmissions: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingSubmissions: 0,
    activeProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [productsData, submissionsData, usersData] = await Promise.all([
        supabase.from("products").select("*", { count: "exact" }),
        supabase.from("product_submissions").select("*", { count: "exact" }),
        supabase.from("user_roles").select("*", { count: "exact" }),
      ]);

      const pendingSubmissions = submissionsData.data?.filter(s => s.status === "pending").length || 0;
      const activeProducts = productsData.data?.filter(p => p.status === "available").length || 0;
      
      // Calculate total revenue (sum of all product prices)
      const totalRevenue = productsData.data?.reduce((sum, product) => sum + (Number(product.price) || 0), 0) || 0;

      setStats({
        totalProducts: productsData.count || 0,
        totalSubmissions: submissionsData.count || 0,
        totalUsers: usersData.count || 0,
        totalRevenue,
        pendingSubmissions,
        activeProducts,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      description: `${stats.activeProducts} active`,
      icon: Package,
    },
    {
      title: "Submissions",
      value: stats.totalSubmissions,
      description: `${stats.pendingSubmissions} pending review`,
      icon: FileText,
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered admins",
      icon: Users,
    },
    {
      title: "Total Value",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      description: "All products combined",
      icon: DollarSign,
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        <p className="text-muted-foreground">Real-time statistics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
