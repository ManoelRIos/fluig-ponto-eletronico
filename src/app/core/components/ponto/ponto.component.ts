import { WebcamComponent } from './dialog-component/webcam/webcam.component'
import { WorldTimeService } from './../../services/world-time.service'
import { NgClass, NgFor, NgIf } from '@angular/common'
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core'
import Swal from 'sweetalert2'
import { GeocodingService } from '../../services/google/geocoding.service'
import { Constraint } from '../../models/constraint.model'
import { FormularioService } from '../../services/fluig/formulario.service'
import { CurrentUserService } from '../../services/fluig/currentUser.service'
import { first } from 'rxjs'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { FormsModule } from '@angular/forms'
import { CurrentUser } from '../../interfaces'
import loadFluigCalendar from '../../utils/loadFluigCalendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calculateTotalHours, distanceCalculate, getStatusWorkRecord, getWorkRecordClasses } from '../../utils/utils'

import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { environment } from '../../../../environments/environment'

import { MatButtonModule } from '@angular/material/button'
import { MatSelectModule } from '@angular/material/select'
import { MatMenuModule } from '@angular/material/menu'

import { MatFormFieldModule } from '@angular/material/form-field'
import { DialogRegisterComponent } from './dialog-component/dialog-register/dialog-register.component'
import { GedService } from '../../services/fluig/ged.service'
import { ViewPontoComponent } from './dialog-component/view-ponto/view-ponto.component'
import { WorkRecord, WorkStatus } from '../../models/WorkRecord'

import { NgIconComponent, provideIcons } from '@ng-icons/core'
import { heroUsers } from '@ng-icons/heroicons/outline'
import { DataValues } from '../../interfaces/data-values.interface'

import { ConfigurationWorkRecord } from '../../models/ConfigurationWorkRecord'
import { User } from '../../models/User'
import { RouterLink } from '@angular/router'
import { Role } from '../../models/Role'

@Component({
   selector: 'app-ponto',
   standalone: true,
   imports: [
      MatAutocompleteModule,
      MatMenuModule,
      MatFormFieldModule,
      MatSelectModule,
      MatButtonModule,
      FormsModule,
      WebcamComponent,
      MatDialogModule,
      NgClass,
      NgIconComponent,
      NgIf,
      RouterLink,
   ],
   templateUrl: './ponto.component.html',
   styleUrl: './ponto.component.scss',
   viewProviders: [provideIcons({ heroUsers })],
})
export class PontoComponent implements OnInit {
   private formularioService = inject(FormularioService)
   private currentUserService = inject(CurrentUserService)
   private _snackBar = inject(MatSnackBar)
   private gedService = inject(GedService)
   public environment = environment
   public format = format
   public utils = { getStatusWorkRecord: getStatusWorkRecord, getWorkRecordClasses: getWorkRecordClasses }

   profile!: Role
   userIdSearchQuery: any
   observation: string = ''
   latitude: number = 0
   longitude: number = 0
   status: string = 'active'
   folder: any
   photo: any
   currentAddress: any
   workRecords: WorkRecord[] = []
   filteredWorkRecords: WorkRecord[] = []
   currentWorkRecord!: WorkRecord
   currentDate: any
   lastRegister: string = '  00:00:00 - _/_/_'
   hoursWorkedToday: string = '00:00'
   hoursWorkedMonthly: string = '00:00'
   configurations: ConfigurationWorkRecord | null = null
   currentUser!: CurrentUser
   users: User[] = []
   filteredUsers: User[] = []
   searchQuery: string = ''
   cpf: string = ''
   hoursWorkedBalance = ''

   constructor(
      private geocodingService: GeocodingService,
      private worldTimeService: WorldTimeService,
      public dialog: MatDialog,
   ) {}

   @ViewChild('printSection') printSection!: ElementRef
   @ViewChild('webcamRef') webcamComponent!: WebcamComponent

