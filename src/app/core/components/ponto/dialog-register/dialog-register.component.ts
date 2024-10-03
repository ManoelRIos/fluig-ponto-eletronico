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

@Component({
  selector: 'app-dialog-register',
  standalone: true,
  imports: [MatDialogActions, FormsModule],
  templateUrl: './dialog-register.component.html',
  styleUrl: './dialog-register.component.scss',
})
export class DialogRegisterComponent {
  data = inject(MAT_DIALOG_DATA);
  private gedService = inject(GedService);

  @ViewChild('video') videoElement!: ElementRef;
  @ViewChild('canvas') canvasElement!: ElementRef;
  capturedImage!: string;

  @Input() currentUser!: CurrentUser;

  cpf: string = '';
  formGroup!: FormGroup;
  WIDTH = 400;
  HEIGHT = 280;
  private _snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<DialogRegisterComponent>,
    private fb: FormBuilder
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

    // fileName = 'manoelrios.png'
    // Create FormData object
    const formData = new FormData();
    formData.append('image', blob, fileName);
    const file = {
      description: fileName,
      parentId: 91793,
      attachments: [{ fileName: fileName }],
    };

    console.log('formData : ');
    console.log(formData);
    await this.uploadDocument(formData);
    this.createDocument(file);
  }

  dataURLtoBlob(dataURL: string) {
    const binaryString = window.atob(dataURL.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
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
      (response) => console.log('Imagem enviada com sucesso!', response),
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
      duration: 1000000,
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
