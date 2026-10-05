import { LuImageUpscale } from "react-icons/lu";

import {
  MenuContent,
  MenuItem,
  MenuItemText,
  MenuRoot,
  MenuTriggerItem,
} from "@/components/ui/menu";

import { useIsAiUpscaleSupported } from "@/hooks/useUpscaleSupport";
import { useSettingsStore } from "@/store/settingsStore";
import {
  isAiUpscaleMethod,
  resolveUpscaleMethod,
  UPSCALE_METHOD_LABELS,
  UPSCALE_METHOD_SHORT_LABELS,
  UPSCALE_METHODS,
  UpscaleMethod,
} from "@/utils/upscale-methods";

export type UpscaleMenuItemsProps = {
  onUpscale: (method: UpscaleMethod) => void;
  disabled?: boolean;
};

/**
 * "Upscale (<method>)" using the method from settings (bicubic when the
 * setting is None), plus an "Upscale with…" submenu listing every method.
 */
export const UpscaleMenuItems = ({
  onUpscale,
  disabled,
}: UpscaleMenuItemsProps) => {
  const upscaleSetting = useSettingsStore((s) => s.settings.upscaleMethod);
  const isAiSupported = useIsAiUpscaleSupported();

  const preferredMethod = resolveUpscaleMethod(upscaleSetting);
  const defaultMethod =
    isAiUpscaleMethod(preferredMethod) && !isAiSupported
      ? "bicubic"
      : preferredMethod;

  return (
    <>
      <MenuItem
        value="upscale"
        onSelect={() => onUpscale(defaultMethod)}
        disabled={disabled}
      >
        <LuImageUpscale />
        <MenuItemText>
          Upscale ({UPSCALE_METHOD_SHORT_LABELS[defaultMethod]})
        </MenuItemText>
      </MenuItem>
      <MenuRoot
        onSelect={({ value }) => onUpscale(value as UpscaleMethod)}
        positioning={{ gutter: 10, placement: "right-start" }}
      >
        <MenuTriggerItem
          value="upscale-with"
          startIcon={<LuImageUpscale />}
          disabled={disabled}
        >
          <MenuItemText>Upscale with…</MenuItemText>
        </MenuTriggerItem>
        <MenuContent>
          {UPSCALE_METHODS.map((method) => (
            <MenuItem
              key={method}
              value={method}
              disabled={
                disabled || (isAiUpscaleMethod(method) && !isAiSupported)
              }
            >
              {UPSCALE_METHOD_LABELS[method]}
            </MenuItem>
          ))}
        </MenuContent>
      </MenuRoot>
    </>
  );
};
