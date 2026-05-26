import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InventoryItem, InventoryInput, InventoryUpdate, useCreateInventoryItem, useUpdateInventoryItem, getListInventoryQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  filament_name: z.string().min(1, "Required"),
  color: z.string().optional(),
  grams_left: z.coerce.number().optional(),
  cost_per_kg: z.coerce.number().optional(),
  low_stock_threshold: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function InventoryDialog({ 
  item, 
  open, 
  onOpenChange 
}: { 
  item?: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: item ? {
      filament_name: item.filament_name,
      color: item.color || "",
      grams_left: item.grams_left || 0,
      cost_per_kg: item.cost_per_kg || 0,
      low_stock_threshold: item.low_stock_threshold || 500,
    } : {
      filament_name: "",
      color: "",
      grams_left: 1000,
      cost_per_kg: 0,
      low_stock_threshold: 500,
    }
  });

  const onSubmit = (values: FormValues) => {
    if (item) {
      updateItem.mutate({ id: item.id, data: values as InventoryUpdate }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          toast({ title: "Inventory updated successfully" });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to update inventory", variant: "destructive" })
      });
    } else {
      createItem.mutate({ data: values as InventoryInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          toast({ title: "Inventory created successfully" });
          form.reset();
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to create inventory", variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Material" : "Add Material"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the details of the selected material." : "Fill in the details to add a new material to inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="filament_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filament Name / Type</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost_per_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per KG</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grams_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grams Left</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="low_stock_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {item ? "Save Changes" : "Add Material"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
