import { LuTriangleAlert } from "react-icons/lu";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";

export type UpscaleSettingProps = React.ComponentProps<typeof Checkbox>;

export const UpscaleSetting = ({ children, ...props }: UpscaleSettingProps) => {
  const { formState, buildCheckboxChangeHandler } = useSettingsFormState();
  return (
    <Checkbox
      size="md"
      checked={formState.upscaleScryfallImages}
      onCheckedChange={buildCheckboxChangeHandler("upscaleScryfallImages")}
      {...props}
    >
      {children ?? "Upscale Decklist Images"}
      <Tooltip
        openDelay={100}
        closeDelay={200}
        content="This can add a lot of time to the download process."
      >
        <LuTriangleAlert />
      </Tooltip>
    </Checkbox>
  );
};
