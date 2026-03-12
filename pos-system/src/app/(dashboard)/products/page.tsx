import { ProductTable } from '@/components/products/ProductTable'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground">
          Manage your products, set prices, and track inventory stock levels.
        </p>
      </header>

      <ProductTable />
    </div>
  )
}
