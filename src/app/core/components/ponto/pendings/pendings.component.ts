import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { environment } from '../../../../../environments/environment'
import { first } from 'rxjs'
import { Constraint } from '../../../models/constraint.model'
import { FormularioService } from '../../../services/fluig/formulario.service'
import { NgClass } from '@angular/common'
import { WorkRecord } from '../../../models/WorkRecord'
import { format } from 'date-fns'
import { formatToBrDate, getStatusWorkRecord, getWorkRecordClasses } from '../../../utils/utils'
import { CurrentUserService } from '../../../services/fluig/currentUser.service'
import { ConfigurationWorkRecord } from '../../../models/ConfigurationWorkRecord'
import { CurrentUser } from '../../../interfaces'
import { ptBR } from 'date-fns/locale'
import { MatSnackBar } from '@angular/material/snack-bar'
import { FormsModule } from '@angular/forms'

@Component({
   selector: 'app-pendings',
   standalone: true,
   imports: [RouterLink, NgClass, FormsModule],
   templateUrl: './pendings.component.html',
   styleUrl: './pendings.component.scss',
})
export class PendingsComponent {
   private formularioService = inject(FormularioService)
   private currentUserService = inject(CurrentUserService)
   public environment = environment
   public format = format
   public utils = {
      getStatusWorkRecord: getStatusWorkRecord,
      getWorkRecordClasses: getWorkRecordClasses,
      formatToBrDate: formatToBrDate,
   }

   private _snackBar = inject(MatSnackBar)
   itemSelected: any
   datetime = { date: '', time: '' }
   motivation = ''
   currentUser: CurrentUser = this.currentUserService.currentUser
   pendingWorkRegister: any = []
   modalAddRegisterIsOpen = false
   configurations: ConfigurationWorkRecord | null = null
   workRecords: WorkRecord[] = []

   async ngOnInit(): Promise<void> {
      if (!this.currentUser) {
         await this.getCurrentUser()
         this.currentUser = this.currentUserService.currentUser
      }
      await this.getPendingsWorkRegister()

      this.configurations = await this.getConfigurations([new Constraint('usuario_codigo', this.currentUser?.id)])
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
            })
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
            })
      })
   }

   async getPendingsWorkRegister(constraint: Constraint[] = []) {
      const result = await this.formularioService
         .getData('dsp_getPendenciasPonto', constraint)
         .pipe(first())
         .toPromise()

      this.pendingWorkRegister = result
   }

   async getAllWorkRecords(constraint: Constraint[] = []): Promise<void> {
      constraint.push(new Constraint('usuario_codigo', this.currentUser?.id))

      return new Promise((resolve) => {
         this.formularioService
            .getData(this.environment.formRegistroPonto, constraint)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  if (response.length) {
                     this.workRecords = response
                     resolve()
                  }
               },
            })
         resolve()
      })
   }

   async postWorkRecord(): Promise<void> {
      return new Promise(async (resolve) => {
         const date = this.datetime.date
         let data = [
            {
               fieldId: 'datetime',
               value: date,
            },
            {
               fieldId: 'criado_em',
               value: format(date, 'yyyyMMdd'),
            },
            {
               fieldId: 'dia_semana',
               value: format(date, 'EEEE', { locale: ptBR }),
            },
            {
               fieldId: 'horario_registro',
               value: format(date, 'HH:mm:ss'),
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
               value: 'pending',
            },
            // {
            //    fieldId: 'localidade',
            //    value: '',
            // },
            // {
            //    fieldId: 'latitude',
            //    value: '',
            // },
            // {
            //    fieldId: 'longitude',
            //    value: '',
            // },
            {
               fieldId: 'observacao',
               value: 'Adicionado manualmente: ' + this.motivation,
            },
            // {
            //    fieldId: 'foto_codigo',
            //    value: this.photo?.content?.id,
            // },
         ]

         this.formularioService
            .postData(this.environment.codRegistroPonto, data)
            .pipe(first())
            .subscribe({
               next: async (response) => {
                  let constraint = [new Constraint('criado_em', this.itemSelected.data)]
                  this.getAllWorkRecords(constraint)
                  this.openSnackBar('Cadastrado com sucesso!', 'ok')
                  resolve()
               },
            })
      })
   }

   async openModalAddRegister(item: any) {
      this.itemSelected = item
      this.modalAddRegisterIsOpen = true
      let constraint = [new Constraint('criado_em', item.data)]
      await this.getAllWorkRecords(constraint)
   }

   closeModalAddRegister() {
      this.modalAddRegisterIsOpen = false
   }

   openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
         horizontalPosition: 'end',
         verticalPosition: 'top',
         duration: 5000,
      })
   }
}
