export interface CurrentUser {
  id: number,
  tenantId: number,
  tenantCode: string,
  login: string,
  email: string,
  code: string,
  firstName: string,
  lastName: string,
  fullName: string,
  groups: string[],
  roles: string[]
}



