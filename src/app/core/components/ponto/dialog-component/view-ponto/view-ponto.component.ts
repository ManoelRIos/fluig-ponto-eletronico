import { Component, EventEmitter, inject, Output } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent } from '@angular/material/dialog'
import { GedService } from '../../../../services/fluig/ged.service'
import { first } from 'rxjs'
import { NgIf } from '@angular/common'
import { format } from 'date-fns/format'
@Component({
   selector: 'app-view-ponto',
   standalone: true,
   imports: [MatDialogActions, MatDialogContent, NgIf],
   templateUrl: './view-ponto.component.html',
   styleUrl: './view-ponto.component.scss',
})
export class ViewPontoComponent {
   constructor(public viewWorkRecordDialog: MatDialogRef<ViewPontoComponent>) {}

   data = inject(MAT_DIALOG_DATA)
   private gedService = inject(GedService)
   photo!: string
   public format = format

   async ngOnInit(): Promise<void> {
      if (this.data.workRecord?.foto_codigo) {
         this.photo = (await this.getDocument(this.data.workRecord?.foto_codigo)).content
      }
   }

   getDocument(documentId: string): Promise<{ content: string }> {
      return new Promise((resolve) => {
         this.gedService
            .getDocument(documentId)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  resolve(response)
               },
               error: (ex: any) => {
                  resolve(ex)
               },
            })
      })
   }

   close(isApproved: string = '') {
      this.viewWorkRecordDialog.close(isApproved)
   }
}
