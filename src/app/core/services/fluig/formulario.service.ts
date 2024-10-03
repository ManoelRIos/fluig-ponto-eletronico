import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, first } from 'rxjs/operators';
import { BaseService } from '../base.service';
import { DatasetResponse } from '../../interfaces';
import { Constraint } from '../../models/constraint.model';
import { DataValues } from '../../interfaces/data-values.interface';
import { Values } from '../../interfaces/work-record';

@Injectable({
  providedIn: 'root',
})
export class FormularioService extends BaseService {
  private httpClient = inject(HttpClient);

  /**
   * Obtém registros de um formulário através do seu dataset
   * @param {string} name Código do dataset
   * @param {Constraint[]} constraints Lista de constraints
   * @param {string[]} order Ordenação dos campoas
   * @param {string[]} fields Campo que deseja retornar
   * @returns Um Observable
   */
  public getData(
    name: string,
    constraints: Constraint[],
    order: string[] = [],
    fields: string[] = []
  ) {
    let body = { name, constraints, order };
    return this.httpClient
      .post<DatasetResponse>('/api/public/ecm/dataset/datasets', body)
      .pipe(first(), map(this.getDatasetValues), catchError(this.serviceError));
  }

  public postData(documentId: number, dataValues: DataValues[]) {
    const body = { values: dataValues };
    return this.httpClient
      .post<Values>(`/ecm-forms/api/v2/cardindex/${documentId}/cards`, body)
      .pipe(first());
  }

  public putData(documentId: number, cardId: number, dataValues: DataValues[]) {
    const body = { values: dataValues };
    return this.httpClient
      .put<Values>(
        `/ecm-forms/api/v2/cardindex/${documentId}/cards/${cardId}`,
        body
      )
      .pipe(first());
  }


}


