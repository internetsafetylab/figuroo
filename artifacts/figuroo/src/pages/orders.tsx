import { useState } from "react";
import { useListOrders, useDeleteOrder, getListOrdersQueryKey, Order } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash, QrCode, Copy, AlertCircle } from "lucide-react";
import { OrderDialog } from "@/components/orders/order-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { translations } from "@/lib/translations";
import { formatRON } from "@/lib/currency";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrder(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order deleted" });
        },
        onError: () => toast({ title: "Failed to delete order", variant: "destructive" })
      });
    }
  };

  const showQr = (url: string) => {
    setQrUrl(url);
    setQrOpen(true);
  };

  const copyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    toast({ title: translations.awbCopied });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "border-gray-500/50 bg-gray-500/10 text-gray-400";
      case "Printing": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
      case "Packaging": return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      case "Ready to Ship": return "border-purple-500/50 bg-purple-500/10 text-purple-400";
      case "Shipped": return "border-orange-500/50 bg-orange-500/10 text-orange-400";
      case "Delivered": return "border-green-500/50 bg-green-500/10 text-green-400";
      default: return "border-gray-500/50 bg-gray-500/10 text-gray-400";
    }
  };

  const isDeadlineUrgent = (deadline: string | null | undefined) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    // Urgent if deadline is today or past
    return deadlineDate <= today;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{translations.ordersTitle}</h1>
        <Button onClick={handleCreate} data-testid="button-create-order"><Plus className="w-4 h-4 mr-2" /> {translations.newOrder}</Button>
      </div>

      <div className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>{translations.customer}</TableHead>
              <TableHead>{translations.product}</TableHead>
              <TableHead>{translations.status}</TableHead>
              <TableHead>{translations.price}</TableHead>
              <TableHead>{translations.deadline}</TableHead>
              <TableHead>{translations.awb}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nu au fost găsite comenzi. Creează una pentru a începe.
                </TableCell>
              </TableRow>
            ) : orders?.map((order) => (
              <TableRow key={order.id} className="group">
                <TableCell className="font-medium">
                  {order.customer_name}
                  {isDeadlineUrgent(order.deadline) && <AlertCircle className="inline-block w-4 h-4 ml-2 text-destructive" />}
                </TableCell>
                <TableCell>
                  <div>{order.product_name}</div>
                  <div className="text-xs text-muted-foreground">{order.product_color} {order.material}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatRON(order.order_price)}</TableCell>
                <TableCell>
                  <span className={isDeadlineUrgent(order.deadline) ? "text-destructive font-medium" : ""}>
                    {order.deadline ? new Date(order.deadline).toLocaleDateString() : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {order.awb_code ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{order.awb_code}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyAwb(order.awb_code!)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(order)}>
                        <Pencil className="w-4 h-4 mr-2" /> {translations.edit}
                      </DropdownMenuItem>
                      {order.easybox_qr_image_url && (
                        <DropdownMenuItem onClick={() => showQr(order.easybox_qr_image_url!)}>
                          <QrCode className="w-4 h-4 mr-2" /> {translations.showQR}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-destructive focus:text-destructive">
                        <Trash className="w-4 h-4 mr-2" /> {translations.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        order={selectedOrder} 
      />

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md bg-white border-0 flex flex-col items-center justify-center p-8">
          {qrUrl && <img src={qrUrl} alt="QR Code" className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm" />}
          <div className="mt-4 flex gap-4">
            <Button variant="secondary" onClick={() => setQrOpen(false)}>{translations.close}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
