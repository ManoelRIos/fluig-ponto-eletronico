import { WebcamComponent } from './../webcam/webcam.component';
import { WorldTimeService } from './../../services/world-time.service';
import { NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { GeocodingService } from '../../services/google/geocoding.service';
import { Constraint } from '../../models/constraint.model';
import { FormularioService } from '../../services/fluig/formulario.service';
import { CurrentUserService } from '../../services/fluig/currentUser.service';
import { first, interval } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { CurrentUser } from '../../interfaces';
import loadFluigCalendar from '../../utils/loadFluigCalendar';
import { format, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateTotalHours, distanceCalculate } from '../../utils/utils';
import { WorkRecord } from '../../interfaces/work-record';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogRegisterComponent } from './dialog-register/dialog-register.component';

@Component({
  selector: 'app-ponto',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    WebcamComponent,
    MatDialogModule,
  ],
  templateUrl: './ponto.component.html',
  styleUrl: './ponto.component.scss',
})
export class PontoComponent {
  private formularioService = inject(FormularioService);
  private currentUserService = inject(CurrentUserService);
  private _snackBar = inject(MatSnackBar);

  latitude: number = 0;
  longitude: number = 0;
  currentAddress: any;
  workRecords: any = [];
  currentWorkRecord: any;
  dailyWorkedHours: number = 0;
  monthlyWorkedHours: number = 0;
  currentDate: any;
  lastRegister: string = '  00:00:00 - _/_/_';
  hoursWorkedToday: string = '00:00';
  hoursWorkedMonthly: string = '00:00';

  currentUser: CurrentUser | null = null;
  users: any = [];
  filteredUsers: any = [];
  userSearchQuery: string = '';
  cpf: string = '';
  constructor(
    private geocodingService: GeocodingService,
    private worldTimeService: WorldTimeService,
    public dialog: MatDialog
  ) {}

  @ViewChild('webcamRef') webcamComponent!: WebcamComponent;

  async ngOnInit() {
    await this.getDateTime();
    await this.geCurrentUser();
    await this.getUsers();
    await this.getAllWorkRecords();
    await this.setHoursWorked();
    this.lastRegister =
      format(this.workRecords[this.workRecords.length - 1].datetime, 'HH:mm') +
      ' - ' +
      format(
        this.workRecords[this.workRecords.length - 1].datetime,
        'dd/MM/yyyy'
      );
    loadFluigCalendar(['#dateStart', '#dateEnd']);
  }

  onOpenModalFacialRecognition() {
    const dialogRef = this.dialog.open(WebcamComponent, {});

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);

