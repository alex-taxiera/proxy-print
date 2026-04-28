import {
  NumberInputValueChangeDetails,
  CheckboxCheckedChangeDetails,
  SelectValueChangeDetails,
  ColorPickerValueChangeDetails,
} from "@ark-ui/react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Settings,
  PAGE_DIMENSIONS,
  SettingsSchema,
  DEFAULT_SETTINGS,
  cardSizeToNameMap,
  CARD_DIMENSIONS,
  pageSizeToNameMap,
  Unit,
} from "~/context/SettingsContext";
import {
  ScryfallImageQueryData,
  scryfallImagesQueryKey,
  ScryfallImageQueryKey,
  LocalImageQueryData,
  localImagesQueryKey,
  LocalImageQueryKey,
} from "~/queries/images";
import { useSettingsStore } from "~/store/settingsStore";
import { addBleedEdge, needsBleedFromFile } from "~/utils/add-bleed";

const useHandleBleedEdgeForCardSizeChange = () => {
  const queryClient = useQueryClient();

  return async (settings: Settings) => {
    // reprocess all image data in scryfall or local queries
    const scryfallQueries = queryClient.getQueriesData<ScryfallImageQueryData>({
      queryKey: scryfallImagesQueryKey(),
    });

    const cardWidth = Number(settings.cardWidth);
    const cardHeight = Number(settings.cardHeight);

    const nextScryfallData = await Promise.all(
      scryfallQueries.map(async ([key, old]) => {
        const data = await addBleedEdge(
          old!.original,
          old!.mimeType,
          cardWidth,
          cardHeight,
        );
        return [key, data] as [ScryfallImageQueryKey, Blob];
      }),
    );

    for (const [key, next] of nextScryfallData) {
      queryClient.setQueryData<ScryfallImageQueryData, ScryfallImageQueryKey>(
        key,
        (old) => {
          if (!old) {
            return undefined;
          }

          return {
            ...old,
            data: next,
          };
        },
      );
    }

    const localQueries = queryClient.getQueriesData<LocalImageQueryData>({
      queryKey: localImagesQueryKey(),
    });

    const nextLocalData = await Promise.all(
      localQueries.map(async ([key, old]) => {
        const needsBleedEdge = await needsBleedFromFile(
          old!.original,
          cardWidth,
          cardHeight,
        );
        console.log("needsBleedEdge", needsBleedEdge);
        console.log("old!.original.name", old!.original.name);
        if (needsBleedEdge) {
          const data = await addBleedEdge(
            old!.original,
            old!.mimeType,
            cardWidth,
            cardHeight,
          );
          return [key, data] as [LocalImageQueryKey, Blob];
        } else {
          return [key, old!.original] as [LocalImageQueryKey, File];
        }
      }),
    );

    for (const [key, next] of nextLocalData) {
      queryClient.setQueryData<LocalImageQueryData>(key, (old) => {
        if (!old) {
          return undefined;
        }

        return {
          ...old,
          data: next,
        };
      });
    }
  };
};

const calculatePageDimensions = (value: string, unit: Settings["unit"]) => {
  const convertedValue =
    unit === "in" ? Number(value) / 25.4 : Number(value) * 25.4;
  const rounded = Math.round(convertedValue * 100) / 100;
  return rounded.toString();
};

export const useSettingsFormState = () => {
  const formState = useSettingsStore((s) => s.formState);
  const setFormState = useSettingsStore((s) => s.setFormState);

  const handleBleedEdgeForCardSizeChange =
    useHandleBleedEdgeForCardSizeChange();

  const formErrors = (() => {
    const { error } = SettingsSchema.safeParse(formState);
    const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof Settings>;

    return keys.reduce(
      (errorMap, key) => ({
        ...errorMap,
        [key]: error?.issues.filter((issue) => issue.path.includes(key)) ?? [],
      }),
      {} as Record<keyof Settings, NonNullable<typeof error>["issues"]>,
    );
  })();

  const handle = async (updates: Partial<Settings>) => {
    const nextState = {
      ...formState,
      ...Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [
          key,
          value ?? DEFAULT_SETTINGS[key as keyof Settings],
        ]),
      ),
    };

    const updatedKeys = Object.keys(updates) as Array<keyof Settings>;

    if (
      updatedKeys.includes("cardHeight") ||
      updatedKeys.includes("cardWidth")
    ) {
      await handleBleedEdgeForCardSizeChange(nextState);
    }

    if (
      nextState.unit !== formState.unit &&
      !updatedKeys.includes("pageHeight") &&
      !updatedKeys.includes("pageWidth")
    ) {
      nextState.pageHeight = calculatePageDimensions(
        nextState.pageHeight,
        nextState.unit,
      );
      nextState.pageWidth = calculatePageDimensions(
        nextState.pageWidth,
        nextState.unit,
      );
    }

    setFormState(nextState);
  };

  const buildTextInputChangeHandler =
    (key: keyof Settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
      void handle({ [key]: event.target.value });
    };

  const buildNumberInputChangeHandler =
    (key: keyof Settings) => (details: NumberInputValueChangeDetails) => {
      void handle({ [key]: details.value });
    };

  const buildCheckboxChangeHandler =
    (key: keyof Settings) => (details: CheckboxCheckedChangeDetails) => {
      void handle({ [key]: details.checked });
    };

  const buildSelectChangeHandler =
    (key: keyof Settings) => (details: SelectValueChangeDetails) => {
      void handle({ [key]: details.value[0] });
    };

  const cardSizeChangeHandler = (details: SelectValueChangeDetails) => {
    const value = details.value[0] as `${number}-${number}`;
    const cardSize = cardSizeToNameMap[value];

    void handle({
      cardHeight: CARD_DIMENSIONS[cardSize].height.toString(),
      cardWidth: CARD_DIMENSIONS[cardSize].width.toString(),
    });
  };

  const isLandscape =
    Number(formState.pageWidth) > Number(formState.pageHeight);

  const pageSizeChangeHandler = (details: SelectValueChangeDetails) => {
    const value = details.value[0] as `${number}${Unit}-${number}${Unit}`;
    const pageSize = pageSizeToNameMap[value];

    const pageWidth = PAGE_DIMENSIONS[pageSize].width;
    const pageHeight = PAGE_DIMENSIONS[pageSize].height;

    void handle({
      pageWidth: isLandscape ? pageHeight.toString() : pageWidth.toString(),
      pageHeight: isLandscape ? pageWidth.toString() : pageHeight.toString(),
      unit: PAGE_DIMENSIONS[pageSize].unit,
    });
  };

  const buildColorPickerChangeHandler =
    (key: keyof Settings) => (details: ColorPickerValueChangeDetails) => {
      void handle({ [key]: details.value.toString("hex") });
    };

  const cardSizeValue = `${formState.cardWidth}-${formState.cardHeight}`;

  const pageSizeValue = isLandscape
    ? `${formState.pageHeight}${formState.unit}-${formState.pageWidth}${formState.unit}`
    : `${formState.pageWidth}${formState.unit}-${formState.pageHeight}${formState.unit}`;

  return {
    formState,
    setFormState,
    formErrors,
    handle,
    buildTextInputChangeHandler,
    buildNumberInputChangeHandler,
    buildCheckboxChangeHandler,
    buildSelectChangeHandler,
    cardSizeChangeHandler,
    pageSizeChangeHandler,
    buildColorPickerChangeHandler,
    cardSizeValue,
    pageSizeValue,
  };
};
