import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product, ProductInput, ProductUpdate, useCreateProduct, useUpdateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { translations } from "@/lib/translations";

const formSchema = z.object({
  name: z.string().min(1, translations.required),
  filament_used_grams: z.coerce.number().optional(),
  default_price: z.coerce.number().optional(),
  image_url: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function ProductDialog({ 
  product, 
  open, 
  onOpenChange 
}: { 
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | undefined>(product?.image_url ?? undefined);
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: product ? {
      name: product.name,
      filament_used_grams: product.filament_used_grams || 0,
      default_price: product.default_price || 0,
      image_url: product.image_url || "",
    } : {
      name: "",
      filament_used_grams: 0,
      default_price: 0,
      image_url: "",
    }
  });

  const onSubmit = (values: FormValues) => {
    if (product) {
      updateProduct.mutate({ id: product.id, data: values as ProductUpdate }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: translations.productUpdated });
          onOpenChange(false);
        },
        onError: () => toast({ title: translations.failedToUpdateProduct, variant: "destructive" })
      });
    } else {
      createProduct.mutate({ data: values as ProductInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: translations.productCreated });
          form.reset();
          onOpenChange(false);
        },
        onError: () => toast({ title: translations.failedToCreateProduct, variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? translations.editProduct : "Produs nou"}</DialogTitle>
          <DialogDescription>
            {product ? "Actualizează detaliile produsului selectat." : "Completează detaliile pentru a crea un produs nou."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="default_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.defaultPrice}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filament_used_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.filamentUsed}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="image_url"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{translations.cancel}</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {product ? translations.save : "Creare"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
