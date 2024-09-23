import { WorldTimeService } from './../../services/world-time.service';
import { NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { LocalStorageService } from '../../services/local-storage.service';
import { GeocodingService } from '../../services/google/geocoding.service';
import { Constraint } from '../../models/constraint.model';
import { FormularioService } from '../../services/fluig/formulario.service';
import { CurrentUserService } from '../../services/fluig/currentUser.service';
import { first } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { CurrentUser } from '../../interfaces';
import loadFluigCalendar from '../../utils/loadFluigCalendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { distanceCalculate } from '../../utils/utils';
import { Value, Values, WorkRecord } from '../../interfaces/work-record';

declare const FLUIGC: any;

@Component({
  selector: 'app-ponto',
  standalone: true,
  imports: [NgFor, MatAutocompleteModule, FormsModule],
  templateUrl: './ponto.component.html',
  styleUrl: './ponto.component.scss',
})
export class PontoComponent {
  private formularioService = inject(FormularioService);
  private currentUserService = inject(CurrentUserService);

  latitude: number = 0;
  longitude: number = 0;
  isWorking: boolean = false;
  currentAddress: any;
  workRecords: any = [];
  currentWorkRecord: any;
  dailyWorkedHours: number = 0;
  monthlyWorkedHours: number = 0;
  currentDate: any;
  lastRegister: string = '  00:00:00 - _/_/_';

  currentUser: CurrentUser | null = null;
  users: any = [];
  filteredUsers: any = [];
  userSearchQuery: string = '';

  constructor(
    private geocodingService: GeocodingService,
    private localStorageService: LocalStorageService,
    private worldTimeService: WorldTimeService
  ) {}

  ngOnInit(): void {
    this.geCurrentUser();
    this.getUsers();
    this.getAllWorkRecords();
    this.setWorkRecords();
    loadFluigCalendar(['#dateStart', '#dateEnd']);
  }

  setWorkRecords() {
    if (this.localStorageService.get('workRecords')) {
      this.workRecords = this.localStorageService.get('workRecords');
      this.lastRegister =
        this.workRecords[this.workRecords.length - 1].entrada +
        ' - ' +
        this.workRecords[this.workRecords.length - 1].data;
    }
  }

  calculateTotalWorkHours(){
    
  }

  async recordWorkTime() {
    // Obtém a localização do usuário
    await this.getCurrentLocation();
    await this.getAddress();
    await this.getDateTime();

    const isAtWork = this.verifyAddress();

    if (!isAtWork) {
      // Exibe o endereço no alerta
      Swal.fire({
        icon: 'warning',
        title:
          'Você está fora do seu local habitual de trabalho. Seu registro será encaminhado para aprovação do RH.',
        html: `Localização atual: ${this.currentAddress}`,
      });
    }

    // verificar se já registrou o ponto
    let constraints = [
      new Constraint('usuario_codigo', this.currentUser?.tenantId),
      new Constraint(
        'criado_em',
        format(this.currentDate.datetime, 'yyyy-MM-dd')
      ),
    ];
    const workRecord: any = await this.getWorkRecord(constraints);

    if (workRecord.length) {
      let fieldId = 'hora_almoco';
      let value = format(this.currentDate.datetime, 'HH:mm');
      console.log(workRecord[0]);
      if (workRecord[0].hora_almoco) {
        fieldId = 'hora_saida_almoco';
      }
      if (workRecord[0].hora_saida_almoco) {
        fieldId = 'hora_saida';
      }

      let data = [
        {
          fieldId: fieldId,
          value: value,
        },
      ];
      this.putWorkRecord(workRecord[0].documentid, data);
    }
    // Registro de ponto]
    else {
      this.postWorkRecord();
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
          console.log(response);

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

  async postWorkRecord() {
    this.isWorking = !this.isWorking;

    //Verificar se existe horário já registrado naquele dia

    //Verificar qual o horário

    await this.getDateTime();
    const now = this.currentDate.datetime;

    this.lastRegister =
      format(now, 'HH:mm') + ' - ' + format(now, 'dd/MM/yyyy');

    let data = [
      {
        fieldId: 'criado_em',
        value: format(now, 'yyyy-MM-dd'),
      },
      {
        fieldId: 'dia_semana',
        value: format(now, 'EEEE', { locale: ptBR }),
      },
      {
        fieldId: 'hora_entrada',
        value: format(now, 'HH:mm'),
      },
      {
        fieldId: 'usuario_nome',
        value: this.currentUser?.fullName,
      },
      {
        fieldId: 'usuario_codigo',
        value: this.currentUser?.tenantId,
      },
    ];

    this.formularioService
      .postData(91586, data)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log(response);

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

  getWorkRecord(constraint: Constraint[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.formularioService
        .getData('pontoRegistro', constraint)
        .pipe(first())
        .subscribe({
          next: (response) => {
            resolve(response);
          },
          error: (ex) => {
            Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
          },
        });
    });
  }

  getAllWorkRecords(constraint: Constraint[] = []) {
    this.formularioService
      .getData('pontoRegistro', constraint)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log(response);
          if (response.length) {
            this.workRecords = response;
          }
        },
        error: (ex) => {
          Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
        },
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

  getCurrentLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;

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
          console.log(response);
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

  geCurrentUser() {
    this.currentUserService
      .getCurrentUser()
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.currentUser = response;
        },
        error: (ex) => {
          Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
        },
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
      -16.0814528,
      -47.9789237
    );

    if (distance > 1) {
      return false;
    }

    return true;
  }
}
