import Dexie, { type Table } from 'dexie'
import type { Product, Sale, SaleItem } from '@/types'

export interface PendingSale {
  id?: number
  saleData: Partial<Sale>
  items: (SaleItem & { product_name: string })[]
  createdAt: string
  status: 'pending' | 'failed' | 'synced'
  errorMessage?: string
}

export interface OfflineStockAdjustment {
  id?: number
  productId: string
  adjustment: number // e.g., +10 or -5
  reason: string
  createdAt: string
  status: 'pending' | 'synced'
}

export interface SyncLog {
  id?: number
  type: 'UPLOAD' | 'DOWNLOAD'
  timestamp: string
  message: string
  status: 'success' | 'failure'
}

export class PosDatabase extends Dexie {
  products!: Table<Product>
  pendingSales!: Table<PendingSale>
  offlineStockAdjustments!: Table<OfflineStockAdjustment>
  syncLogs!: Table<SyncLog>

  constructor() {
    super('pos_db')
    this.version(1).stores({
      products: 'id, name, sku, category',
      pendingSales: '++id, status, createdAt',
      offlineStockAdjustments: '++id, productId, status',
      syncLogs: '++id, type, status, timestamp',
    })
  }
}

export const db = new PosDatabase()
