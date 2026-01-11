"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { Hexagon, LayoutDashboard, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Mail } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NEW STATE: Track if email was sent
  const [success, setSuccess] = useState(false);
  
  const supabase = createSupabaseClient();

  const validateForm = () => {
    // ... (Keep your existing validation logic here) ...
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Invalid email"); return false; }
    if (password.length < 8) { setError("Password too short (min 8)"); return false; }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setLoading(true);

    const { error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ✅ IMPORTANT: Tell Supabase where to send them after clicking the link
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      // ✅ SUCCESS: Don't redirect. Show the "Check Email" UI.
      setSuccess(true);
      setLoading(false);
    }
  };

  // ✅ SUCCESS VIEW
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md p-8 glass-panel rounded-3xl text-center animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-green-500/10 p-4 rounded-full text-green-500">
              <Mail className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
          <p className="text-muted-foreground mb-6">
            We sent a verification link to <span className="font-bold text-foreground">{email}</span>. 
            <br />Click the link to activate your account.
          </p>
          <div className="text-sm text-muted-foreground">
            Didn't receive it? <button onClick={() => setSuccess(false)} className="text-primary hover:underline">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  // ... (Keep the rest of your existing Return statement / Form here) ...
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-8 glass-panel rounded-3xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative flex items-center justify-center w-12 h-12">
              <Hexagon className="absolute w-12 h-12 text-primary fill-primary/10 stroke-[2]" />
              <LayoutDashboard className="relative w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Join OrbitAI and start optimizing your workflow.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 number, 1 symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-primary/20 mt-6"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-foreground hover:text-primary transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}