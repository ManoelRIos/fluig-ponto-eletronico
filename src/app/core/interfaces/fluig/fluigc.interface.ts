import {FluigLoading, FluigLoadingOptions} from './index';

export interface Fluigc {
  /**
   * Componente de Loading padrão do Fluig
   * @param {string | Window} target Parâmetro obrigatório, div do elemento ou objeto windows
   * @param {FluigLoadingOptions} [options] objeto de configuração
   * @returns {FluigLoading} Instância do loading
   */
  loading(target: string | Window, options?: FluigLoadingOptions): FluigLoading;
}
