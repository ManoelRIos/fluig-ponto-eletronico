import { CurrentUser } from './../../interfaces/current-user.interface'
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { FormularioService } from '../../services/fluig/formulario.service'
import { Constraint } from '../../models/constraint.model'
import { first } from 'rxjs'
import { User } from '../../models/User'
import { environment } from '../../../../environments/environment'
import { FormsModule } from '@angular/forms'
import { GedService } from '../../services/fluig/ged.service'
import { ConfigurationWorkRecord } from '../../models/ConfigurationWorkRecord'
import { Role } from '../../models/Role'
import { CurrentUserService } from '../../services/fluig/currentUser.service'
import Swal from 'sweetalert2'
import { DataValues } from '../../interfaces/data-values.interface'
import { MatSnackBar } from '@angular/material/snack-bar'
import { format } from 'date-fns'

@Component({
   selector: 'app-admin',
   standalone: true,
   imports: [RouterLink, FormsModule],
   templateUrl: './admin.component.html',
   styleUrl: './admin.component.scss',
})
export class AdminComponent {
   private currentUserService = inject(CurrentUserService)
   private formularioService = inject(FormularioService)
   public environment = environment
   private gedService = inject(GedService)
   private _snackBar = inject(MatSnackBar)

   users: User[] = []
   newRole: string = ''
   userSelected!: User | null
   filteredUsers: User[] = []
   isAddingNewRole: boolean = false
   currentPage = 0
   countUsers = 10
   currentUser!: CurrentUser
   profile!: Role
   searchQuery = ''
   routerActive = 'users'
   urlFoto = ''
   configurationsSelected!: ConfigurationWorkRecord | null
   configurations!: ConfigurationWorkRecord | null
   roles: Role[] = []
   profileUserSelected!: Role | null

   async ngOnInit() {
      if (!this.currentUserService.currentUser) {
         await this.getCurrentUser()
      }

      this.currentUser = this.currentUserService.currentUser

      this.profile = this.currentUserService.profile
         ? this.currentUserService.profile
         : await this.getProfile([new Constraint('codigo_usuario', this.currentUser?.id)])
      await this.getUsers()
      await this.getRoles()
   }

