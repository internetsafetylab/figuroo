import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetUpcomingDeadlines } from "@workspace/api-client-react";

export function Topbar() {
  const { data: upcomingDeadlines } = useGetUpcomingDeadlines();
  
  const urgentCount = upcomingDeadlines?.filter((d: any) => d.days_until <= 1).length || 0;

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center w-full max-w-md gap-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search orders, products, AWBs..." 
            className="w-full bg-muted/50 border-transparent pl-9 focus-visible:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {urgentCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background" />
          )}
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium border border-primary/30 shadow-inner">
          F
        </div>
      </div>
    </header>
  );
}
