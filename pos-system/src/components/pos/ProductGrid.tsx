'use client'

import { useState, useEffect } from 'react'
import { Product, ProductVariant } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from './ProductCard'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Scan } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/store/cartStore'
import { VariantSelectorModal } from './VariantSelectorModal'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  
  const addItem = useCartStore((state) => state.addItem)
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (data) {
        setProducts(data)
        const cats = Array.from(new Set(data.map((p) => p.category)))
        setCategories(['all', ...cats])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [supabase])

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleVariantSelect = (variant: ProductVariant) => {
    if (selectedProduct) {
      addItem(selectedProduct, variant.id)
      setIsVariantModalOpen(false)
      setSelectedProduct(null)
    }
  }

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode)
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedProduct(product)
        setIsVariantModalOpen(true)
      } else {
        addItem(product)
        toast.success(`Added ${product.name}`)
      }
    } else {
      toast.error('Product not found for code: ' + barcode)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU or barcode..."
            className="pl-9 pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => setIsScannerOpen(true)}
            title="Scan Barcode"
          >
            <Scan className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
          <TabsList className="bg-transparent border h-9">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="capitalize text-xs data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={(p) => {
                  setSelectedProduct(p)
                  setIsVariantModalOpen(true)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No products found</p>
          </div>
        )}
      </div>

      <VariantSelectorModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={selectedProduct}
        onSelect={handleVariantSelect}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  )
}