   async ngOnInit() {
      await this.getDateTime()
       this.hoursWorkedBalance = await this.getHoursWorkedBalance()
   
      console.log(this.hoursWorkedBalance)

      if (!this.currentUserService.currentUser) {
         await this.getCurrentUser()
      }

      this.currentUser = this.currentUserService.currentUser

      this.currentUser = this.currentUserService.currentUser
      await this.getProfile([new Constraint('codigo_usuario', this.currentUser?.id)])
      if (this.profile?.view_all === 'true') await this.getEmployees()

      this.configurations = await this.getConfigurations([new Constraint('usuario_codigo', this.currentUser?.id)])
      loadFluigCalendar(['#dateStart', '#dateEnd'])

      if (!this.configurations) {
         let folderData = {
            parentFolderId: this.environment.codConfigPonto,
            documentDescription: this.currentUser?.fullName,
            versionDescription: 'VersionDescription',
            expires: 'false',
            publisherId: this.currentUser?.code,
            volumeId: 'Default',
            inheritSecurity: 'true',
            downloadEnabled: 'true',
            updateIsoProperties: 'false',
            documentTypeId: '1',
            internalVisualizer: 'true',
         }

         await this.postFolder(folderData)
         await this.postConfigurations()
      }

      await this.getAllWorkRecords()
      // this.setHoursWorked()
   }

   async getHoursWorkedBalance(constraint: Constraint[] = []) {
      const result = await this.formularioService
         .getData('dsp_getBancoHoras', constraint)
         .pipe(first())
         .toPromise()  

         if(result){                        
            let minutes = Number(result[0]?.total) * 60  
            console.log(minutes)    
            return `${Math.floor(result[0]?.total)}:${Math.floor((result[0]?.total % 1) * 60)}`
         }
         return '00:00'
   }

   async getProfile(constraint: Constraint[] = []): Promise<any> {
      try {
         const vinculoPerfil = await this.formularioService
            .getData('vinculoPerfilPonto', constraint)
            .pipe(first())
            .toPromise()

         if (vinculoPerfil && vinculoPerfil.length > 0) {
            const perfilPonto = await this.formularioService
               .getData(this.environment.formPerfilPonto, [
                  new Constraint('documentid', vinculoPerfil[0]?.codigo_perfil),
               ])
               .pipe(first())
               .toPromise()

            if (perfilPonto && perfilPonto.length > 0) {
               perfilPonto[0].idVinculo = vinculoPerfil[0].documentid
               this.profile = await perfilPonto[0]
               this.currentUserService.profile = this.profile
            } else {
               console.error('perfilPonto is empty or null')
               return null
            }
         } else {
            console.error('vinculoPerfil is empty or null')
            return null
         }
      } catch (error) {
         console.error('Error fetching profile:', error)
         return null
      }
   }

   async postFolder(folderData: any): Promise<void> {
      return new Promise(async (resolve) => {
         this.gedService.postFolder(folderData).subscribe(
            (response: any) => {
               this.folder = response
               resolve()
            },
            (error) => console.error('Erro ao cadastrar pasta:', error),
         )
      })
   }

   onOpenModalFacialRecognition() {
      const facialRecognitionDialog = this.dialog.open(WebcamComponent, {
         data: {
            currentUser: this.currentUser,
            configurations: this.configurations,
         },
      })

      facialRecognitionDialog.afterClosed().subscribe((result) => {
         console.log(result)

         if (result) {
            this.recordWorkTime()
         } else {
            this.onOpenModalRegister()
         }
      })
   }

