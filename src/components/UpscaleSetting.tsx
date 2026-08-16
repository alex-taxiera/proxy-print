import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { detectUpscaleSupport } from "@/utils/upscale-support";

export type UpscaleSettingProps = React.ComponentProps<typeof Checkbox>;

export const UpscaleSetting = ({ children, ...props }: UpscaleSettingProps) => {
  const { formState, handle, buildCheckboxChangeHandler } =
    useSettingsFormState();
  const [isUpscaleSupported, setIsUpscaleSupported] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void detectUpscaleSupport().then((support) => {
      if (!isMounted) {
        return;
      }

      setIsUpscaleSupported(support.hasSupportedBackend);
      if (!support.hasSupportedBackend && formState.upscaleScryfallImages) {
        void handle({ upscaleScryfallImages: false });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [formState.upscaleScryfallImages, handle]);

  const isUpscaleUnavailable = !isUpscaleSupported;

  return (
    <Tooltip
      openDelay={100}
      closeDelay={200}
      disabled={!isUpscaleUnavailable}
      content="Upscaling is unavailable because your browser does not support WebGL or WebGPU."
    >
      <Box as="span" display="inline-block">
        <Checkbox
          size="md"
          checked={
            isUpscaleUnavailable ? false : formState.upscaleScryfallImages
          }
          onCheckedChange={buildCheckboxChangeHandler("upscaleScryfallImages")}
          disabled={isUpscaleUnavailable}
          {...props}
        >
          {children ?? "Upscale Decklist Images"}
          <Tooltip
            openDelay={100}
            closeDelay={200}
            content="This can add a lot of time to the download process."
          >
            <Box as="span" display="inline-flex" alignItems="center">
              <LuTriangleAlert />
            </Box>
          </Tooltip>
        </Checkbox>
      </Box>
    </Tooltip>
  );
};
