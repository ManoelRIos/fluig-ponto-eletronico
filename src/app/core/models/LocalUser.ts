export interface LocalUser {
   id: number
   name: string
   timezone: string
   defaultLocale: boolean
   latitude: number
   longitude: number
   radius: number
   localUsers: []
   holidays: []
}
