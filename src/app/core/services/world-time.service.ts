import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class WorldTimeService {
  private httpClient = inject(HttpClient)

  getDateTime(): Observable<any> {
    return this.httpClient.get('https://worldtimeapi.org/api/timezone/America/Sao_Paulo')
  }
}
