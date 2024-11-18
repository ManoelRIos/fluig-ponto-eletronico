import { environment } from './../../../../../../environments/environment'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions } from '@angular/material/dialog'
import { Component, ElementRef, inject, Inject, Input, ViewChild, ViewEncapsulation } from '@angular/core'
import { GedService } from '../../../../services/fluig/ged.service'
import { first } from 'rxjs'
import { CurrentUser } from '../../../../interfaces'
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms'
import { format } from 'date-fns'
import { MatSnackBar } from '@angular/material/snack-bar'
import { FormularioService } from '../../../../services/fluig/formulario.service'
import { GeocodingService } from '../../../../services/google/geocoding.service'
import { WorldTimeService } from '../../../../services/world-time.service'
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask'

@Component({
   selector: 'app-dialog-register',
   standalone: true,
   encapsulation: ViewEncapsulation.None,
   imports: [MatDialogActions, FormsModule, NgxMaskDirective, NgxMaskPipe],
   templateUrl: './dialog-register.component.html',
   styleUrl: './dialog-register.component.scss',
})
export class DialogRegisterComponent {
   private formularioService = inject(FormularioService)
   private gedService = inject(GedService)

   data = inject(MAT_DIALOG_DATA)
   public environment = environment

   @ViewChild('video') videoElement!: ElementRef
   @ViewChild('canvas') canvasElement!: ElementRef
   capturedImage!: string

   @Input() currentUser!: CurrentUser
   currentDate: any
   cpf: string = ''
   formGroup!: FormGroup
   WIDTH = 400
   HEIGHT = 280
   folder: any
   photo: any
   private _snackBar = inject(MatSnackBar)

   constructor(
      public dialogRef: MatDialogRef<DialogRegisterComponent>,
      private fb: FormBuilder,
      private geocodingService: GeocodingService,
      private worldTimeService: WorldTimeService,
   ) {}

   ngOnInit() {
      navigator.mediaDevices
         .getUserMedia({ video: true })
         .then((stream) => {
            this.videoElement.nativeElement.srcObject = stream
         })
         .catch((error) => {
            console.error('Erro ao acessar a câmera:', error)
         })
   }

   getDateTime(): Promise<void> {
      return new Promise((resolve, reject) => {
         this.worldTimeService.getDateTime().subscribe(
            (response) => {
               this.currentDate = response
               resolve()
            },
            (error) => {
               reject('Erro ao obter a hora:' + error)
               console.error('Erro ao obter a hora:', error)
            },
         )
      })
   }

   async captureImage(): Promise<void> {
      return new Promise(async (resolve) => {
         if (!this.cpf) {
            this.openSnackBar('O CPF é obrigatório', '')
            return
         }

         const canvas = this.canvasElement.nativeElement
         const video = this.videoElement.nativeElement
         canvas.width = video.videoWidth
         canvas.height = video.videoHeight

         const context = canvas.getContext('2d')
         context.drawImage(video, 0, 0, canvas.width, canvas.height)
         this.capturedImage = canvas.toDataURL('image/png')
         // Convert data URL to Blob
         const blob = this.dataURLtoBlob(this.capturedImage)

         console.log(this.data)
         let fileName =
            format(new Date(), 'yyyyMMddHHmm') +
            '_' +
            this.data.currentUser.code.replace('.', '') +
            '_' +
            this.cpf.replace(/\D/g, '') +
            '.png'

         const formData = new FormData()
         formData.append('image', blob, fileName)

         await this.uploadDocument(formData)

         const file = {
            description: fileName,
            parentId: this.data.configurations?.codigo_pasta,
            attachments: [{ fileName: fileName }],
         }

         await this.createDocument(file)
         resolve()
      })
   }

   async putConfigurations(documentId: number, data: any) {
      this.formularioService
         .putData(this.environment.codConfigPonto, documentId, data)
         .pipe(first())
         .subscribe({
            next: (response) => {
               this.data.configurations = response
            },
         })
   }

   dataURLtoBlob(dataURL: string) {
      const binaryString = window.atob(dataURL.split(',')[1])
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < bytes.length; i++) {
         bytes[i] = binaryString.charCodeAt(i)
      }
      return new Blob([bytes], { type: 'image/png' })
   }

   uploadDocument(formData: FormData): Promise<void> {
      return new Promise(async (resolve) => {
         this.gedService.uploadDocument(formData).subscribe(
            (response) => {
               console.log(response)
               resolve()
            },
            (error) => console.error('Erro ao enviar imagem:', error),
         )
      })
   }

   async createDocument(file: any): Promise<void> {
      return new Promise(async (resolve) => {
         this.gedService.createDocument(file).subscribe(
            (response) => {
               this.photo = response
               resolve()
            },
            (error) => console.error('Erro ao enviar imagem:', error),
         )
      })
   }

   async cancel() {
      this.stopCamera()
      this.dialogRef.close(false)
   }

   async accept() {
      try {
         // Await both image capture and camera stop in parallel
         await Promise.all([this.captureImage(), this.stopCamera()])

         if (this.cpf) {
            this.dialogRef.close({
               photo: this.photo,
               cpf: this.cpf,
               configurations: this.data.configurations,
            })
         }
      } catch (error) {
         console.error('Error during capture or camera stop:', error)
         // Handle errors appropriately (e.g., display an error message)
      }
   }

   openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
         horizontalPosition: 'end',
         verticalPosition: 'top',
         duration: 5000,
         panelClass: ['danger-snackbar'],
      })
   }

   stopCamera() {
      console.log(this.videoElement.nativeElement.srcObject)
      if (this.videoElement.nativeElement.srcObject) {
         const tracks = this.videoElement.nativeElement.srcObject.getTracks()
         tracks.forEach((track: any) => {
            track.stop()
         })
      }
   }
}
