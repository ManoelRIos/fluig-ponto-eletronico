import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';

import { map, catchError, first } from 'rxjs/operators';
import { BaseService } from '../base.service';
import { CurrentUser } from '../../interfaces';
import { inject } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CurrentUserService extends BaseService {

    private httpClient = inject(HttpClient);

    getCurrentUser(): Observable<CurrentUser> {
        return this.httpClient.get<any>('/api/public/2.0/users/getCurrent').pipe(
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
                roles: response.content.roles
            })),
            catchError(this.serviceError)
        );
    }

}
