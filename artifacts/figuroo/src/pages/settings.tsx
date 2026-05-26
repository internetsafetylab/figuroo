import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/translations";
import { Copy, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminToken {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  usageCount: number;
}

export default function Settings() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [showToken, setShowToken] = useState<{ id: number; token: string } | null>(null);
  const [newTokenName, setNewTokenName] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibleTokenId, setVisibleTokenId] = useState<number | null>(null);

  // Fetch tokens on mount
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/tokens`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  const handleGenerateToken = async () => {
    if (!newTokenName.trim()) {
      toast({ title: "Eroare", description: "Introdu un nume pentru token" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });

      if (res.ok) {
        const newToken = await res.json();
        setShowToken({ id: newToken.id, token: newToken.token });
        setNewTokenName("");
        await fetchTokens();
        toast({ title: "Succes", description: "Token nou generat!" });
      } else {
        toast({ title: "Eroare", description: "Nu s-a putut genera tokenul" });
      }
    } catch (error) {
      console.error("Error generating token:", error);
      toast({ title: "Eroare", description: "Ceva a mers greșit" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm("Ești sigur că vrei să ștergi acest token?")) return;

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/tokens/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchTokens();
        toast({ title: "Succes", description: "Token șters!" });
      }
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({ title: "Eroare", description: "Nu s-a putut șterge tokenul" });
    }
  };

  const handleToggleToken = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/tokens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        await fetchTokens();
        toast({ title: "Succes", description: "Status actualizat!" });
      }
    } catch (error) {
      console.error("Error updating token:", error);
    }
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: translations.tokenCopied });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{translations.settingsTitle}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{translations.profile}</CardTitle>
            <CardDescription>{translations.updatePersonalInfo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{translations.name}</Label>
              <Input id="name" defaultValue="Maker" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{translations.email}</Label>
              <Input id="email" type="email" defaultValue="hello@figuroo.com" />
            </div>
            <Button>{translations.saveProfile}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translations.preferences}</CardTitle>
            <CardDescription>{translations.customizeWorkspace}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translations.darkMode}</Label>
                <div className="text-sm text-muted-foreground">{translations.alwaysUseDarkTheme}</div>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translations.currencyDisplay}</Label>
                <div className="text-sm text-muted-foreground">{translations.chooseDefaultCurrency}</div>
              </div>
              <Select defaultValue="ron">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selectează monedă" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ron">RON (Lei)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translations.deadlineNotifications}</Label>
                <div className="text-sm text-muted-foreground">{translations.showAlertsUpcomingDeadlines}</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{translations.lowStockWarnings}</Label>
                <div className="text-sm text-muted-foreground">{translations.showAlertsLowFilament}</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translations.adminSection}</CardTitle>
            <CardDescription>Gestionează tokurile de administrator pentru acces la dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generate new token */}
            <div className="space-y-3">
              <Label>Generează token nou</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nume token (ex: Producție, Staging...)"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleGenerateToken()}
                />
                <Button
                  onClick={handleGenerateToken}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generează
                </Button>
              </div>
            </div>

            {/* Show newly generated token */}
            {showToken && (
              <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-3 text-green-600">
                  ✅ Token nou generat! Copiază acum, nu-l vei mai vedea.
                </div>
                <div className="flex items-center gap-2 bg-background p-3 rounded border font-mono text-sm">
                  <span className="flex-1 break-all select-all">{showToken.token}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(showToken.token)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* List existing tokens */}
            <div>
              <Label className="mb-3 block">Tokuri active ({tokens.filter((t) => t.isActive).length})</Label>
              {tokens.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Nu ai nici un token. Generează unul mai sus.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className={`flex items-center gap-3 p-3 rounded border ${
                        token.isActive ? "bg-muted/50 border-border" : "bg-muted/20 border-muted"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{token.name}</p>
                          {!token.isActive && (
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                              Inactiv
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Creat: {new Date(token.createdAt).toLocaleDateString("ro-RO")} • Utilizat: {token.usageCount}{" "}
                          ori
                          {token.lastUsedAt &&
                            ` • Ultima utilizare: ${new Date(token.lastUsedAt).toLocaleDateString("ro-RO")}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setVisibleTokenId(visibleTokenId === token.id ? null : token.id)
                          }
                          className="h-8 w-8"
                          title={visibleTokenId === token.id ? "Ascunde token" : "Arată token"}
                        >
                          {visibleTokenId === token.id ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleToken(token.id, token.isActive)}
                          className="h-8 w-8"
                          title={token.isActive ? "Dezactivează" : "Activează"}
                        >
                          <Switch checked={token.isActive} onCheckedChange={() => {}} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteToken(token.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Show token details if expanded */}
            {visibleTokenId && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2 text-yellow-600">Detalii token:</div>
                {tokens
                  .filter((t) => t.id === visibleTokenId)
                  .map((token) => (
                    <div key={token.id} className="space-y-2">
                      <div className="bg-background p-3 rounded border font-mono text-sm flex items-center gap-2">
                        <span className="flex-1 break-all">
                          {/* In real app, you'd need to fetch the full token again if you don't store it */}
                          Token ID: {token.id}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nota: Tokenul complet nu este salvat pentru motive de securitate. Pastrează-l în siguranță
                        când este generat.
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
