import { Component, inject } from '@angular/core'
import { MatDialogModule } from '@angular/material/dialog'
import { RouterOutlet } from '@angular/router'
import { CurrentUserService } from './core/services/fluig/currentUser.service'
import { first } from 'rxjs'
import Swal from 'sweetalert2'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private currentUserService = inject(CurrentUserService)
  title = 'Ponto Eletrônico'
}
