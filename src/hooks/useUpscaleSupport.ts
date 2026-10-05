import { useEffect, useState } from "react";

import { detectUpscaleSupport, UpscaleSupport } from "@/utils/upscale-support";

let supportPromise: Promise<UpscaleSupport> | null = null;

/**
 * Whether the AI upscaler has a WebGL or WebGPU backend to run on. Reports
 * `true` until detection finishes so options don't flash disabled.
 */
export const useIsAiUpscaleSupported = () => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supportPromise ??= detectUpscaleSupport();
    void supportPromise.then((support) => {
      if (isMounted) {
        setIsSupported(support.hasSupportedBackend);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return isSupported;
};
