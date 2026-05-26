import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Order, OrderInput, OrderUpdate, useCreateOrder, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { translations } from "@/lib/translations";

const formSchema = z.object({
  customer_name: z.string().min(1, translations.required),
  product_name: z.string().min(1, translations.required),
  product_color: z.string().optional(),
  material: z.string().optional(),
  order_price: z.coerce.number().optional(),
  shipping_price: z.coerce.number().optional(),
  filament_cost: z.coerce.number().optional(),
  courier: z.string().optional(),
  awb_code: z.string().optional(),
  easybox_qr_image_url: z.string().optional().or(z.literal("")),
  status: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function OrderDialog({ 
  order, 
  open, 
  onOpenChange 
}: { 
  order?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | undefined>(order?.easybox_qr_image_url);
  
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: order ? {
      customer_name: order.customer_name,
      product_name: order.product_name,
      product_color: order.product_color || "",
      material: order.material || "",
      order_price: order.order_price || 0,
      shipping_price: order.shipping_price || 0,
      filament_cost: order.filament_cost || 0,
      courier: order.courier || "",
      awb_code: order.awb_code || "",
      easybox_qr_image_url: order.easybox_qr_image_url || "",
      status: order.status || "Pending",
      deadline: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : "",
      notes: order.notes || "",
    } : {
      customer_name: "",
      product_name: "",
      product_color: "",
      material: "",
      order_price: 0,
      shipping_price: 0,
      filament_cost: 0,
      courier: "",
      awb_code: "",
      easybox_qr_image_url: "",
      status: "Pending",
      deadline: "",
      notes: "",
    }
  });

  const onSubmit = (values: FormValues) => {
    if (order) {
      updateOrder.mutate({ id: order.id, data: values as OrderUpdate }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order updated successfully" });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to update order", variant: "destructive" })
      });
    } else {
      createOrder.mutate({ data: values as OrderInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order created successfully" });
          form.reset();
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to create order", variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? translations.editOrder : "Comandă nouă"}</DialogTitle>
          <DialogDescription>
            {order ? "Actualizează detaliile comenzii selectate." : "Completează detaliile pentru a crea o comandă nouă."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.customerName}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.productName}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.color}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.material}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.orderPrice}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.shippingPrice}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filament_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.filamentCost}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.status}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">{translations.pending}</SelectItem>
                        <SelectItem value="Printing">{translations.printing}</SelectItem>
                        <SelectItem value="Packaging">{translations.packaging}</SelectItem>
                        <SelectItem value="Ready to Ship">{translations.readyToShip}</SelectItem>
                        <SelectItem value="Shipped">{translations.shipped}</SelectItem>
                        <SelectItem value="Delivered">{translations.delivered}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.deadline}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.courier}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awb_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.awbCode}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="easybox_qr_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.uploadImage}</FormLabel>
                  <FormControl>
                    <ImageUpload
                      preview={imagePreview}
                      onImageSelect={(file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setImagePreview(base64);
                          field.onChange(base64);
                        };
                        reader.readAsDataURL(file);
                      }}
                      onImageRemove={() => {
                        setImagePreview(undefined);
                        field.onChange("");
                      }}
                      label={translations.chooseImage}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.notes}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{translations.cancel}</Button>
              <Button type="submit" disabled={createOrder.isPending || updateOrder.isPending}>
                {order ? translations.save : "Creare"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