      if (result) {
        this.recordWorkTime();
      } else {
        this.onOpenModalRegister();
      }
    });
  }

  onOpenModalRegister() {
    const dialogRef = this.dialog.open(DialogRegisterComponent, {
      data: {
        currentUser: this.currentUser,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);

      if (result) {
        this.cpf = result;
        this.recordWorkTime();
      } else {
        this.openSnackBar('Não foi registrado!', 'Tchau');
      }

      
    });
  }

  
  async recordWorkTime() {
    // Obtém a localização do usuário
    await this.getCurrentLocation();
    await this.getAddress();
    await this.getDateTime();

    const isAtWork = this.verifyAddress();

    await this.postWorkRecord();
    this.setHoursWorked();

    if (!isAtWork) {
      // Exibe o endereço no alerta
      Swal.fire({
        icon: 'warning',
        title:
          'Você está fora do seu local habitual de trabalho. Seu registro foi encaminhado para aprovação do RH.',
        html: `Localização atual: ${this.currentAddress}`,
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: `Ponto registrado! (${this.currentWorkRecord.cardId})`,
        html: `Localização atual: ${this.currentAddress}`,
      });
    }
  }

  async putWorkRecord(documentId: number, data: any) {
    await this.getDateTime();
    const now = this.currentDate.datetime;

    this.lastRegister =
      format(now, 'HH:mm') + ' - ' + format(now, 'dd/MM/yyyy');

    this.formularioService
      .putData(91586, documentId, data)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.currentWorkRecord = response;

          Swal.fire({
            icon: 'success',
            title: 'Ponto registrado!',
            html: `Seu ponto foi registrado (${this.currentWorkRecord.cardId})`,
          });
          this.getAllWorkRecords();
        },
      });
  }

  async postWorkRecord(observation = ''): Promise<void> {
    return new Promise(async (resolve) => {
      await this.getDateTime();
      const now = this.currentDate.datetime;

      this.lastRegister =
        format(now, 'HH:mm') + ' - ' + format(now, 'dd/MM/yyyy');

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
          fieldId: 'dia_semana',
          value: format(now, 'EEEE', { locale: ptBR }),
        },
        {
          fieldId: 'horario_registro',
          value: format(now, 'HH:mm:ss'),
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
          fieldId: 'localidade',
          value: this.currentAddress,
        },
        {
          fieldId: 'latitude',
          value: this.latitude,
        },
        {
          fieldId: 'longitude',
          value: this.longitude,
        },
        {
          fieldId: 'observacao',
          value: observation,
        },
        // {
        //   fieldId: 'tempo_segundos',
        //   value: intervalToDuration({
        //     start: '00:00',
        //     end: format(now, 'HH:mm'),
        //   }),
        // },
      ];

      this.formularioService
        .postData(91586, data)
        .pipe(first())
        .subscribe({
          next: (response) => {
            this.currentWorkRecord = response;

            this.getAllWorkRecords();
            this.openSnackBar('Cadastrado com sucesso!', 'ok');
            resolve();
          },
        });
    });
  }

  setHoursWorked() {
    // Filtra os registros de trabalho do dia atual para o usuário atual
    const todayWorkRecords = this.workRecords.filter((record: WorkRecord) => {
      return (
        record.criado_em === format(this.currentDate.datetime, 'yyyy-MM-dd') &&
        Number(record.usuario_codigo) === this.currentUser?.id
      );
    });

    const hoursWorkedToday = this.extractWorkHours(todayWorkRecords);
    console.log(hoursWorkedToday);
    const totalHoursWorkedToday = calculateTotalHours(hoursWorkedToday);
    console.log(totalHoursWorkedToday);
    this.hoursWorkedToday = this.formatHours(totalHoursWorkedToday);
    console.log(totalHoursWorkedToday);

    const hoursWorkedMonthly = this.extractWorkHours(this.workRecords);
    const totalHoursWorkedMonthly = calculateTotalHours(hoursWorkedMonthly);
    this.hoursWorkedMonthly = this.formatHours(totalHoursWorkedMonthly);
  }

  private extractWorkHours(workRecords: WorkRecord[]): string[][] {
    const hoursArray: string[][] = [];
    this.getDateTime();

    return hoursArray;
  }

  private formatHours(totalHours: {
    totalHours: number;
    remainingMinutes: number;
  }): string {
    return `${String(totalHours.totalHours).padStart(2, '0')}:${String(
      totalHours.remainingMinutes
    ).padStart(2, '0')}`;
  }

  async getAllWorkRecords(constraint: Constraint[] = []): Promise<void> {
    constraint.push(new Constraint('usuario_codigo', this.currentUser?.id));

    return new Promise((resolve) => {
      this.formularioService
        .getData('pontoRegistro', constraint)
        .pipe(first())
        .subscribe({
          next: (response) => {
            if (response.length) {
              this.workRecords = response;
              resolve();
            }
          },

          error: (ex) => {
            Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
          },
        });
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

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 5000,
    });
  }

  getCurrentLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            console.log(position);

            resolve(); // Resolve a Promise quando a localização for obtida
          },
          (error) => {
            console.error('Erro ao obter localização: ', error);
            reject(error); // Rejeita a Promise em caso de erro
          }
        );
      } else {
        console.error('Geolocalização não é suportada pelo seu navegador.');
        reject('Geolocalização não é suportada pelo navegador.');
      }
    });
  }

  getAddress(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.geocodingService.getAddress(this.latitude, this.longitude).subscribe(
        (response) => {
          if (response.status === 'OK' && response.results.length > 0) {
            this.currentAddress = response.results[0].formatted_address;
            resolve(); // Resolve a Promise quando o endereço for obtido
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Erro ao obter o endereço',
              html: 'Não foi possível obter o endereço a partir da sua localização.',
            });
            console.error('Erro na API de geocodificação:', response.status);
            reject('Erro na API de geocodificação');
          }
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Erro ao obter localização',
            html: 'Não foi possível acessar o serviço de geocodificação.',
          });
          console.error('Erro ao acessar a API:', error);
          reject(error);
        }
      );
    });
  }

  getUsers() {
    let constraint: Constraint[] = [];
    constraint.push(new Constraint('active', true));

    this.formularioService
      .getData('colleague', constraint)
      .pipe(first())
      .subscribe({
        next: (response) => {
          if (response.length) {
            this.users = response;
            this.filteredUsers = this.users;
          }
        },
        error: (ex) => {
          Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
        },
      });
  }

  geCurrentUser(): Promise<void> {
    return new Promise((resolve) => {
      this.currentUserService
        .getCurrentUser()
        .pipe(first())
        .subscribe({
          next: (response) => {
            this.currentUser = response;
            resolve();
          },
          error: (ex) => {
            Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
          },
        });
    });
  }

  filterUsers() {
    this.filteredUsers = this.users.filter((user: any) =>
      user.colleagueName
        .toLowerCase()
        .includes(this.userSearchQuery.toLowerCase())
    );
  }

  verifyAddress(): boolean {
    const distance = distanceCalculate(
      this.latitude,
      this.longitude,
      -15.796429361669256,
      -47.88541332224672
    );

    console.log('distance: ' + distance);

    if (distance > 1) {
      return false;
    }

    return true;
  }
}
