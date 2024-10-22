import { CurrentUser } from './../../interfaces/current-user.interface'
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

import { map, catchError, first } from 'rxjs/operators'
import { BaseService } from '../base.service'
import { inject } from '@angular/core'
import { Role } from '../../models/Role'

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService extends BaseService {
  public currentUser!: CurrentUser
  public profile!: Role
  private httpClient = inject(HttpClient)

  getCurrentUser(): Observable<CurrentUser> {
    return this.httpClient.get<CurrentUser>('/api/public/2.0/users/getCurrent').pipe(
      first(),
      map((response: any) => ({
        id: response.content.id,
        tenantId: response.content.extData.tenantId,
        tenantCode: response.content.extData.tenantCode,
        login: response.content.login,
        email: response.content.email,
        code: response.content.code,
        firstName: response.content.firstName,
        lastName: response.content.lastName,
        fullName: response.content.fullName,
        groups: response.content.groups,
        roles: response.content.roles,
      })),
      catchError(this.serviceError),
    )
  }
}
