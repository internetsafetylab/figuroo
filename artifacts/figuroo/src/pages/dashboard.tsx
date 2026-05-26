import { useGetDashboardSummary, useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { translations } from "@/lib/translations";
import { formatRON } from "@/lib/currency";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: orders, isLoading: isLoadingOrders } = useListOrders({ limit: 5 } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{translations.dashboardTitle}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard title={translations.ordersToday} value={summary?.orders_today} icon={ShoppingCart} />
            <StatCard title={translations.activeShipments} value={summary?.active_shipments} icon={Package} />
            <StatCard title={translations.monthlyRevenue} value={formatRON(summary?.monthly_revenue)} icon={DollarSign} />
            <StatCard title={translations.monthlyProfit} value={formatRON(summary?.monthly_profit)} icon={Activity} />
          </>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{translations.recentOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {orders?.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                    <div>
                      <p className="font-medium">{order.product_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatRON(order.order_price)}</p>
                      <p className="text-xs text-muted-foreground">{order.status}</p>
                    </div>
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

function StatCard({ title, value, icon: Icon }: { title: string, value: React.ReactNode, icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value || 0}</div>
      </CardContent>
    </Card>
  );
}
