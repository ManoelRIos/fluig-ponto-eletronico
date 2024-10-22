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

  users: User[] = []
  userSelected!: User | null
  filteredUsers: User[] = []
  currentPage = 0
  countUsers = 10
  currentUser!: CurrentUser
  profile!: Role
  searchQuery = ''
  routerActive = 'users'
  urlFoto = ''
  configurations!: ConfigurationWorkRecord | null
  roles!: Role[]
  profileUserSelected!: Role | null

  async ngOnInit() {
    this.currentUser = this.currentUserService.currentUser
    this.profile = this.currentUserService.profile
      ? this.currentUserService.profile
      : await this.getProfile([new Constraint('usuario_codigo', this.currentUser.tenantId)])
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
        .getData('perfilPonto2', constraint)
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

  async postFolder(folderData: any): Promise<void> {
    return new Promise(async (resolve) => {
      this.gedService.postFolder(folderData).subscribe(
        (response: any) => {
          console.log(response)
          resolve()
        },
        (error) => console.error('Erro ao cadastrar pasta:', error),
      )
    })
  }

  async getProfile(constraint: Constraint[] = []): Promise<Role> {
    return new Promise((resolve) => {
      this.formularioService
        .getData('vinculoPerfilPonto', constraint)
        .pipe(first())
        .subscribe({
          next: async (response: any) => {
            return new Promise((resolve) => {
              this.formularioService
                .getData('perfilPonto2', [new Constraint('documentid', response[0]?.codigo_perfil)])
                .pipe(first())
                .subscribe({
                  next: (response) => {
                    this.profileUserSelected = response[0]
                  },
                })
            })
          },
        })
    })
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

  async getConfigurations(constraints: Constraint[]): Promise<ConfigurationWorkRecord> {
    return new Promise((resolve, reject) => {
      this.formularioService
        .getData('configRegistroPonto', constraints)
        .pipe(first())
        .subscribe({
          next: (response) => {
            if (response.length) {
              resolve(response[0])
            }
          },
        })
    })
  }

  filterSearch() {
    this.filteredUsers = this.users.filter(
      (user: User) =>
        user.colleagueName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.especializationArea?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.mail?.toLowerCase().includes(this.searchQuery.toLowerCase()),
    )
  }

  async selectUser(user: User) {
    this.userSelected = user
    this.configurations = await this.getConfigurations([new Constraint('usuario_codigo', user.userTenantId)])
    await this.getProfile([new Constraint('usuario_codigo', user.userTenantId)])
    this.userSelected.profile = this.profileUserSelected
    console.log(this.userSelected)
    this.urlFoto = await (await this.getDocument(this.configurations.codigo_foto))?.content

    console.log(this.configurations)
  }

  unselectUser() {
    this.userSelected = null
    this.urlFoto = ''
    this.configurations = null
    this.profileUserSelected = null
  }

  changeRouter(route: string) {
    this.routerActive = route
  }
}
