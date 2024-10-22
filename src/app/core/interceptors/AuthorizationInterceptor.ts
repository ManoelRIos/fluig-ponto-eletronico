import { Injectable, isDevMode } from '@angular/core'
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

declare const OAuth: any

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
  protectedRoutes = [
    '/api/public/ecm/dataset/datasets',
    '/ecm-forms/api/v2/cardindex/',
    '/api/public/2.0/users/getCurrent',
    '/content-management/api',
    '/api/public/2.0/documents',
    '/ecm/upload',
    '/api/public/2.0/documents/getDownloadURL',
    '/api/public/2.0/folderdocuments/create',
    '/collaboration/api/v3/users/manoel.rios/picture',
  ]

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (isDevMode() && this.protectedRoutes.some((protectedRoute) => req.url.startsWith(protectedRoute))) {
      const { method, url, body } = req
      const urlComplete = `${environment.baseUrl}${url}`
      const oauthHeaders = this.getOAuthHeaders({
        url: urlComplete,
        method,
        body,
      })

      req = req.clone({
        setHeaders: { ...oauthHeaders },
      })
    }
    return next.handle(req)
  }

  /**
   * Gera os cabeçalhos de autenticação OAuth com base nos dados de solicitação e credenciais de acesso.
   * @param requestData - Dados da solicitação, incluindo URL e método HTTP.
   * @returns Um objeto contendo os cabeçalhos OAuth para a solicitação.
   */
  private getOAuthHeaders(requestData: { url: string; method: string; body?: string }) {
    const oauth = OAuth({
      consumer: {
        public: environment.consumerKey,
        secret: environment.consumerSecret,
      },
    })

    const token = {
      public: environment.accessToken,
      secret: environment.tokenSecret,
    }

    return oauth.toHeader(oauth.authorize(requestData, token))
  }
}
