import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        localStorage.setItem("figuroo_token", token.trim());
        onLogin();
      } else {
        toast({ title: translations.invalidToken, description: translations.checkToken, variant: "destructive" });
      }
    } catch {
      toast({ title: translations.error, description: translations.couldNotConnect, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">Figuroo</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h1 className="text-lg font-semibold text-foreground mb-1">Accesează dashboard-ul</h1>
          <p className="text-sm text-muted-foreground mb-6">Introdu tokenul de acces pentru a continua.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Token de acces</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="FIG-XXXX-XXXX-XXXX"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                autoFocus
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "Se verifică..." : "Intră în dashboard"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Figuroo Dashboard • 3D Figurine Orders
        </p>
      </div>
    </div>
  );
}
