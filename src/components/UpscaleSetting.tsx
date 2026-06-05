import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Checkbox } from "@/components/ui-old/checkbox";
import { Field } from "@/components/ui-old/field";
import { Tooltip } from "@/components/ui-old/tooltip";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";

export const UpscaleSetting = ({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) => {
  const { formState, buildCheckboxChangeHandler } = useSettingsFormState();
  return (
    <Field.Root className={className}>
      <Field.Label display="inline-flex" alignItems="center" gap="1">
        {children ?? "Upscale Decklist Images"}
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
