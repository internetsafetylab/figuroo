import { useState, useMemo } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";

const STATUSES = [
  "Pending",
  "Printing",
  "Packaging",
  "Ready to Ship",
  "Shipped",
  "Delivered"
] as const;

export default function Kanban() {
  const { data: orders, isLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [optimisticOrders, setOptimisticOrders] = useState<typeof orders | null>(null);

  const displayOrders = optimisticOrders || orders;

  const columns = useMemo(() => {
    const cols: Record<string, typeof displayOrders> = {};
    STATUSES.forEach(status => {
      cols[status] = [];
    });
    
    if (displayOrders) {
      displayOrders.forEach(order => {
        if (cols[order.status]) {
          cols[order.status]?.push(order);
        } else {
           // Fallback if status doesn't match
           if (!cols["Pending"]) cols["Pending"] = [];
           cols["Pending"].push(order);
        }
      });
    }
    return cols;
  }, [displayOrders]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as typeof STATUSES[number];
    const orderId = parseInt(draggableId, 10);

    if (isNaN(orderId)) return;

    // Optimistic update
    if (displayOrders) {
      const newOrders = displayOrders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      setOptimisticOrders(newOrders as typeof orders);
    }

    updateStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setOptimisticOrders(null);
        },
        onError: () => {
          setOptimisticOrders(null);
          toast({
            title: "Eroare",
            description: "Nu s-a putut actualiza status-ul comenzii.",
            variant: "destructive"
          });
        }
      }
    );
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

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">{translations.kanban}</h1>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {isLoading && !optimisticOrders ? (
          <div className="flex gap-4 h-full">
            {STATUSES.map((status, i) => (
              <div key={i} className="w-80 shrink-0 h-full rounded-xl bg-muted/20 p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {STATUSES.map(status => (
                <Droppable key={status} droppableId={status}>
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-[320px] shrink-0 h-full max-h-full flex flex-col rounded-xl border border-border/50 bg-muted/10 transition-colors ${
                        snapshot.isDraggingOver ? "bg-muted/30 border-primary/50" : ""
                      }`}
                    >
                      <div className="p-4 shrink-0 flex items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{status}</h3>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {columns[status]?.length || 0}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                        {columns[status]?.map((order, index) => (
                          <Draggable key={order.id.toString()} draggableId={order.id.toString()} index={index}>
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab active:cursor-grabbing border ${
                                  snapshot.isDragging ? "shadow-lg shadow-primary/20 border-primary/50 scale-[1.02]" : "shadow-sm hover:border-primary/30"
                                } ${getStatusColor(order.status)}`}
                                data-testid={`kanban-card-${order.id}`}
                              >
                                <CardContent className="p-3">
                                  <div className="font-medium text-sm mb-1">{order.product_name}</div>
                                  <div className="text-xs opacity-80 mb-3">{order.customer_name}</div>
                                  
                                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-current/10">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{order.deadline ? new Date(order.deadline).toLocaleDateString() : "Fără dată"}</span>
                                    </div>
                                    <div className="font-semibold text-foreground/90">
                                      {order.order_price} Lei
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
