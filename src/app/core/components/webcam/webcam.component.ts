import { NgClass, NgIf } from '@angular/common';
import { environment } from '../../../../environments/environment';

import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Inject,
  Output,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as faceapi from 'face-api.js';
import { first } from 'rxjs';
import Swal from 'sweetalert2';
import { GedService } from '../../services/fluig/ged.service';
import { MatSnackBar } from '@angular/material/snack-bar';
declare const navigator: any;

@Component({
  selector: 'app-webcam',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './webcam.component.html',
  styleUrl: './webcam.component.scss',
})
export class WebcamComponent {
  WIDTH = 440;
  HEIGHT = 280;
  referenceMatch = true;
  isScanned = '';

  @Output() onAuthenticFacialId = new EventEmitter<any>();
  private gedService = inject(GedService);
  private _snackBar = inject(MatSnackBar);

  @ViewChild('video', { static: true })
  public video: ElementRef | undefined;
  @ViewChild('canvas', { static: true })
  public canvasRef: ElementRef | undefined;
  public animationFaceId: ElementRef | undefined;
  @ViewChild('animation')
  public animation!: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<WebcamComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick() {
    this.stopCamera();
    this.dialogRef.close(this.referenceMatch);
  }

  stream: any;
  detection: any;
  resizedDetections: any;
  canvas: any;
  canvasEl: any;
  displaySize: any;
  videoInput: any;

  async ngOnInit() {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(`${environment.assets}/models`),
      faceapi.nets.faceLandmark68Net.loadFromUri(
        `${environment.assets}/models`
      ),
      faceapi.nets.faceRecognitionNet.loadFromUri(
        `${environment.assets}/models`
      ),
      faceapi.nets.faceExpressionNet.loadFromUri(
        `${environment.assets}/models`
      ),
      faceapi.nets.ssdMobilenetv1.loadFromUri(`${environment.assets}/models`),
    ]);
  }

  getDocument(documentId: string): Promise<{ content: string }> {
    return new Promise((resolve) => {
      this.gedService
        .getDocument(documentId)
        .pipe(first())
        .subscribe({
          next: (response) => {
            resolve(response);
          },
          error: (ex: any) => {
            resolve(ex);
          },
        });
    });
  }

  startVideo() {
    this.videoInput = this.video?.nativeElement;
    navigator.getUserMedia(
      { video: {}, audio: false },
      (stream: any) => (this.videoInput.srcObject = stream),
      (err: any) => console.log(err)
    );
    this.detectFaces();
  }
  async loadReferenceImage() {
    const urlImage: any = await this.getDocument('91957');
    if (!urlImage?.ok) {
      this.openSnackBar(
        'Não foi encontrado sua foto no nosso banco, mas já vamos providenciar! :)',
        '',
        '',
        'center'
      );
      this.referenceMatch = false;
      this.onNoClick();
      return;
    }

    const img = await faceapi.fetchImage(urlImage?.content);
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      throw new Error('No face detected in the reference image');
    }

    return new faceapi.LabeledFaceDescriptors('reference', [
      detections.descriptor,
    ]);
  }

  async detectFaces() {
    const labeledFaceDescriptors = await this.loadReferenceImage();
    if (!labeledFaceDescriptors) {
      this.stopCamera();
      return;
    }
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    console.log(faceMatcher);

    let counterReference = 0;
    let seconds = 0;
    let interval = setInterval(async () => {
      this.canvas = faceapi.createCanvasFromMedia(this.videoInput);
      this.canvasEl = this.canvasRef?.nativeElement;
      this.canvasEl.appendChild(this.canvas);
      this.canvas.setAttribute('id', 'canvass');
      this.canvas.setAttribute(
        'style',
        `position: absolute; 
             top: 75px; 
             left: 100px`
      );

      this.displaySize = {
        width: this.videoInput.width,
        height: this.videoInput.height,
      };

      faceapi.matchDimensions(this.canvas, this.displaySize);
      this.detection = await faceapi
        .detectAllFaces(this.videoInput, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors(); // Adiciona a detecção de descritores

      this.resizedDetections = faceapi.resizeResults(
        this.detection,
        this.displaySize
      );

      // Limpa o canvas
      this.canvas
        .getContext('2d')
        .clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Verificar correspondência de rostos
      this.resizedDetections.forEach((detection: any) => {
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

        console.log(bestMatch);
        if (bestMatch.label === 'reference') {
          counterReference += 1;
        } else {
          this.openSnackBar('Centralize o rosto!', '');
        }

        if (seconds === 20) {
          if (counterReference > 10) {
            this.referenceMatch = true;
            clearInterval(interval);
            this.onNoClick();
          } else {
            this.stopCamera();
            this.referenceMatch = false;
            clearInterval(interval);
            this.onNoClick();
          }
        }

        console.log('counterReference : ' + counterReference);
        seconds += 1;
      });
    }, 100);

    console.log(' this.referenceMatch', this.referenceMatch);
  }

  stopCamera() {
    console.log(this.videoInput.srcObject);
    if (this.videoInput.srcObject) {
      const tracks = this.videoInput.srcObject.getTracks();
      tracks.forEach((track: any) => {
        track.stop();
      });
    }
  }

  openSnackBar(
    message: string,
    action: string,
    positionY: any = 'top',
    positionX: any = 'end'
  ) {
    this._snackBar.open(message, action, {
      horizontalPosition: positionX,
      verticalPosition: positionY,
      duration: 5000,
    });
  }
}
