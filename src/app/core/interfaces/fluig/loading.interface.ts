export interface FluigLoading {
  /**
   * Exibe o loading
   */
  show(): void;

  /**
   * Remove o loading
   */
  hide(): void;
}


export interface FluigLoadingOptions {
  textMessage?: string;
  title?: string | null;
  css?: {
    [key: string]: string;
  };
  overlayCSS?: {
    [key: string]: string | number;
  };
  cursorReset?: string;
  delay?: number;
  baseZ?: number;
  centerX?: boolean;
  centerY?: boolean;
  bindEvents?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  timeout?: number;
  showOverlay?: boolean;
  onBlock?: (() => void) | null;
  onUnblock?: (() => void) | null;
  ignoreIfBlocked?: boolean;
}
