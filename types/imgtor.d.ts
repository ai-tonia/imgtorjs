/**
 * ImgTor global API (load `build/imgtor.js` after Fabric.js).
 * Fabric types are not bundled; canvas/image use `any` for 1.x compatibility.
 */

declare class imgtor {
  constructor(
    element: string | HTMLImageElement,
    options?: imgtor.ImgTorOptions,
    plugins?: unknown,
  );

  static plugins: Array<new (editor: imgtor, options: unknown) => unknown>;

  containerElement: HTMLElement | null;
  canvas: any;
  image: any;
  sourceCanvas: any;
  sourceImage: any;
  originalImageElement: HTMLImageElement | null;
  transformations: unknown[];
  options: imgtor.ImgTorOptions;
  plugins: Record<string, unknown>;

  selfDestroy(): void;
  addEventListener(eventName: string, callback: (ev: Event) => void): void;
  dispatchEvent(eventName: string): void;
  refresh(next?: () => void): void;
  applyTransformation(transformation: unknown): void;
  reinitializeImage(): void;
}

declare namespace imgtor {
  interface ImgTorOptions {
    minWidth?: number | null;
    minHeight?: number | null;
    maxWidth?: number | null;
    maxHeight?: number | null;
    ratio?: number | null;
    backgroundColor?: string;
    plugins?: Record<string, unknown | false>;
    initialize?: (this: imgtor) => void;
  }

  namespace Utils {
    function extend(target: unknown, source: unknown): unknown;
    function computeImageViewPort(image: {
      getWidth(): number;
      getHeight(): number;
      getAngle(): number;
    }): { width: number; height: number };
  }

  class Plugin {
    constructor(editor: imgtor, options: unknown);
    imgtor: imgtor;
    options: unknown;
    defaults: Record<string, unknown>;
    initialize(): void;
    static extend(
      protoProps: Record<string, unknown> & { constructor?: new (...args: unknown[]) => unknown },
    ): typeof Plugin;
  }

  class Transformation {
    constructor(options: unknown);
    options: unknown;
    applyTransformation(...args: unknown[]): void;
    static extend(
      protoProps: Record<string, unknown> & { constructor?: new (...args: unknown[]) => unknown },
    ): typeof Transformation;
  }

  namespace UI {
    class Toolbar {
      constructor(element: HTMLElement);
      element: HTMLElement;
      createButtonGroup(options?: unknown): ButtonGroup;
    }
    class ButtonGroup {
      constructor(element: HTMLElement);
      element: HTMLElement;
      createButton(options: Record<string, unknown>): Button;
    }
    class Button {
      constructor(element: HTMLButtonElement);
      element: HTMLButtonElement;
      addEventListener(eventName: string, listener: (ev: Event) => void): void;
      removeEventListener(eventName: string, listener: (ev: Event) => void): void;
      active(value: boolean): void;
      hide(value: boolean): void;
      disable(value: boolean): void;
    }
  }
}

/** PascalCase alias used in demos and older snippets. */
declare var ImgTor: typeof imgtor;