   async onOpenModalViewWorkRecord(documentId: number) {
      this.currentWorkRecord = this.workRecords.filter((elem: any) => elem.documentid === documentId)[0]
      const configTargetUser: ConfigurationWorkRecord | null = await this.getConfigurations([
         new Constraint('usuario_codigo', this.currentWorkRecord?.usuario_codigo),
      ])

      console.log(this.currentWorkRecord)
      const viewWorkRecordDialog = this.dialog.open(ViewPontoComponent, {
         data: {
            workRecord: this.currentWorkRecord,
            profile: this.profile,
         },
      })

      viewWorkRecordDialog.afterClosed().subscribe((result) => {
         console.log(result)
         if (result) {
            console.log(result)
            if (result === 'approved') {
               this.putWorkRecord(this.currentWorkRecord?.documentid, [{ fieldId: 'status', value: 'approved' }])
               this.putConfigurations(configTargetUser!.documentid, [
                  { fieldId: 'codigo_foto', value: this.currentWorkRecord?.foto_codigo },
               ])
               return
            }
            if (result === 'refused') {
               // Your logic to update work record with refused status
               this.putWorkRecord(this.currentWorkRecord?.documentid, [{ fieldId: 'status', value: 'refused' }]) // Replace with your actual update logic
               return
            }
         }
      })
   }

   onOpenModalRegister() {
      const dialogRef = this.dialog.open(DialogRegisterComponent, {
         data: {
            currentUser: this.currentUser,
            configurations: this.configurations,
         },
      })

      this.status = 'pending'
      this.observation = 'O rosto não foi identificado pelo reconhecimento facial!'

      dialogRef.afterClosed().subscribe((result) => {
         if (result.configurations) {
            this.cpf = result.cpf
            this.photo = result.photo
            this.configurations = result.configurations
            this.recordWorkTime()
         } else {
            this.openSnackBar('Não foi registrado!', 'Tchau')
         }
      })
   }

   getCurrentUser(): Promise<void> {
      return new Promise((resolve, reject) => {
         this.currentUserService
            .getCurrentUser()
            .pipe(first())
            .subscribe({
               next: (response) => {
                  this.currentUserService.currentUser = response
                  resolve()
               },
               error: (ex) => {
                  Swal.fire({ icon: 'error', title: 'Oops...', html: ex })
                  reject()
               },
            })
      })
   }

   async recordWorkTime() {
      // Obtém a localização do usuário
      await this.getCurrentLocation()
      await this.getAddress()
      await this.getDateTime()

      const isAtWork = this.verifyAddress()
      if (!isAtWork) {
         this.status = 'pending'
         this.observation = 'Não estava no local habitual no momento do registro!'
      }

      await this.postWorkRecord()
      this.setHoursWorked()

      if (!isAtWork) {
         // Exibe o endereço no alerta
         Swal.fire({
            icon: 'warning',
            title: 'Você está fora do seu local habitual de trabalho. Seu registro foi encaminhado para aprovação do RH.',
            html: `Localização atual: ${this.currentAddress}`,
         })
      } else {
         Swal.fire({
            icon: 'success',
            title: `Ponto registrado! (${this.currentWorkRecord?.cardId})`,
            html: `Localização atual: ${this.currentAddress}`,
         })
      }
   }

   async putWorkRecord(documentId: number, data: DataValues[]) {
      this.formularioService
         .putData(this.environment.codRegistroPonto, documentId, data)
         .pipe(first())
         .subscribe({
            next: (response) => {
               this.currentWorkRecord = response
               this.getAllWorkRecords()
            },
         })
   }

