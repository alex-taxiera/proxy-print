// Type definitions for the WASM module generated from imghelper.c

export interface WasmModule {
  // Memory views
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAP32: Int32Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // Memory management functions
  _malloc(size: number): number;
  _free(ptr: number): void;

  // Exported C functions
  _check_alpha(dataPtr: number, pixelCount: number): boolean;
  _copy_alpha_to_rgb(sourcePtr: number, targetPtr: number, pixelCount: number): void;
  _copy_alpha_channel(sourcePtr: number, targetPtr: number, pixelCount: number): void;

  // Emscripten utility functions
  ccall(
    ident: string,
    returnType: 'number' | 'string' | 'boolean' | null,
    argTypes: Array<'number' | 'string' | 'array'>,
    args: any[],
    opts?: any
  ): any;

  cwrap(
    ident: string,
    returnType: 'number' | 'string' | 'boolean' | null,
    argTypes: Array<'number' | 'string' | 'array'>,
    opts?: any
  ): (...args: any[]) => any;

  // Runtime state
  calledRun?: boolean;
  
  // Lifecycle callbacks
  onRuntimeInitialized?: () => void;
  onAbort?: (what: any) => void;
}

export interface WasmModuleFactory {
  (moduleArg?: any): Promise<WasmModule>;
}

declare const Module: WasmModuleFactory;
export default Module;
