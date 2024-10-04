import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
} from '@angular/material/dialog';
import {
  Component,
  ElementRef,
  inject,
  Inject,
  Input,
  ViewChild,
} from '@angular/core';
import { GedService } from '../../../services/fluig/ged.service';
import { first } from 'rxjs';
import { CurrentUser } from '../../../interfaces';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormularioService } from '../../../services/fluig/formulario.service';
import { GeocodingService } from '../../../services/google/geocoding.service';
import { WorldTimeService } from '../../../services/world-time.service';

@Component({
  selector: 'app-dialog-register',
  standalone: true,
  imports: [MatDialogActions, FormsModule],
  templateUrl: './dialog-register.component.html',
  styleUrl: './dialog-register.component.scss',
})
export class DialogRegisterComponent {
  private formularioService = inject(FormularioService);

  data = inject(MAT_DIALOG_DATA);
  private gedService = inject(GedService);

  @ViewChild('video') videoElement!: ElementRef;
  @ViewChild('canvas') canvasElement!: ElementRef;
  capturedImage!: string;

  @Input() currentUser!: CurrentUser;
  currentDate: any;
  configurations: any;
  cpf: string = '';
  formGroup!: FormGroup;
  WIDTH = 400;
  HEIGHT = 280;
  folder: any;
  photo: any;
  private _snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<DialogRegisterComponent>,
    private fb: FormBuilder,
    private geocodingService: GeocodingService,
    private worldTimeService: WorldTimeService
  ) {}

  ngOnInit() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.nativeElement.srcObject = stream;
      })
      .catch((error) => {
        console.error('Erro ao acessar a câmera:', error);
      });
  }

  getDateTime(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldTimeService.getDateTime().subscribe(
        (response) => {
          this.currentDate = response;
          resolve();
        },
        (error) => {
          reject('Erro ao obter a hora:' + error);
          console.error('Erro ao obter a hora:', error);
        }
      );
    });
  }

  async postConfigurations(): Promise<void> {
    await this.getDateTime();

    const now = this.currentDate.datetime;
    return new Promise(async (resolve) => {
      let data = [
        {
          fieldId: 'datetime',
          value: now,
        },
        {
          fieldId: 'criado_em',
          value: format(now, 'yyyy-MM-dd'),
        },

        {
          fieldId: 'usuario_nome',
          value: this.currentUser?.fullName,
        },
        {
          fieldId: 'usuario_codigo',
          value: this.currentUser?.id,
        },
        {
          fieldId: 'status',
          value: 'active',
        },
        {
          fieldId: 'codigo_foto',
          value: this.photo?.content?.id,
        },
        {
          fieldId: 'codigo_pasta',
          value: this.folder.content.documentId,
        },
      ];

      this.formularioService
        .postData(92035, data)
        .pipe(first())
        .subscribe({
          next: (response) => {
            console.log(response);
            this.configurations = response;
            this.openSnackBar('Foto cadastrada com sucesso!', 'ok');
            resolve();
          },
        });
    });
  }

  async captureImage() {
    if (!this.cpf) {
      this.openSnackBar('O CPF é obrigatório', '');
      return;
    }

    const canvas = this.canvasElement.nativeElement;
    const video = this.videoElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.capturedImage = canvas.toDataURL('image/png');
    // Convert data URL to Blob
    console.log(this.capturedImage);
    const blob = this.dataURLtoBlob(this.capturedImage);

    console.log(this.data);
    let fileName =
      format(new Date(), 'yyyyMMddHHmm') +
      '_' +
      this.data.currentUser.code +
      '_' +
      this.cpf +
      '.png';

    let folderData = {
      parentFolderId: 91793,
      documentDescription: this.data.currentUser.fullName,
      versionDescription: 'VersionDescription',
      expires: 'false',
      publisherId: this.data.currentUser.code,
      volumeId: 'Default',
      inheritSecurity: 'true',
      downloadEnabled: 'true',
      updateIsoProperties: 'false',
      documentTypeId: '1',
      internalVisualizer: 'true',
    };
    const formData = new FormData();
    formData.append('image', blob, fileName);

    await this.uploadDocument(formData);
    
    if (!this.data.configurations) {
      await this.postFolder(folderData);
      await this.postConfigurations();
    }

    const file = {
      description: fileName,
      parentId:
        this.data.configurations?.codigo_foto ??
        this.configurations.codigo_foto,
      attachments: [{ fileName: fileName }],
    };
    this.createDocument(file);
    let putFormConfig = {
      values: [
        {
          fieldId: 'codigo_foto',
          value: this.photo?.content?.id,
        },
      ],
    };
    this.putConfigurations(this.configurations.documentId, putFormConfig);
  }

  async putConfigurations(documentId: number, data: any) {
    this.formularioService
      .putData(92035, documentId, data)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.configurations = response;
        },
      });
  }

  dataURLtoBlob(dataURL: string) {
    const binaryString = window.atob(dataURL.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  }

  postFolder(folderData: any): Promise<void> {
    return new Promise(async (resolve) => {
      this.gedService.postFolder(folderData).subscribe(
        (response) => {
          this.folder = response;
          resolve();
        },
        (error) => console.error('Erro ao enviar imagem:', error)
      );
    });
  }

  uploadDocument(formData: FormData): Promise<void> {
    return new Promise(async (resolve) => {
      this.gedService.uploadDocument(formData).subscribe(
        (response) => {
          console.log(response);
          resolve();
        },
        (error) => console.error('Erro ao enviar imagem:', error)
      );
    });
  }

  async createDocument(file: any) {
    this.gedService.createDocument(file).subscribe(
      (response) => {
        this.photo = response;
      },
      (error) => console.error('Erro ao enviar imagem:', error)
    );
  }

  cancel() {
    this.stopCamera();
    this.dialogRef.close(false);
  }
  accept() {
    this.captureImage();
    this.stopCamera();
    if (this.cpf) {
      this.dialogRef.close(this.cpf);
    }
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 5000,
      panelClass: ['danger-snackbar'],
    });
  }

  stopCamera() {
    console.log(this.videoElement.nativeElement.srcObject);
    if (this.videoElement.nativeElement.srcObject) {
      const tracks = this.videoElement.nativeElement.srcObject.getTracks();
      tracks.forEach((track: any) => {
        track.stop();
      });
    }
  }
}
