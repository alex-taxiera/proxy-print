export type UpscaleBackend = "webgl" | "webgpu";

export type UpscaleSupport = {
  webgl: boolean;
  webgpu: boolean;
  hasSupportedBackend: boolean;
};

const hasWebGLSupport = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(context);
  } catch {
    return false;
  }
};

const hasWebGPUSupport = async () => {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
};

export const detectUpscaleSupport = async (): Promise<UpscaleSupport> => {
  const [webgl, webgpu] = await Promise.all([
    Promise.resolve(hasWebGLSupport()),
    hasWebGPUSupport(),
  ]);

  return {
    webgl,
    webgpu,
    hasSupportedBackend: webgl || webgpu,
  };
};

export const detectBestUpscaleBackend =
  async (): Promise<UpscaleBackend | null> => {
    const support = await detectUpscaleSupport();

    if (support.webgpu) {
      return "webgpu";
    }

    if (support.webgl) {
      return "webgl";
    }

    return null;
  };
