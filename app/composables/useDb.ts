import Dexie, { type Table } from 'dexie'

/* Entity: Dog */
export interface Dog {
  id: string
  name: string
  birthday?: string
  breed?: string
  memo?: string
  targetMin?: number
  targetMax?: number
  createdAt: string
  updatedAt: string
}

/* Entity: DailyLog */
export interface DailyLog {
  id: string
  dogId: string
  logDate: string // YYYY-MM-DD (JST)
  weight?: number
  memo?: string
  photoId?: string
  createdAt: string
  updatedAt: string
}

/* Entity: Photo */
export interface Photo {
  id: string
  dogId: string
  logDate: string
  blob: Blob
  mimeType: string
  size: number
  createdAt: string
}

/* Dexie DB */
class InochiDaijiDB extends Dexie {
  dogs!: Table<Dog, string>
  daily_logs!: Table<DailyLog, string>
  photos!: Table<Photo, string>

  constructor() {
    super('inochi-daiji-db')

    this.version(1).stores({
      dogs: 'id, name',
      daily_logs: 'id, dogId, logDate, [dogId+logDate]',
      photos: 'id, dogId, logDate'
    })
  }
}

export const db = new InochiDaijiDB()