import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useSettingsFormState } from "~/hooks/useSettingsFormState";

import { Checkbox } from "./ui/checkbox";
import { Field } from "./ui/field";
import { Tooltip } from "./ui/tooltip";

export const UpscaleSetting = ({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) => {
  const { formState, buildCheckboxChangeHandler } = useSettingsFormState();
  return (
    <Field.Root className={className}>
      <Field.Label display="inline-flex" alignItems="center" gap="1">
        {children ?? "Upscale Scryfall Images"}
        <Tooltip.Root openDelay={100} closeDelay={200}>
          <Tooltip.Trigger asChild>
            <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Arrow>
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
            <Tooltip.Content>
              This can add a lot of time to the download process.
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Field.Label>
      <Checkbox
        size="lg"
        checked={formState.upscaleScryfallImages}
        onCheckedChange={buildCheckboxChangeHandler("upscaleScryfallImages")}
      />
    </Field.Root>
  );
};
