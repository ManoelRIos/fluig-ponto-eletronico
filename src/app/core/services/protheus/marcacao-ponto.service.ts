import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarcacaoPontoService {
  private httpClient = inject(HttpClient);

  public postMarcacaoPonto(body: MarcacaoPonto ) {    
    return this.httpClient
      .post<any>(`https://federacaonacional130421.protheus.cloudtotvs.com.br:4050/rest/marcacaoponto/inclui`, body)
      .pipe(first());
  }
}

export interface MarcacaoPonto {
  filial: string,
  hora: Number, 
  matricula: string,
  data: string
}
