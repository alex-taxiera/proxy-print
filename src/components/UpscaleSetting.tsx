import { Box, createListCollection, Span } from "@chakra-ui/react";
import { useEffect } from "react";
import { LuTriangleAlert } from "react-icons/lu";

import {
  SelectContent,
  SelectControl,
  SelectIndicatorGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { useIsAiUpscaleSupported } from "@/hooks/useUpscaleSupport";
import {
  isAiUpscaleMethod,
  UPSCALE_METHOD_LABELS,
  UPSCALE_SETTING_VALUES,
} from "@/utils/upscale-methods";

export type UpscaleSettingProps = Omit<
  React.ComponentProps<typeof SelectRoot>,
  "collection" | "value" | "onValueChange"
>;

export const UpscaleSetting = ({ children, ...props }: UpscaleSettingProps) => {
  const { formState, handle, buildSelectChangeHandler } =
    useSettingsFormState();
  const isAiSupported = useIsAiUpscaleSupported();

  useEffect(() => {
    if (!isAiSupported && isAiUpscaleMethod(formState.upscaleMethod)) {
      void handle({ upscaleMethod: "bicubic" });
    }
  }, [isAiSupported, formState.upscaleMethod, handle]);

  const collection = createListCollection({
    items: UPSCALE_SETTING_VALUES.map((value) => ({
      value,
      label: UPSCALE_METHOD_LABELS[value],
      disabled: !isAiSupported && isAiUpscaleMethod(value),
    })),
  });

  return (
    <SelectRoot
      collection={collection}
      value={[formState.upscaleMethod]}
      onValueChange={buildSelectChangeHandler("upscaleMethod")}
      {...props}
    >
      <SelectLabel>{children ?? "Upscale Decklist Images"}</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectIndicatorGroup />
      </SelectControl>
      <SelectContent>
        {collection.items.map((item) => (
          <SelectItem key={item.value} item={item}>
            <SelectItemText>
              {item.label}
              {isAiUpscaleMethod(item.value) && !isAiSupported ? (
                <Span display="block" color="fg.muted" textStyle="xs">
                  Requires WebGL or WebGPU
                </Span>
              ) : null}
            </SelectItemText>
            {isAiUpscaleMethod(item.value) && isAiSupported ? (
              <Tooltip
                openDelay={100}
                closeDelay={200}
                content="This can add a lot of time to the download process."
              >
                <Box as="span" display="inline-flex" alignItems="center">
                  <LuTriangleAlert />
                </Box>
              </Tooltip>
            ) : null}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};
