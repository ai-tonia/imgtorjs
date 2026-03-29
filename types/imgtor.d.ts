/**
 * ImgTor global API.
 * Load `build/imgtor.js` — Canvas 2D editor.
 */

declare class imgtor {
  constructor(
    element: string | HTMLImageElement,
    options?: imgtor.ImgTorOptions,
    plugins?: unknown,
  );

  static plugins: Record<string, new (editor: imgtor, options: unknown) => imgtor.Plugin>;

  containerElement: HTMLElement | null;
  canvas: any;
  image: any;
  sourceCanvas: any;
  sourceImage: any;
  originalImageElement: HTMLImageElement | null;
  transformations: unknown[];
  options: imgtor.ImgTorOptions;
  plugins: Record<string, imgtor.Plugin>;

  selfDestroy(): void;
  addEventListener(eventName: string, callback: (ev: Event) => void): void;
  removeEventListener(eventName: string, callback: (ev: Event) => void): void;
  dispatchEvent(eventName: string): void;
  refresh(next?: () => void): void;
  applyTransformation(transformation: unknown): void;
  reinitializeImage(): void;
}

declare namespace imgtor {
  class CanvasObject {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    flipX: boolean;
    flipY: boolean;
    lockUniScaling: boolean;
    constructor(opts?: Record<string, unknown>);
    getLeft(): number;
    getTop(): number;
    getWidth(): number;
    getHeight(): number;
    getScaleX(): number;
    getScaleY(): number;
    setLeft(v: number): void;
    setTop(v: number): void;
    setWidth(v: number): void;
    setHeight(v: number): void;
    setScaleX(v: number): void;
    setScaleY(v: number): void;
    set(keyOrProps: string | Record<string, unknown>, value?: unknown): void;
    setCoords(): void;
    containsPoint(point: { x: number; y: number }): boolean;
    scaleToWidth(targetW: number): void;
    scaleToHeight(targetH: number): void;
    remove(): void;
    callSuper(name: string, ...args: unknown[]): void;
    _render(ctx: CanvasRenderingContext2D): void;
    static extend(
      protoProps: Record<string, unknown> & { constructor?: new (...args: unknown[]) => unknown },
    ): typeof CanvasObject;
  }

  const CanvasAdapterNative: {
    createCanvas(canvasElement: HTMLCanvasElement, options: Record<string, unknown>): any;
    createLockedImage(imageElement: HTMLImageElement | globalThis.Image): any;
    layoutSourceImage(canvas: any, image: any, canvasWidth: number, canvasHeight: number): void;
    layoutViewportImage(
      canvas: any,
      image: any,
      canvasWidth: number,
      canvasHeight: number,
      scale: number,
    ): void;
  };

  interface ImgTorOptions {
    minWidth?: number | null;
    minHeight?: number | null;
    maxWidth?: number | null;
    maxHeight?: number | null;
    ratio?: number | null;
    backgroundColor?: string;
    plugins?: Record<string, unknown | false>;
    /** @deprecated Only `'native'` is supported; kept for backward-compatible option bags. */
    adapterKind?: 'native';
    initialize?: (this: imgtor) => void;
  }

  interface ButtonOptions {
    image?: string;
    type?: string;
    group?: string;
    hide?: boolean;
    disabled?: boolean;
  }

  interface ButtonGroupOptions {
    position?: 'append' | 'prepend';
  }

  namespace Utils {
    function extend(target: unknown, source: unknown): unknown;
    function computeImageViewPort(image: {
      getWidth(): number;
      getHeight(): number;
      getAngle(): number;
    }): { width: number; height: number };
    function computeCropRectFromDrag(params: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      canvasWidth: number;
      canvasHeight: number;
      minWidth: number;
      minHeight: number;
      ratio: number | null;
      isKeyCroping: boolean;
      isKeyLeft: boolean;
      isKeyUp: boolean;
    }): { left: number; top: number; width: number; height: number };
  }

  class Plugin {
    constructor(editor: imgtor, options: unknown);
    imgtor: imgtor;
    options: unknown;
    defaults: Record<string, unknown>;
    initialize(): void;
    destroy(): void;
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
      createButtonGroup(options?: Partial<ButtonGroupOptions>): ButtonGroup;
    }
    class ButtonGroup {
      constructor(element: HTMLElement);
      element: HTMLElement;
      createButton(options?: Partial<ButtonOptions>): Button;
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
