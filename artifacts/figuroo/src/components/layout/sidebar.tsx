import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  SquareKanban, 
  Package, 
  Archive, 
  LineChart, 
  Settings, 
  Box,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Kanban", href: "/kanban", icon: SquareKanban },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Archive },
  { name: "Analytics", href: "/analytics", icon: LineChart },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8 text-primary">
        <Box className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-foreground">Figuroo</span>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`link-sidebar-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-sidebar-border space-y-1">
        <Link href="/settings">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
              location === "/settings" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            data-testid="link-sidebar-settings"
          >
            <Settings className="w-5 h-5" />
            Settings
          </div>
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
