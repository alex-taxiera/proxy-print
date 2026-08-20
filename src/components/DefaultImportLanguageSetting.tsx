import { createListCollection } from "@chakra-ui/react";

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

import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { SCRYFALL_LANGUAGES } from "@/utils/scryfall-languages";

const languageCollection = createListCollection({ items: SCRYFALL_LANGUAGES });

export type DefaultImportLanguageSettingProps = Omit<
  React.ComponentProps<typeof SelectRoot>,
  "collection" | "value" | "onValueChange"
>;

export const DefaultImportLanguageSetting = ({
  ...props
}: DefaultImportLanguageSettingProps) => {
  const { formState, buildSelectChangeHandler } = useSettingsFormState();

  return (
    <SelectRoot
      collection={languageCollection}
      value={[formState.defaultImportLanguage]}
      onValueChange={buildSelectChangeHandler("defaultImportLanguage")}
      {...props}
    >
      <SelectLabel>Default Import Language</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectIndicatorGroup />
      </SelectControl>
      <SelectContent>
        {languageCollection.items.map((item) => (
          <SelectItem key={item.value} item={item}>
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};