   async postWorkRecord(): Promise<void> {
      return new Promise(async (resolve) => {
         await this.getDateTime()
         const now = this.currentDate.datetime

         this.lastRegister = format(now, 'HH:mm') + ' - ' + format(now, 'dd/MM/yyyy')

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
               value: this.status,
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
               value: this.observation,
            },
            {
               fieldId: 'foto_codigo',
               value: this.photo?.content?.id,
            },
            // {
            //   fieldId: 'tempo_segundos',
            //   value: intervalToDuration({
            //     start: '00:00',
            //     end: format(now, 'HH:mm'),
            //   }),
            // },
         ]

         this.formularioService
            .postData(this.environment.codRegistroPonto, data)
            .pipe(first())
            .subscribe({
               next: async (response) => {
                  this.currentWorkRecord = response

                  this.getAllWorkRecords()
                  this.openSnackBar('Cadastrado com sucesso!', 'ok')
                  resolve()
               },
            })
      })
   }

   async getAllWorkRecords(constraint: Constraint[] = []): Promise<void> {
      if (this.profile?.view_all === 'false' && this.profile?.view_manager === 'false'){
        constraint.push(new Constraint('usuario_codigo', this.currentUser?.id))
      }

      return new Promise((resolve) => {
         this.formularioService
            .getData(this.environment.formRegistroPonto, constraint)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  if (response.length) {
                     this.workRecords = response
                     this.filteredWorkRecords = this.workRecords
                     resolve()
                  }
               },

               error: (ex) => {
                  Swal.fire({ icon: 'error', title: 'Oops...', html: ex })
               },
            })
         resolve()
      })
   }

   getDateTime(): Promise<void> {
      return new Promise((resolve, reject) => {
         this.formularioService.getData('getDateFromServer', [new Constraint()]).subscribe(
            (response) => {
               console.log('date')
               if (response) {
                  this.currentDate = { datetime: new Date(response[0].date).toISOString() }
               }
               resolve()
            },
            (error) => {
               Swal.fire(
                  'Oops!',
                  'Não conseguimos identificar a hora, por favor entre em contato com a administração!',
                  'warning',
               )
            },
         )
      })
   }

   getCurrentLocation(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
               (position) => {
                  this.latitude = position.coords.latitude
                  this.longitude = position.coords.longitude
                  console.log(position)

                  resolve() // Resolve a Promise quando a localização for obtida
               },
               (error) => {
                  console.error('Erro ao obter localização: ', error)
                  reject(error) // Rejeita a Promise em caso de erro
               },
            )
         } else {
            console.error('Geolocalização não é suportada pelo seu navegador.')
            reject('Geolocalização não é suportada pelo navegador.')
         }
      })
   }

   async getConfigurations(constraints: Constraint[]): Promise<ConfigurationWorkRecord | null> {
      return new Promise((resolve, reject) => {
         this.formularioService
            .getData('configRegistroPonto', constraints)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  if (response.length) {
                     resolve(response[0])
                  } else {
                     resolve(null)
                  }
               },
               error: (ex) => {
                  Swal.fire({ icon: 'error', title: 'Oops...', html: ex })
                  reject()
               },
            })
      })
   }

   async postConfigurations(): Promise<void> {
      const now = this.currentDate.datetime
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
               value: '',
            },
            {
               fieldId: 'codigo_pasta',
               value: this.folder?.content?.documentId,
            },
         ]

         this.formularioService
            .postData(this.environment.codConfigPonto, data)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  console.log(response)
                  this.configurations = response
                  resolve()
               },
            })
      })
   }

   async putConfigurations(documentId: number, data: DataValues[]) {
      this.formularioService
         .putData(this.environment.codConfigPonto, documentId, data)
         .pipe(first())
         .subscribe({
            next: (response) => {
               this.currentWorkRecord = response
               this.getAllWorkRecords()
            },
         })
   }

   getAddress(): Promise<void> {
      return new Promise((resolve, reject) => {
         this.geocodingService.getAddress(this.latitude, this.longitude).subscribe(
            (response) => {
               if (response.status === 'OK' && response.results.length > 0) {
                  this.currentAddress = response.results[0].formatted_address
                  resolve() // Resolve a Promise quando o endereço for obtido
               } else {
                  Swal.fire({
                     icon: 'error',
                     title: 'Erro ao obter o endereço',
                     html: 'Não foi possível obter o endereço a partir da sua localização.',
                  })
                  console.error('Erro na API de geocodificação:', response.status)
                  reject('Erro na API de geocodificação')
               }
            },
            (error) => {
               Swal.fire({
                  icon: 'error',
                  title: 'Erro ao obter localização',
                  html: 'Não foi possível acessar o serviço de geocodificação.',
               })
               console.error('Erro ao acessar a API:', error)
               reject(error)
            },
         )
      })
   }

   async getEmployees(): Promise<void> {
      return new Promise(async (resolve) => {
         let constraint: Constraint[] = []
         constraint.push(new Constraint('active', true))
         this.formularioService
            .getData('colleague', constraint)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  if (response.length) {
                     this.users = response
                     this.filteredUsers = this.users
                  }
                  resolve()
               },
               error: (ex) => {
                  Swal.fire({ icon: 'error', title: 'Oops...', html: ex })
                  resolve()
               },
            })
      })
   }

   filterSearch() {
      this.filteredUsers = this.users.filter((user: any) =>
         user.colleagueName.toLowerCase().includes(this.searchQuery.toLowerCase()),
      )
      this.filteredWorkRecords = this.workRecords.filter(
         (workRecord: WorkRecord) =>
            workRecord.usuario_nome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            workRecord.dia_semana.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            getStatusWorkRecord(workRecord.status).toLowerCase().includes(this.searchQuery.toLowerCase()),
      )
   }

   verifyAddress(): boolean {
      const distance = distanceCalculate(this.latitude, this.longitude, -15.796429361669256, -47.88541332224672)

      console.log('distance: ' + distance)

      if (distance > 1) {
         return false
      }

      return true
   }

   generateReceipt(work: WorkRecord) {
      let printScreen: any = window.open(
         'Comprovante de registro de ponto',
         '_blank',
         'width=800,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes',
      )

      printScreen.document.write(`
    <style>
      body{display: flex; justify-content: center; align-items: center}  p,h3,h2 {margin: 0;  font-family: Verdana;}
      .card {width: 400px; display: flex; flex-direction: column; items-center; gap: 8px;border-radius: 9px;padding: 16px 32px; box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;}
    </style>
      <div class='card'>
        <h2>COMPROVANTE DE REGISTRO DE PONTO</h2>        
        <h3>${work.documentid} - ${work.usuario_nome.toUpperCase()}</h3>    
        <p>RSOCIAL: FEDERAÇÃO NACIONAL DAS APAES</p>
        <p>DATA: ${format(work.datetime, 'dd/MM/yyyy')} HORA: ${format(work.datetime, 'hh:mm')}</p>
        <p>LOCAL: ${work.localidade.toUpperCase()}</p>        
        <p>OBS: ${work.observacao.toUpperCase()}</p>
        <p>STATUS: ${getStatusWorkRecord(work.status).toUpperCase()}</p>
      </div>`)

      printScreen.window.print()
      printScreen.window.close()
   }
   async setHoursWorked() {
      // Filtra os registros de trabalho do dia atual para o usuário atual
      const todayWorkRecords = this.workRecords.filter((record: WorkRecord) => {
         return (
            record.criado_em === format(this.currentDate.datetime, 'yyyy-MM-dd') &&
            Number(record.usuario_codigo) === this.currentUser?.id
         )
      })

      const hoursWorkedToday = this.extractWorkHours(todayWorkRecords)
      console.log(hoursWorkedToday)
      const totalHoursWorkedToday = calculateTotalHours(await hoursWorkedToday)
      console.log(totalHoursWorkedToday)
      this.hoursWorkedToday = this.formatHours(totalHoursWorkedToday)
      console.log(totalHoursWorkedToday)

      const hoursWorkedMonthly = this.extractWorkHours(this.workRecords)
      const totalHoursWorkedMonthly = calculateTotalHours(await hoursWorkedMonthly)
      this.hoursWorkedMonthly = this.formatHours(totalHoursWorkedMonthly)
   }

   private async extractWorkHours(workRecords: WorkRecord[]): Promise<string[][]> {
      const hoursArray: string[][] = []
      this.currentDate = await this.getDateTime()
      return hoursArray
   }

   private formatHours(totalHours: { totalHours: number; remainingMinutes: number }): string {
      return `${String(totalHours.totalHours).padStart(2, '0')}:${String(totalHours.remainingMinutes).padStart(2, '0')}`
   }

   openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
         horizontalPosition: 'end',
         verticalPosition: 'top',
         duration: 5000,
      })
   }
}
