import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GedService {
  private httpClient = inject(HttpClient);

  constructor() {}

  public getDocument(documentId: string) {
    return this.httpClient
      .get<{ content: string }>(
        `/api/public/2.0/documents/getDownloadURL/${documentId}`
      )
      .pipe(first());
  }

  public uploadDocument(body: FormData) {
    return this.httpClient.post(`/ecm/upload`, body);
  }

  public createDocument(body: {
    description: string;
    parentId: string | number;
    attachments: { fileName: string }[];
  }) {
    return this.httpClient.post(`/api/public/ecm/document/createDocument`, body);
  }
}