   async getUsers(): Promise<void> {
      return new Promise(async (resolve) => {
         let constraint: Constraint[] = []
         constraint.push(new Constraint('active', true))

         this.formularioService
            .getData('colleague', constraint)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  console.log(response)

                  this.users = response
                  this.filteredUsers = this.users
                  resolve()
               },
            })
      })
   }

   async getRoles(): Promise<void> {
      return new Promise(async (resolve) => {
         let constraint: Constraint[] = []

         this.formularioService
            .getData(this.environment.formPerfilPonto, constraint)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  console.log(response)
                  this.roles = response
                  resolve()
               },
            })
      })
   }

   async postFolder(folderData: any): Promise<any> {
      const folder = await this.gedService.postFolder(folderData).pipe(first()).toPromise()
      return folder
   }

   async postLinkProfile(data: DataValues[]): Promise<any> {
      const linkProfile = await this.formularioService
         .postData(this.environment.codVinculoPerfilPonto, data)
         .pipe(first())
         .toPromise()
      return linkProfile
   }

   async postConfigurations(data: DataValues[]): Promise<void> {
      return new Promise(async (resolve) => {
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

   async postRole(data: DataValues[]): Promise<void> {
      return new Promise(async (resolve) => {
         this.formularioService
            .postData(this.environment.codPerfilPonto, data)
            .pipe(first())
            .subscribe({
               next: (response) => {
                  console.log(response)
                  resolve(response)
               },
            })
      })
   }

   uploadDocument(formData: FormData): Promise<void> {
      return new Promise(async (resolve) => {
         this.gedService.uploadDocument(formData).subscribe(
            (response) => {
               resolve()
            },
            (error) => console.error('Erro ao enviar imagem:', error),
         )
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
               return perfilPonto[0]
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

   async getConfigurations(constraints: Constraint[]): Promise<any> {
      const response = await this.formularioService
         .getData('configRegistroPonto', constraints)
         .pipe(first())
         .toPromise()
      if (response) {
         return response[0]
      }
   }

   async createDocument(file: any): Promise<any> {
      const document = await this.gedService.createDocument(file).pipe(first()).toPromise()
      return document
   }

   async putConfigurations(documentId: number | any, data: DataValues[]) {
      const response = await this.formularioService
         .putData(this.environment.codConfigPonto, documentId, data)
         .pipe(first())
         .toPromise()
      return response
   }

   async putProfile(documentId: number | any, data: DataValues[]) {
      this.formularioService
         .putData(this.environment.codPerfilPonto, documentId, data)
         .pipe(first())
         .subscribe({
            next: async (response) => {},
            error: (ex) => {
               this.openSnackBar('Perfil não foi atualizado!', 'Ok')
            },
         })
   }

   async putUserProfile(documentId: number | any, data: DataValues[]) {
      this.formularioService
         .putData(this.environment.codVinculoPerfilPonto, documentId, data)
         .pipe(first())
         .subscribe({
            next: (response) => {},
            error: (ex) => {
               this.openSnackBar('Perfil não foi atualizado!', 'Ok')
            },
         })
   }

   editUserProfile(profile: number) {
      const data = [{ fieldId: 'codigo_perfil', value: profile }]
      this.putUserProfile(this.profileUserSelected?.idVinculo, data)
   }

   async editProfile(documentId: number, fieldId: string, value: string) {
      const data = [{ fieldId: fieldId, value: value }]
      await this.putProfile(documentId, data)
      let role = this.roles.find((elem) => elem.documentid === documentId)

      if (role) {
         ;(role as any)[fieldId] = value
      }
   }

   editConfigurations() {
      const data = [{ fieldId: 'matricula', value: this.configurationsSelected?.matricula }]
      this.putConfigurations(this.configurationsSelected?.documentid, data)
   }

   filterSearch() {
      this.filteredUsers = this.users.filter(
         (user: User) =>
            user.colleagueName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            user.especializationArea?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            user.mail?.toLowerCase().includes(this.searchQuery.toLowerCase()),
      )
   }

   addNewRole() {
      console.log('opa')
      this.isAddingNewRole = true
   }

   cancelAddNewRole() {
      this.isAddingNewRole = false
      this.newRole = ''
   }

   async confirmAddNewRole() {
      console.log(this.newRole)
      const data: DataValues[] = [
         {
            fieldId: 'status',
            value: 'acitve',
         },
         {
            fieldId: 'descricao',
            value: this.newRole,
         },
         {
            fieldId: 'view_default',
            value: 'false',
         },
         {
            fieldId: 'view_all',
            value: 'false',
         },
         {
            fieldId: 'view_manager',
            value: 'false',
         },
         {
            fieldId: 'criar',
            value: 'false',
         },
         {
            fieldId: 'edit',
            value: 'false',
         },
         {
            fieldId: 'approve',
            value: 'false',
         },
         {
            fieldId: 'refuse',
            value: 'false',
         },
      ]
      await this.postRole(data)
      await this.getRoles()
   }

   async editPicture(event: any) {
      const formData = new FormData()
      formData.append(event.target.files[0].name, event.target.files[0])

      await this.uploadDocument(formData)

      const file = {
         description: format(new Date(), 'yyyyMMddHHmm') + '_' + this.currentUser.code + '.png',
         parentId: this.configurationsSelected?.codigo_pasta,
         attachments: [{ fileName: event.target.files[0].name }],
      }

      const responseDocument = await this.createDocument(file)
      console.log(responseDocument)

      const responseConfig = this.putConfigurations(this.configurationsSelected!.documentid, [
         { fieldId: 'codigo_foto', value: responseDocument?.content.id },
      ])
      console.log(responseConfig)

      if (this.configurationsSelected?.codigo_foto) {
         this.urlFoto = (await this.getDocument(responseDocument.content.id))?.content
         console.log(this.urlFoto)
      }
   }

   async selectUser(user: User) {
      this.userSelected = user
      this.configurationsSelected = await this.getConfigurations([new Constraint('usuario_codigo', user.userTenantId)])
      if (!this.configurationsSelected) {
         let folderData = {
            parentFolderId: this.environment.folderBancoFotos,
            documentDescription: user.colleagueName,
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

         const folder = await this.postFolder(folderData)
         const now = new Date().toISOString()
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
               value: user?.colleagueName,
            },
            {
               fieldId: 'usuario_codigo',
               value: user?.userTenantId,
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
               value: folder?.content?.documentId,
            },
         ]
         await this.postConfigurations(data)
         this.configurationsSelected = await this.getConfigurations([
            new Constraint('usuario_codigo', user.userTenantId),
         ])
      }
      this.profileUserSelected = await this.getProfile([new Constraint('codigo_usuario', user.userTenantId)])
      if (!this.profileUserSelected) {
         let data = [
            {
               fieldId: 'codigo_usuario',
               value: this.userSelected?.userTenantId,
            },
            {
               fieldId: 'codigo_perfil',
               value: this.environment.codPerfilUser,
            },
         ]
         const newProfile = await this.postLinkProfile(data)
         console.log('newProfile')
         console.log(newProfile)
      }
      this.profileUserSelected = await this.getProfile([new Constraint('codigo_usuario', user.userTenantId)])

      this.userSelected.profile = this.profileUserSelected
      console.log(this.userSelected)
      this.urlFoto = (await this.getDocument(this.configurationsSelected!.codigo_foto))?.content
   }

   unselectUser() {
      this.userSelected = null
      this.urlFoto = ''
      this.configurationsSelected = null
      this.profileUserSelected = null
   }

   changeRouter(route: string) {
      this.routerActive = route
   }

   openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
         horizontalPosition: 'end',
         verticalPosition: 'top',
         duration: 2000,
      })
   }
}
