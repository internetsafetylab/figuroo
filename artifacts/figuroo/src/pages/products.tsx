import { useState } from "react";
import { useListProducts, useDeleteProduct, getListProductsQueryKey, Product } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProductDialog } from "@/components/products/product-dialog";
import { translations } from "@/lib/translations";
import { formatRON } from "@/lib/currency";

export default function Products() {
  const { data: products, isLoading } = useListProducts();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ești sigur că vrei să ștergi acest produs?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: translations.success });
        },
        onError: () => toast({ title: translations.failedToUpdateProduct, variant: "destructive" })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{translations.productsTitle}</h1>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> {translations.newProduct}</Button>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : products?.map(product => (
          <Card key={product.id} className="overflow-hidden bg-card/50 group relative">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(product)}>
                    <Pencil className="w-4 h-4 mr-2" /> {translations.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive focus:text-destructive">
                    <Trash className="w-4 h-4 mr-2" /> {translations.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="aspect-square bg-muted">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Fără imagine</div>
              )}
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-foreground">{formatRON(product.default_price)}</span>
                <span>{product.filament_used_grams}g</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        product={selectedProduct} 
      />
    </div>
  );
}
