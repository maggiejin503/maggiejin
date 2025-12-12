"use client";

import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "./auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "./ui/use-toast";

export function LoginModal() {
  const { user, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        description: error,
      });
    } else {
      toast({
        description: "Signed in successfully",
      });
      setOpen(false);
      setEmail("");
      setPassword("");
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      description: "Signed out successfully",
    });
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
        title="Sign out"
      >
        <User className="w-3 h-3" />
        <span className="hidden sm:inline">Admin</span>
        <LogOut className="w-3 h-3" />
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
          title="Sign in"
        >
          <LogIn className="w-3 h-3" />
          <span className="hidden sm:inline">Login</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="space-y-4 mt-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-2 px-4 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
