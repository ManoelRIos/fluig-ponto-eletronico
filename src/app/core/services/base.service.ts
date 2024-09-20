import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { DatasetResponse } from '../interfaces'

@Injectable({
    providedIn: 'root'
})
export abstract class BaseService {

    /**
    * Extrai lista de dados de um dataset
    * @param response - A resposta da do dataset.
    * @returns Um Observable com o erro.
    */
    protected getDatasetValues(response: DatasetResponse) {
        const values = response.content.values || [];
        if (values.length) {
            let msgError = values[0]['ERROR'] || values[0]['Mensagem'];
            if (msgError) {
                throw new Error(msgError);
            }
            return values;
        }
        return values;
    }

    /**
     * Lida com erros do serviço e retorna um Observable com o erro.
     * @param response - A resposta HTTP ou objeto de erro.
     * @returns Um Observable com o erro.
     */
    protected serviceError(response: Response | any) {
        console.log(response)
        if (response instanceof HttpErrorResponse) {
            if (response.statusText === "Unknown Error") {
                response = "Ocorreu um erro inesperado"
            }
            if (response.status === 500) {
                if (response.statusText === "Internal Server Error" || response.statusText === "OK") {
                    if (response.error) {
                        if (response.error.message) {
                            response = response.error.message;
                        } else {
                            response = response.error.replace(/{|}/g, '');;
                        }
                    } else {
                        response = "Internal Server Error"
                    }
                }
            }

            if (response.statusText === "Bad Request" || response.statusText === "Not Found") {
                response = response.error.detailedMessage
            }
        }
        return throwError(() => response);
    }

}
