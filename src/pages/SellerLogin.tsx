import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Store, Loader2 } from "lucide-react";

const authSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const SellerLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        await checkSellerAndRedirect(session.user.id);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && mounted) {
        await checkSellerAndRedirect(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSellerAndRedirect = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("phone")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking seller profile:", error);
        return;
      }

      if (data) {
        navigate("/seller/dashboard");
      }
    } catch (error) {
      console.error("Error in checkSellerAndRedirect:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      authSchema.parse({ password, phone: phone.trim() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const emailFromPhone = `${phone.trim()}@flipp.local`;
      
      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailFromPhone,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password");
          }
          throw error;
        }

        // Check if user is a seller
        const { data: profileData, error: profileError } = await supabase
          .from("seller_profiles")
          .select("phone")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profileError) {
          await supabase.auth.signOut();
          throw new Error("Error checking seller status");
        }

        if (!profileData) {
          await supabase.auth.signOut();
          throw new Error("No seller account found. Please sign up first.");
        }

        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });

        navigate("/seller/dashboard");
      } else {
        // Signup flow
        const { data, error } = await supabase.auth.signUp({
          email: emailFromPhone,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/seller/login`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please login instead.");
          }
          throw error;
        }

        if (!data.user) {
          throw new Error("Failed to create account");
        }

        // Create seller profile with phone number
        const { error: profileError } = await supabase
          .from("seller_profiles")
          .insert({
            user_id: data.user.id,
            phone: phone.trim(),
          });

        if (profileError) {
          // If phone already exists
          if (profileError.message.includes("unique")) {
            throw new Error("This phone number is already registered");
          }
          throw profileError;
        }

        // Grant seller role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "seller",
          });

        if (roleError) {
          console.error("Error granting seller role:", roleError);
        }

        toast({
          title: "Account Created!",
          description: "Please login to continue.",
        });

        setIsLogin(true);
        setPassword("");
        setPhone("");
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert phone to email format
      const emailFromPhone = `${resetPhone.trim()}@flipp.local`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(emailFromPhone, {
        redirectTo: `${window.location.origin}/seller/login`,
      });

      if (error) throw error;

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link",
      });

      setShowForgotPassword(false);
      setResetPhone("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            {showForgotPassword ? "Reset Password" : isLogin ? "Seller Login" : "Create Seller Account"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {showForgotPassword
              ? "Enter your phone number to receive a reset link"
              : isLogin 
              ? "Sign in to manage your products"
              : "Create your account to start selling"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-phone">Phone Number</Label>
                <Input
                  id="reset-phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
            </form>
          )}
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
            <div>
              <Button
                variant="link"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerLogin;
