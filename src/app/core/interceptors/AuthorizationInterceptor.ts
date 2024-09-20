import { Injectable, isDevMode } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const OAuth: any;

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(req);
    if (isDevMode() && req.url.includes('/ecm')) {
      console.log('entrei');
      const { method, url, body } = req;
      const urlComplete = `${environment.baseUrl}${url}`;
      console.log(urlComplete);
      const oauthHeaders = this.getOAuthHeaders({
        url: urlComplete,
        method,
        body,
      });

      console.log(oauthHeaders);

      req = req.clone({
        setHeaders: { ...oauthHeaders },
      });
    }
    return next.handle(req);
  }

  /**
   * Gera os cabeçalhos de autenticação OAuth com base nos dados de solicitação e credenciais de acesso.
   * @param requestData - Dados da solicitação, incluindo URL e método HTTP.
   * @returns Um objeto contendo os cabeçalhos OAuth para a solicitação.
   */
  private getOAuthHeaders(requestData: {
    url: string;
    method: string;
    body?: string;
  }) {
    const oauth = OAuth({
      consumer: {
        public: environment.consumerKey,
        secret: environment.consumerSecret,
      },
    });

    const token = {
      public: environment.accessToken,
      secret: environment.tokenSecret,
    };

    return oauth.toHeader(oauth.authorize(requestData, token));
  }
}
