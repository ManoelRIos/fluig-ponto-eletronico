import { CurrentUser } from './../../interfaces/current-user.interface'
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

import { map, catchError, first } from 'rxjs/operators'
import { BaseService } from '../base.service'
import { inject } from '@angular/core'
import { Role } from '../../models/Role'
import { LocalUser } from '../../models/LocalUser'

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

   getLocalUser(code: string): Observable<LocalUser> {
      return this.httpClient.get<{ content: string }>(`/api/public/2.0/users/${code}/locals`).pipe(
         first(),
         map((response: any) => ({
            id: response.content.id,
            name: response.content.name,
            timezone: response.content.timezone,
            defaultLocale: response.content.defaultLocale,
            latitude: response.content.latitude,
            longitude: response.content.longitude,
            radius: response.content.radius,
            localUsers: response.content.localUsers,
            holidays: response.content.holidays,
         })),
      )
   }
}
