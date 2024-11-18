import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { environment } from '../../../../../environments/environment'
import { first } from 'rxjs'
import { Constraint } from '../../../models/constraint.model'
import { FormularioService } from '../../../services/fluig/formulario.service'
import { NgClass } from '@angular/common'

@Component({
   selector: 'app-pendings',
   standalone: true,
   imports: [RouterLink, NgClass],
   templateUrl: './pendings.component.html',
   styleUrl: './pendings.component.scss',
})
export class PendingsComponent {
   private formularioService = inject(FormularioService)
   public environment = environment

   pendingWorkRegiister: any = []

   async ngOnInit(): Promise<void> {
      await this.getPendingsWorkRegister()
   }

   async getPendingsWorkRegister(constraint: Constraint[] = []) {
      const result = await this.formularioService
         .getData('dsp_getPendenciasPonto', constraint)
         .pipe(first())
         .toPromise()

      this.pendingWorkRegiister = result
   }
}
