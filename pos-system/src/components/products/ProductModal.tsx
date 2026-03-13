'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductFormValues } from '@/lib/validations'
import { Product } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'
import { Separator } from '@/components/ui/separator'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product | null
}

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category: '',
      price: 0,
      cost_price: 0,
      quantity: 0,
      low_stock_threshold: 5,
      is_active: true,
      variants: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category,
        price: Number(product.price),
        cost_price: Number(product.cost_price || 0),
        quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold,
        variants: (product.variants || []).map(v => ({
          ...v,
          sku: v.sku || '',
        })),
      })
    } else {
      form.reset({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        category: '',
        price: 0,
        cost_price: 0,
        quantity: 0,
        low_stock_threshold: 5,
        is_active: true,
        variants: [],
      })
    }
  }, [product, form])

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true)
    try {
      if (product) {
        const { error } = await supabase
          .from('products')
          .update(values)
          .eq('id', product.id)
        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        const { error } = await supabase.from('products').insert(values)
        if (error) throw error
        toast.success('Product created successfully')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jollof Rice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      key={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Drinks">Drinks</SelectItem>
                        <SelectItem value="Snacks">Snacks</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₵)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Cost Price (₵)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. JOL-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Initial Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled={!!product} // Quantity should be adjusted via Inventory, not Edit
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="low_stock_threshold"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product Variants</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: Math.random().toString(36).substring(7), name: '', sku: '', price: form.getValues('price'), quantity: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Variant
                </Button>
              </div>
              <Separator />
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-gray-50/50">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase">Name (e.g. XL, Blue)</FormLabel>
                            <FormControl>
                              <Input className="h-8 text-xs" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase">SKU</FormLabel>
                            <FormControl>
                              <Input className="h-8 text-xs font-mono" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase">Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" className="h-8 text-xs" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase">Qty</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                className="h-8 text-xs" 
                                {...field} 
                                disabled={!!product} // Quantity adjusted via inventory
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
