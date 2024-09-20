import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { first } from 'rxjs';
import Swal from 'sweetalert2';
import { Constraint } from '../../models/constraint.model';
import { FormularioService } from '../../services/fluig/formulario.service';
import { CurrentUserService } from '../../services/fluig/currentUser.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
  providers: [FormularioService, CurrentUserService],
})
export class UsuariosComponent {
  private formularioService = inject(FormularioService);
  private currentUserService = inject(CurrentUserService);

  usuarios: any = [];

  getUsuarios() {
    let constraint: Constraint[] = [];
    // constraint.push(new Constraint('active', true));

    this.formularioService
      .getData('CadastroProjeto', constraint)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log(response);
          if (response.length) {
            this.usuarios = response;
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
          console.log(response);
        },
        error: (ex) => {
          Swal.fire({ icon: 'error', title: 'Oops...', html: ex });
        },
      });
  }
}
