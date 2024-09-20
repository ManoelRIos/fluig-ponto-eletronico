export interface CurrentUser {
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



