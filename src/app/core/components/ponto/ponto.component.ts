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

  async recordWorkTime() {
    // Obtém a localização do usuário
    await this.getCurrentLocation();
    await this.getAddress();

    const distance = distanceCalculate(
      this.latitude,
      this.longitude,
      -15.7915298,
      -47.8921573
    );

    if (distance > 1) {
      // Exibe o endereço no alerta
      Swal.fire({
        icon: 'warning',
        title:
          'Você está fora do seu local habitual de trabalho. Seu registro será encaminhado para aprovação do RH.',
        html: `Localização atual: ${this.currentAddress}`,
      });
    } else {
      // Registro de ponto
      this.postWorkRecord();
      this.putWorkRecord();
    }
  }

  putWorkRecord() {}

  async postWorkRecord() {
    this.isWorking = !this.isWorking;

    //Verificar se existe horário já registrado naquele dia

    //Verificar qual o horário

    await this.getDateTime();
    const now = this.currentDate.datetime;
    this.workRecords.push({
      id: FLUIGC?.utilities.randomUUID(),
      created_at: now,
      user: this.currentUser?.fullName,
      diaDaSemana: format(now, 'EEEE', { locale: ptBR }),
      entrada: format(now, 'HH:mm'),
      entradaAlmoco: format(now, 'HH:mm'),
      saidaAlmoco: format(now, 'HH:mm'),
      saida: format(now, 'HH:mm'),
      saldoHoras: '+ 01:00',
      status: '',
      idUser: this.currentUser?.tenantId,
    });

    this.lastRegister =
      format(now, 'HH:mm') + ' - ' + format(now, 'dd/MM/yyyy');
    this.localStorageService.set('workRecords', this.workRecords);

    Swal.fire({
      icon: 'success',
      title: 'Ponto registrado!',
      html: `Localização atual: ${this.currentAddress}`,
    });

    let data = {
      fieldId: 'criado_em',
      value: now,
    };

    this.formularioService
      .postData(91586, data)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log(response);
        },
      });
  }

  getDateTime(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldTimeService.getDateTime().subscribe(
        (response) => {
          this.currentDate = response;
          console.log(this.currentDate);
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
            console.log(
              `Latitude: ${this.latitude}, Longitude: ${this.longitude}`
            );
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

  getDistanceLocation(lat: number, lng: number) {
    const origins = [{ lat: lat, lng: lng }];
    const destinations = [{ lat: -15.7915298, lng: -47.8921573 }];

    this.geocodingService.getDistanceMatrix(origins, destinations).subscribe(
      (response) => {
        console.log('Distâncias:', response);
      },
      (error) => {
        console.error('Erro ao obter distâncias:', error);
      }
    );
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
          console.log(this.currentUser);
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

    console.log(this.filteredUsers);
  }
}
