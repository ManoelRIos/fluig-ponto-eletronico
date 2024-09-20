import { Injectable } from '@angular/core';
import { Fluigc, FluigLoading } from '../../interfaces/fluig'
import { getLoadingConfig } from '../../utils';

declare const FLUIGC: Fluigc;

@Injectable({
    providedIn: 'root'
})
export class FluigLoadingService {
    private loading: FluigLoading = FLUIGC.loading(window, getLoadingConfig());

    show() {
        this.loading.show()
    }

    hide() {
        this.loading.hide()
    }
}
