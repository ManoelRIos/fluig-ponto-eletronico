import { Role } from './Role'

export interface User {
  code: string
  mail: string
  id: string
  firstName: string
  fullName: string
  colleagueName: string
  groups: []
  lastName: string
  login: string
  roles: []
  tenantCode: string
  tenantId: number
  userTenantId: number
  extensionNr: string
  especializationArea: string
  profile: Role | any
}
