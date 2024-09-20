import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { delay, finalize, Observable } from 'rxjs';
import { FluigLoadingService } from '../services/fluig/fluig-loading.service';


@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

    private loading = inject(FluigLoadingService);
    service_count = 0;

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        this.service_count++;
        this.loading.show();

        return next.handle(req).pipe(            
            finalize(() =>{
                this.service_count--;
                if (this.service_count === 0){
                    this.loading.hide();
                }
            })
        );
    }

}
