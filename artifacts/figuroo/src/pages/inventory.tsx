import { useState } from "react";
import { useListInventory, useDeleteInventoryItem, getListInventoryQueryKey, InventoryItem } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InventoryDialog } from "@/components/inventory/inventory-dialog";
import { translations } from "@/lib/translations";

export default function Inventory() {
  const { data: inventory, isLoading } = useListInventory();
  const deleteItem = useDeleteInventoryItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ești sigur că vrei să ștergi acest material?")) {
      deleteItem.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          toast({ title: "Material șters" });
        },
        onError: () => toast({ title: "Eroare la ștergerea materialului", variant: "destructive" })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.inventoryTitle}</h1>
          <p className="text-muted-foreground mt-1">Urmăriți utilizarea materialelor și nivelul stocului.</p>
        </div>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Adaugă material</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : inventory?.map(item => {
          const gramsLeft = item.grams_left || 0;
          const threshold = item.low_stock_threshold || 500;
          const isLow = gramsLeft <= threshold;
          
          // Assuming max is 1000g for a standard spool if not specified
          const maxCapacity = 1000;
          const percentLeft = Math.min(100, Math.max(0, (gramsLeft / maxCapacity) * 100));

          return (
            <Card key={item.id} className={`overflow-hidden transition-colors ${isLow ? 'border-destructive/50 bg-destructive/5' : 'bg-card'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.filament_name}
                      {isLow && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{item.color || 'Culoare necunoscută'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4 mr-2" /> {translations.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive focus:text-destructive">
                          <Trash className="w-4 h-4 mr-2" /> {translations.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className={`text-xl font-bold mt-1 ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                      {gramsLeft}g
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Prag: {threshold}g</span>
                    <span>Cost: {item.cost_per_kg} Lei/kg</span>
                  </div>
                  <Progress 
                    value={percentLeft} 
                    className={`h-2 ${isLow ? 'bg-destructive/20' : ''}`}
                    indicatorColor={isLow ? 'bg-destructive' : 'bg-primary'}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <InventoryDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        item={selectedItem} 
      />
    </div>
  );
}
