import {
  Badge,
  Button,
  IconButton,
  Tabs,
  Box,
  Input,
  parseColor,
  Bleed,
  Icon,
  Link,
  HStack,
  VStack,
  Text,
  createListCollection,
  useFilter,
  StackProps,
  Collapsible,
  Listbox,
} from "@chakra-ui/react";
import { ChangeEvent, useContext, useRef, useState } from "react";
import {
  LuDownload,
  LuGraduationCap,
  LuRefreshCcw,
  LuSave,
  LuTrash2,
  LuUpload,
  LuUser,
} from "react-icons/lu";

import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
  AccordionItemTitle,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ColorPickerRoot,
  ColorPickerLabel,
  ColorPickerControl,
  ColorPickerInput,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerArea,
  ColorPickerEyeDropper,
  ColorPickerSliders,
  ColorPickerSwatchGroup,
} from "@/components/ui/color-picker";
import { Field, FieldLabel } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import {
  FileUploadRoot,
  FileUploadTrigger,
  FileUploadList,
} from "@/components/ui/file-upload";
import { InputGroup } from "@/components/ui/input-group";
import {
  NumberInputRoot,
  NumberInputField,
} from "@/components/ui/number-input";
import {
  SelectRoot,
  SelectLabel,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItemGroup,
  SelectItem,
  SelectItemText,
  SelectControl,
  SelectIndicatorGroup,
  SelectIndicator,
} from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

import { ImagesContext } from "@/context/ImagesContext";
import {
  CARD_DIMENSIONS,
  MAX_BLEED,
  MAX_GUIDES_THICKNESS,
  PAGE_DIMENSIONS,
} from "@/context/SettingsContext";
import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { ImportPreview, useTransfer } from "@/hooks/useTransfer";
import { selectIsPresetDirty, useSettingsStore } from "@/store/settingsStore";
import { createFileHash } from "@/utils/create-file-hash";

import { DefaultImportLanguageSetting } from "../DefaultImportLanguageSetting";
import { UpscaleSetting } from "../UpscaleSetting";
import { Status } from "../ui/status";
import { BasePDFInput } from "./BasePDFInput";
import { ExportProjectDialog } from "./ExportProjectDialog";
import { ImportBundleDialog } from "./ImportBundleDialog";

const DefaultCardBackSection = () => {
  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);
  const setDefaultCardBack = useSettingsStore((s) => s.setDefaultCardBack);

  const acceptedFile = defaultCardBack
    ? "file" in defaultCardBack
      ? defaultCardBack.file
      : new File([new ArrayBuffer(0)], defaultCardBack.name)
    : null;

  return (
    <Field label="Default Card Back">
      <FileUploadRoot
        maxFiles={1}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".webp"] }}
        onFileChange={(details) => {
          const file = details.acceptedFiles[0];
          if (!file) {
            setDefaultCardBack(null);
          } else {
            void createFileHash(file).then((hash) => {
              setDefaultCardBack({ file, hash });
            });
          }
        }}
        acceptedFiles={acceptedFile ? [acceptedFile] : []}
      >
        {defaultCardBack ? (
          <FileUploadList clearable />
        ) : (
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              Upload card back…
            </Button>
          </FileUploadTrigger>
        )}
      </FileUploadRoot>
    </Field>
  );
};

const PresetsPanel = () => {
  const presets = useSettingsStore((s) => s.presets);
  const activePresetName = useSettingsStore((s) => s.activePresetName);
  const savePreset = useSettingsStore((s) => s.savePreset);
  const loadPreset = useSettingsStore((s) => s.loadPreset);
  const deletePreset = useSettingsStore((s) => s.deletePreset);
  const isPresetDirty = useSettingsStore(selectIsPresetDirty);
  const { exportPresets } = useTransfer();

  const [presetName, setPresetName] = useState("");
  const [presetFilter, setPresetFilter] = useState("");

  const handleExportPreset = (name: string) => {
    void exportPresets([name]).catch(() =>
      toaster.create({ type: "error", title: "Failed to export preset" }),
    );
  };

  const presetEntries = Object.keys(presets);

  const isNewPresetNameValid =
    presetName.trim().length > 0 && !presets[presetName.trim()];

  const listFilter = useFilter({ sensitivity: "base" });

  const presetCollection = createListCollection({
    items: presetEntries.map((name) => ({
      value: name,
      label: name,
    })),
  });

  const filter = (inputValue: string) => {
    setPresetFilter(inputValue);
  };

  const displayedPresets = presetCollection.items.filter((item) =>
    listFilter.contains(item.label, presetFilter),
  );

  return (
    <>
      {activePresetName && (
        <VStack align="start">
          <Text fontSize="sm" color="fg.muted" truncate flex="1">
            Active: <strong>{activePresetName}</strong>
            {isPresetDirty && (
              <>
                &nbsp;
                <Badge colorPalette="orange" size="sm" flexShrink={0}>
                  Modified
                </Badge>
              </>
            )}
          </Text>
          {isPresetDirty && (
            <Button
              size="xs"
              colorPalette="orange"
              variant="subtle"
              flexShrink={0}
              onClick={() => savePreset(activePresetName)}
            >
              Save changes
            </Button>
          )}
        </VStack>
      )}
      <Field
        flex="1"
        invalid={!isNewPresetNameValid && presetName.trim().length > 0}
        helperText="Save current settings as a preset for future use"
        errorText={
          !isNewPresetNameValid && presetName.trim().length > 0
            ? "Preset name already exists"
            : undefined
        }
      >
        <FieldLabel>New preset name</FieldLabel>
        <HStack alignItems="flex-end">
          <Input
            size="sm"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="My Settings..."
          />
          <Button
            size="sm"
            onClick={() => {
              if (isNewPresetNameValid) {
                savePreset(presetName.trim());
                setPresetName("");
              }
            }}
            disabled={!presetName.trim() || !isNewPresetNameValid}
          >
            Save
          </Button>
        </HStack>
      </Field>
      {presetEntries.length > 0 && (
        <Button
          size="xs"
          variant="outline"
          alignSelf="flex-start"
          onClick={() => {
            void exportPresets(presetEntries).catch(() =>
              toaster.create({
                type: "error",
                title: "Failed to export presets",
              }),
            );
          }}
        >
          <LuDownload /> Export all presets
        </Button>
      )}
      <Listbox.Root
        collection={presetCollection}
        value={activePresetName ? [activePresetName] : undefined}
        onValueChange={({ value }) => loadPreset(value[0])}
        visibility={presetEntries.length > 0 ? "visible" : "hidden"}
      >
        <Listbox.Label>Presets</Listbox.Label>
        <Listbox.Input
          as={Input}
          placeholder="Type to filter presets..."
          onChange={(e) => filter(e.target.value)}
        />
        {displayedPresets.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No presets found, adjust the filter
          </Text>
        ) : (
          <Listbox.Content>
            {displayedPresets.map((item) => (
              <Listbox.Item key={item.value} item={item}>
                <Listbox.ItemText lineClamp="1">{item.label}</Listbox.ItemText>
                <Listbox.ItemIndicator />
                <IconButton
                  size="xs"
                  variant="ghost"
                  type="button"
                  aria-label={`Export preset "${item.label}"`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPreset(item.value);
                  }}
                >
                  <LuDownload />
                </IconButton>
                <IconButton
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  type="button"
                  aria-label={`Delete preset "${item.label}"`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(item.value);
                  }}
                >
                  <LuTrash2 />
                </IconButton>
              </Listbox.Item>
            ))}
          </Listbox.Content>
        )}
      </Listbox.Root>
    </>
  );
};

const ProjectsPanel = () => {
  const {
    projects,
    activeProjectName,
    isProjectDirty,
    isLoadingProject,
    saveProject,
    loadProject,
    deleteProject,
  } = useContext(ImagesContext);
  const { exportProjects } = useTransfer();

  const [projectName, setProjectName] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [exportPending, setExportPending] = useState<string[] | null>(null);

  const handleExportConfirm = (includeSettings: boolean) => {
    const names = exportPending;
    setExportPending(null);
    if (!names) return;
    void exportProjects(names, includeSettings).catch(() =>
      toaster.create({ type: "error", title: "Failed to export project(s)" }),
    );
  };

  const projectEntries = Object.keys(projects);

  const isNewProjectNameValid =
    projectName.trim().length > 0 && !projects[projectName.trim()];

  const listFilter = useFilter({ sensitivity: "base" });

  const projectCollection = createListCollection({
    items: projectEntries.map((name) => ({
      value: name,
      label: name,
    })),
  });

  const displayedProjects = projectCollection.items.filter((item) =>
    listFilter.contains(item.label, projectFilter),
  );

  return (
    <>
      <ExportProjectDialog
        pending={exportPending}
        onConfirm={handleExportConfirm}
        onCancel={() => setExportPending(null)}
      />
      {activeProjectName && (
        <VStack align="start">
          <Text fontSize="sm" color="fg.muted" truncate flex="1">
            Active: <strong>{activeProjectName}</strong>
            {isProjectDirty && (
              <>
                &nbsp;
                <Badge colorPalette="orange" size="sm" flexShrink={0}>
                  Modified
                </Badge>
              </>
            )}
          </Text>
          {isProjectDirty && (
            <Button
              size="xs"
              colorPalette="orange"
              variant="subtle"
              flexShrink={0}
              disabled={isLoadingProject}
              onClick={() => void saveProject(activeProjectName)}
            >
              Save changes
            </Button>
          )}
        </VStack>
      )}
      <Field
        flex="1"
        invalid={!isNewProjectNameValid && projectName.trim().length > 0}
        helperText="Save the current card layout as a project"
        errorText={
          !isNewProjectNameValid && projectName.trim().length > 0
            ? "Project name already exists"
            : undefined
        }
      >
        <FieldLabel>New project name</FieldLabel>
        <HStack alignItems="flex-end">
          <Input
            size="sm"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Project..."
          />
          <Button
            size="sm"
            onClick={() => {
              if (isNewProjectNameValid) {
                void saveProject(projectName.trim());
                setProjectName("");
              }
            }}
            disabled={
              !projectName.trim() || !isNewProjectNameValid || isLoadingProject
            }
          >
            Save
          </Button>
        </HStack>
      </Field>
      {projectEntries.length > 0 && (
        <Button
          size="xs"
          variant="outline"
          alignSelf="flex-start"
          disabled={isLoadingProject}
          onClick={() => setExportPending(projectEntries)}
        >
          <LuDownload /> Export all projects
        </Button>
      )}
      <Listbox.Root
        collection={projectCollection}
        value={activeProjectName ? [activeProjectName] : undefined}
        onValueChange={({ value }) => {
          const name = value[0];
          if (!isLoadingProject && name) void loadProject(name);
        }}
        visibility={projectEntries.length > 0 ? "visible" : "hidden"}
      >
        <Listbox.Label>Projects</Listbox.Label>
        <Listbox.Input
          as={Input}
          placeholder="Type to filter projects..."
          onChange={(e) => setProjectFilter(e.target.value)}
        />
        {displayedProjects.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No projects found, adjust the filter
          </Text>
        ) : (
          <Listbox.Content>
            {displayedProjects.map((item) => (
              <Listbox.Item key={item.value} item={item}>
                <Listbox.ItemText lineClamp="1">{item.label}</Listbox.ItemText>
                <Listbox.ItemIndicator />
                <IconButton
                  size="xs"
                  variant="ghost"
                  type="button"
                  disabled={isLoadingProject}
                  aria-label={`Export project "${item.label}"`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportPending([item.value]);
                  }}
                >
                  <LuDownload />
                </IconButton>
                <IconButton
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  type="button"
                  disabled={isLoadingProject}
                  aria-label={`Delete project "${item.label}"`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(item.value);
                  }}
                >
                  <LuTrash2 />
                </IconButton>
              </Listbox.Item>
            ))}
          </Listbox.Content>
        )}
      </Listbox.Root>
    </>
  );
};

const unitsCollection = createListCollection({
  items: Array.from(
    new Set(Object.values(PAGE_DIMENSIONS).map(({ unit }) => unit)),
  ).map((unit) => ({
    value: unit,
    label: unit,
  })),
});

const PAGE_SIZE_OPTIONS = Object.entries(PAGE_DIMENSIONS).map(
  ([label, dimensions]) => ({
    label,
    unit: dimensions.unit,
    value: `${dimensions.width}${dimensions.unit}-${dimensions.height}${dimensions.unit}`,
    hidden: false,
  }),
);

const Container = (props: StackProps) => (
  <VStack
    width="full"
    gap="4"
    alignItems="stretch"
    alignSelf="stretch"
    justifyContent="center"
    {...props}
  />
);

export const SettingsForm = () => {
  const { isProjectDirty } = useContext(ImagesContext);
  const {
    formState,
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
  } = useSettingsFormState();
  const { prepareImport, applyImport } = useTransfer();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importPending, setImportPending] = useState<ImportPreview | null>(
    null,
  );

  const handleImportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void prepareImport(file)
      .then(setImportPending)
      .catch((error: unknown) =>
        toaster.create({
          type: "error",
          title: "Failed to read bundle",
          description: error instanceof Error ? error.message : undefined,
        }),
      );
  };

  const handleImportConfirm = (options: {
    overwrite: boolean;
    applySettings: boolean;
  }) => {
    const preview = importPending;
    setImportPending(null);
    if (!preview) return;
    void applyImport(preview, options)
      .then(() => toaster.create({ type: "success", title: "Bundle imported" }))
      .catch(() =>
        toaster.create({ type: "error", title: "Failed to import bundle" }),
      );
  };

  const cardSizeCollection = createListCollection({
    items: Object.entries(CARD_DIMENSIONS)
      .map(([label, dimensions]) => ({
        label,
        value: `${dimensions.width}-${dimensions.height}`,
        hidden: false,
      }))
      .concat({
        label: "Custom",
        value: cardSizeValue,
        hidden: true,
      }),
  });

  const pageSizeCollection = createListCollection({
    groupBy: (item) => item.unit,
    items: PAGE_SIZE_OPTIONS.concat({
      label: "Custom",
      unit: formState.unit,
      value: "custom",
      hidden: true,
    }),
  });

  const displayPageSizeValue = PAGE_SIZE_OPTIONS.some(
    (option) => option.value === pageSizeValue,
  )
    ? pageSizeValue
    : "custom";

  const rotatePage = () => {
    void handle({
      pageWidth: formState.pageHeight,
      pageHeight: formState.pageWidth,
    });
  };

  const basePdfName = useSettingsStore((s) => s.basePdfName);
  const isPageSizeLocked = basePdfName !== null;

  const activePresetName = useSettingsStore((s) => s.activePresetName);
  const isPresetDirty = useSettingsStore(selectIsPresetDirty);

  const maxGuidesThickness = Math.min(
    MAX_GUIDES_THICKNESS,
    Math.round((MAX_BLEED - Number(formState.bleedEdge)) * 10000) / 10000,
  );
  const maxBleedEdge = MAX_BLEED - Number(formState.guidesThickness);

  const maxGuideLength = Number(formState.cardWidth) / 2;

  return (
    <Tabs.Root asChild defaultValue="basic" fitted width="full">
      <form>
        <Bleed inline={{ base: "2", lg: "4" }}>
          <Tabs.List>
            <Tabs.Trigger value="basic" aria-label="Basic Settings">
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Basic Settings"
              >
                <Icon fontSize="2xl">
                  <LuUser />
                </Icon>
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger value="advanced" aria-label="Advanced Settings">
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Advanced Settings"
              >
                <Icon fontSize="2xl">
                  <LuGraduationCap />
                </Icon>
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger value="save" aria-label="Save/Load Settings">
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Save/Load Settings"
              >
                <Box position="relative" display="inline-flex">
                  <Icon fontSize="2xl">
                    <LuSave />
                  </Icon>
                  {((activePresetName && isPresetDirty) || isProjectDirty) && (
                    <Status
                      position="absolute"
                      top="-1"
                      right="-1"
                      value="warning"
                    />
                  )}
                </Box>
              </Tooltip>
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        <Tabs.Content value="basic" asChild>
          <Container>
            <Field
              label="Output Filename"
              invalid={formErrors.filename.length > 0}
              errorText={formErrors.filename[0]?.message}
            >
              <Input
                minLength={1}
                maxLength={50}
                value={formState.filename}
                onChange={buildTextInputChangeHandler("filename")}
              />
            </Field>

            <Collapsible.Root gap="3">
              <Field>
                <SelectRoot
                  collection={cardSizeCollection}
                  value={[cardSizeValue]}
                  onValueChange={cardSizeChangeHandler}
                >
                  <HStack
                    width="full"
                    alignItems="flex-end"
                    justifyContent="space-between"
                  >
                    <SelectLabel>Card Size</SelectLabel>
                    <Collapsible.Trigger asChild>
                      <Link
                        as="button"
                        fontWeight="semibold"
                        fontSize="xs"
                        colorPalette="accent"
                      >
                        Customize
                      </Link>
                    </Collapsible.Trigger>
                  </HStack>
                  <SelectControl>
                    <SelectTrigger>
                      <SelectValueText textTransform="capitalize" />
                    </SelectTrigger>
                    <SelectIndicatorGroup />
                  </SelectControl>
                  <SelectContent>
                    {cardSizeCollection.items
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <SelectItem key={item.value} item={item}>
                          <SelectItemText textTransform="capitalize">
                            {item.label}
                          </SelectItemText>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <Collapsible.Content>
                <VStack
                  width="full"
                  gap="4"
                  alignItems="stretch"
                  alignSelf="stretch"
                  justifyContent="center"
                  paddingLeft="4"
                >
                  <Field
                    label="Card Width"
                    invalid={formErrors.cardWidth.length > 0}
                    errorText={formErrors.cardWidth[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.cardWidth}
                      onValueChange={buildNumberInputChangeHandler("cardWidth")}
                    >
                      <InputGroup endAddon="mm">
                        <NumberInputField />
                      </InputGroup>
                    </NumberInputRoot>
                  </Field>
                  <Field
                    label="Card Height"
                    invalid={formErrors.cardHeight.length > 0}
                    errorText={formErrors.cardHeight[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.cardHeight}
                      onValueChange={buildNumberInputChangeHandler(
                        "cardHeight",
                      )}
                    >
                      <InputGroup endAddon="mm">
                        <NumberInputField />
                      </InputGroup>
                    </NumberInputRoot>
                  </Field>
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>

            <Collapsible.Root gap="3">
              <Field>
                <SelectRoot
                  collection={pageSizeCollection}
                  value={[displayPageSizeValue]}
                  onValueChange={pageSizeChangeHandler}
                  disabled={isPageSizeLocked}
                >
                  <HStack
                    width="full"
                    alignItems="flex-end"
                    justifyContent="space-between"
                  >
                    <SelectLabel>Page Size</SelectLabel>
                    <Collapsible.Trigger asChild>
                      <Link
                        as="button"
                        fontWeight="semibold"
                        fontSize="xs"
                        colorPalette="accent"
                      >
                        Customize
                      </Link>
                    </Collapsible.Trigger>
                  </HStack>
                  <Tooltip
                    disabled={!isPageSizeLocked}
                    openDelay={100}
                    closeDelay={200}
                    content="Locked to Base PDF dimensions"
                  >
                    <SelectControl>
                      <SelectTrigger>
                        <SelectValueText textTransform="capitalize" />
                      </SelectTrigger>
                      <SelectIndicatorGroup>
                        <Tooltip
                          openDelay={100}
                          closeDelay={200}
                          content="Rotate Page"
                        >
                          <IconButton
                            type="button"
                            variant="ghost"
                            pointerEvents="auto"
                            size="xs"
                            aria-label="Rotate Page"
                            disabled={isPageSizeLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              rotatePage();
                            }}
                          >
                            <LuRefreshCcw />
                          </IconButton>
                        </Tooltip>
                        <SelectIndicator />
                      </SelectIndicatorGroup>
                    </SelectControl>
                  </Tooltip>
                  <SelectContent>
                    {pageSizeCollection.group().map(([type, group]) => (
                      <SelectItemGroup
                        key={type}
                        label={type === "mm" ? "ISO" : "US"}
                      >
                        {group
                          .filter((item) => !item.hidden)
                          .map((item) => (
                            <SelectItem key={item.value} item={item}>
                              <SelectItemText textTransform="capitalize">
                                {item.label}
                              </SelectItemText>
                            </SelectItem>
                          ))}
                      </SelectItemGroup>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <Collapsible.Content>
                <VStack
                  width="full"
                  gap="4"
                  alignItems="stretch"
                  alignSelf="stretch"
                  justifyContent="center"
                  paddingLeft="4"
                >
                  <Field disabled={isPageSizeLocked}>
                    <SelectRoot
                      collection={unitsCollection}
                      value={[formState.unit]}
                      onValueChange={buildSelectChangeHandler("unit")}
                      disabled={isPageSizeLocked}
                    >
                      <SelectLabel>Page Unit</SelectLabel>
                      <SelectControl>
                        <SelectTrigger>
                          <SelectValueText />
                        </SelectTrigger>
                        <SelectIndicatorGroup />
                      </SelectControl>
                      <SelectContent>
                        {unitsCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            <SelectItemText>{item.label}</SelectItemText>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                  <Field
                    label={`Page Width (${formState.unit})`}
                    invalid={formErrors.pageWidth.length > 0}
                    disabled={isPageSizeLocked}
                    errorText={formErrors.pageWidth[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.pageWidth}
                      onValueChange={buildNumberInputChangeHandler("pageWidth")}
                      disabled={isPageSizeLocked}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                  <Field
                    label={`Page Height (${formState.unit})`}
                    invalid={formErrors.pageHeight.length > 0}
                    disabled={isPageSizeLocked}
                    errorText={formErrors.pageHeight[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.pageHeight}
                      onValueChange={buildNumberInputChangeHandler(
                        "pageHeight",
                      )}
                      disabled={isPageSizeLocked}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>

            <Field
              label="Bleed Edge"
              disabled={!formState.enableBleedEdge}
              invalid={formErrors.bleedEdge.length > 0}
              errorText={formErrors.bleedEdge[0]?.message}
            >
              <NumberInputRoot
                min={0}
                max={maxBleedEdge}
                step={0.5}
                value={formState.bleedEdge}
                onValueChange={buildNumberInputChangeHandler("bleedEdge")}
              >
                <InputGroup endAddon="mm">
                  <NumberInputField />
                </InputGroup>
              </NumberInputRoot>
            </Field>
            <Field
              label="Guides Width"
              invalid={formErrors.guidesThickness.length > 0}
              errorText={formErrors.guidesThickness[0]?.message}
            >
              <NumberInputRoot
                min={0}
                max={maxGuidesThickness}
                step={0.01}
                value={formState.guidesThickness}
                onValueChange={buildNumberInputChangeHandler("guidesThickness")}
              >
                <InputGroup endAddon="mm">
                  <NumberInputField />
                </InputGroup>
              </NumberInputRoot>
            </Field>
            <Field
              invalid={formErrors.guidesColor.length > 0}
              errorText={formErrors.guidesColor[0]?.message}
            >
              <ColorPickerRoot
                value={parseColor(formState.guidesColor)}
                onValueChange={buildColorPickerChangeHandler("guidesColor")}
              >
                <ColorPickerLabel>Guides Color</ColorPickerLabel>
                <ColorPickerControl>
                  <ColorPickerInput />
                  <ColorPickerTrigger />
                </ColorPickerControl>
                <ColorPickerContent>
                  <ColorPickerArea />
                  <ColorPickerEyeDropper />
                  <ColorPickerSliders />
                  <ColorPickerSwatchGroup />
                </ColorPickerContent>
              </ColorPickerRoot>
            </Field>
            <DefaultCardBackSection />
          </Container>
        </Tabs.Content>
        <Tabs.Content value="advanced" asChild width="unset">
          <Bleed inline={{ base: "2", lg: "4" }}>
            <AccordionRoot collapsible defaultValue={["image-quality"]}>
              <AccordionItem value="image-quality">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle>Image Quality</AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <UpscaleSetting />
                    <DefaultImportLanguageSetting />
                    <Field
                      label="Max DPI"
                      invalid={formErrors.maxDpi.length > 0}
                      errorText={formErrors.maxDpi[0]?.message}
                    >
                      <NumberInputRoot
                        min={300}
                        max={1200}
                        step={100}
                        value={formState.maxDpi}
                        onValueChange={buildNumberInputChangeHandler("maxDpi")}
                      >
                        <NumberInputField />
                      </NumberInputRoot>
                    </Field>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Box bg="bg" padding={{ base: "2", lg: "4" }}>
                        <Checkbox
                          size="md"
                          checked={formState.convertToJpg}
                          onCheckedChange={buildCheckboxChangeHandler(
                            "convertToJpg",
                          )}
                        >
                          Convert images to JPG
                        </Checkbox>
                        <Field
                          label="JPG Quality"
                          invalid={formErrors.jpgQuality.length > 0}
                          errorText={formErrors.jpgQuality[0]?.message}
                          disabled={!formState.convertToJpg}
                        >
                          <NumberInputRoot
                            min={0.1}
                            max={1}
                            step={0.01}
                            disabled={!formState.convertToJpg}
                            value={formState.jpgQuality}
                            onValueChange={buildNumberInputChangeHandler(
                              "jpgQuality",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                      </Box>
                    </Bleed>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="alignment">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle>Alignment</AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Fieldset
                        legend="Card Spacing"
                        bg="bg"
                        padding={{ base: "2", lg: "4" }}
                      >
                        <HStack width="full" gap="2">
                          <Field
                            label="Vertical"
                            invalid={formErrors.rowGap.length > 0}
                            errorText={formErrors.rowGap[0]?.message}
                          >
                            <NumberInputRoot
                              min={0}
                              max={100}
                              value={formState.rowGap}
                              onValueChange={buildNumberInputChangeHandler(
                                "rowGap",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                          <Field
                            label="Horizontal"
                            invalid={formErrors.columnGap.length > 0}
                            errorText={formErrors.columnGap[0]?.message}
                          >
                            <NumberInputRoot
                              min={0}
                              max={100}
                              value={formState.columnGap}
                              onValueChange={buildNumberInputChangeHandler(
                                "columnGap",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                        </HStack>
                      </Fieldset>
                    </Bleed>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Fieldset
                        legend="Front Page Offset"
                        bg="bg"
                        padding={{ base: "2", lg: "4" }}
                      >
                        <HStack width="full" gap="2">
                          <Field
                            label="Horizontal"
                            invalid={formErrors.offsetX.length > 0}
                            errorText={formErrors.offsetX[0]?.message}
                            flex="1"
                          >
                            <NumberInputRoot
                              step={1}
                              value={formState.offsetX}
                              onValueChange={buildNumberInputChangeHandler(
                                "offsetX",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                          <Field
                            label="Vertical"
                            invalid={formErrors.offsetY.length > 0}
                            errorText={formErrors.offsetY[0]?.message}
                            flex="1"
                          >
                            <NumberInputRoot
                              step={1}
                              value={formState.offsetY}
                              onValueChange={buildNumberInputChangeHandler(
                                "offsetY",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                        </HStack>
                        <Field
                          label="Rotational"
                          invalid={formErrors.pageRotation.length > 0}
                          errorText={formErrors.pageRotation[0]?.message}
                        >
                          <NumberInputRoot
                            step={1}
                            min={-180}
                            max={180}
                            value={formState.pageRotation}
                            onValueChange={buildNumberInputChangeHandler(
                              "pageRotation",
                            )}
                          >
                            <InputGroup endAddon="°">
                              <NumberInputField />
                            </InputGroup>
                          </NumberInputRoot>
                        </Field>
                      </Fieldset>
                    </Bleed>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Fieldset
                        legend="Back Page Offset"
                        bg="bg"
                        padding={{ base: "2", lg: "4" }}
                      >
                        <HStack width="full" gap="2">
                          <Field
                            label="Horizontal"
                            invalid={formErrors.backOffsetX.length > 0}
                            errorText={formErrors.backOffsetX[0]?.message}
                            flex="1"
                          >
                            <NumberInputRoot
                              step={1}
                              value={formState.backOffsetX}
                              onValueChange={buildNumberInputChangeHandler(
                                "backOffsetX",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                          <Field
                            label="Vertical"
                            invalid={formErrors.backOffsetY.length > 0}
                            errorText={formErrors.backOffsetY[0]?.message}
                            flex="1"
                          >
                            <NumberInputRoot
                              step={1}
                              value={formState.backOffsetY}
                              onValueChange={buildNumberInputChangeHandler(
                                "backOffsetY",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                        </HStack>
                        <Field
                          label="Rotational"
                          invalid={formErrors.backPageRotation.length > 0}
                          errorText={formErrors.backPageRotation[0]?.message}
                        >
                          <NumberInputRoot
                            step={1}
                            min={-180}
                            max={180}
                            value={formState.backPageRotation}
                            onValueChange={buildNumberInputChangeHandler(
                              "backPageRotation",
                            )}
                          >
                            <InputGroup endAddon="°">
                              <NumberInputField />
                            </InputGroup>
                          </NumberInputRoot>
                        </Field>
                      </Fieldset>
                    </Bleed>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Box bg="bg" padding={{ base: "2", lg: "4" }}>
                        <Checkbox
                          size="md"
                          checked={formState.useBackBleedEdge}
                          onCheckedChange={buildCheckboxChangeHandler(
                            "useBackBleedEdge",
                          )}
                        >
                          Different bleed for backs
                        </Checkbox>
                        <Field
                          label="Bleed Edge"
                          invalid={formErrors.backBleedEdge.length > 0}
                          errorText={formErrors.backBleedEdge[0]?.message}
                          disabled={!formState.useBackBleedEdge}
                        >
                          <NumberInputRoot
                            min={0}
                            max={MAX_BLEED}
                            step={0.1}
                            value={formState.backBleedEdge}
                            onValueChange={buildNumberInputChangeHandler(
                              "backBleedEdge",
                            )}
                          >
                            <InputGroup endAddon="mm">
                              <NumberInputField />
                            </InputGroup>
                          </NumberInputRoot>
                        </Field>
                      </Box>
                    </Bleed>
                    <Bleed inline={{ base: "2", lg: "4" }}>
                      <Box bg="bg" padding={{ base: "2", lg: "4" }}>
                        <Checkbox
                          size="md"
                          checked={formState.useBackCardSpacing}
                          onCheckedChange={buildCheckboxChangeHandler(
                            "useBackCardSpacing",
                          )}
                        >
                          Different spacing for backs
                        </Checkbox>
                        <HStack width="full" gap="2">
                          <Field
                            label="Vertical"
                            invalid={formErrors.backRowGap.length > 0}
                            errorText={formErrors.backRowGap[0]?.message}
                            disabled={!formState.useBackCardSpacing}
                          >
                            <NumberInputRoot
                              min={0}
                              max={100}
                              value={formState.backRowGap}
                              onValueChange={buildNumberInputChangeHandler(
                                "backRowGap",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                          <Field
                            label="Horizontal"
                            invalid={formErrors.backColumnGap.length > 0}
                            errorText={formErrors.backColumnGap[0]?.message}
                            disabled={!formState.useBackCardSpacing}
                          >
                            <NumberInputRoot
                              min={0}
                              max={100}
                              value={formState.backColumnGap}
                              onValueChange={buildNumberInputChangeHandler(
                                "backColumnGap",
                              )}
                            >
                              <InputGroup endAddon="mm">
                                <NumberInputField />
                              </InputGroup>
                            </NumberInputRoot>
                          </Field>
                        </HStack>
                      </Box>
                    </Bleed>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="cutting-marks">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle>Cutting Marks</AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <BasePDFInput />
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="guides">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle>Guides</AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <Field
                      label="Guide Length"
                      helperText="Set to 0 for auto length"
                      invalid={formErrors.guideLength.length > 0}
                      errorText={formErrors.guideLength[0]?.message}
                    >
                      <NumberInputRoot
                        min={0}
                        max={maxGuideLength}
                        step={0.5}
                        value={formState.guideLength}
                        onValueChange={buildNumberInputChangeHandler(
                          "guideLength",
                        )}
                      >
                        <InputGroup endAddon="mm">
                          <NumberInputField />
                        </InputGroup>
                      </NumberInputRoot>
                    </Field>
                    <Checkbox
                      size="md"
                      checked={formState.extendedGuidesOnly}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "extendedGuidesOnly",
                      )}
                    >
                      Extended Guides Only
                    </Checkbox>
                    <Checkbox
                      size="md"
                      checked={formState.guidesAtBleedEdge}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "guidesAtBleedEdge",
                      )}
                    >
                      Guides at Bleed Edge
                    </Checkbox>
                    <Checkbox
                      size="md"
                      checked={formState.backPagesShowGuides}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "backPagesShowGuides",
                      )}
                    >
                      Show Guides on Back Pages
                    </Checkbox>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
            </AccordionRoot>
          </Bleed>
        </Tabs.Content>
        <Tabs.Content value="save">
          <ImportBundleDialog
            pending={importPending}
            onConfirm={handleImportConfirm}
            onCancel={() => setImportPending(null)}
          />
          <input
            ref={importInputRef}
            type="file"
            accept=".zip"
            hidden
            onChange={handleImportFileChange}
          />
          <Button
            size="sm"
            variant="outline"
            marginBottom="2"
            onClick={() => importInputRef.current?.click()}
          >
            <LuUpload /> Import bundle...
          </Button>
          <Bleed inline={{ base: "2", lg: "4" }}>
            <AccordionRoot collapsible defaultValue={["presets"]}>
              <AccordionItem value="presets">
                <AccordionItemTrigger gap="1" paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle asChild>
                    <HStack gap="2">
                      Presets
                      {isPresetDirty && <Status value="warning" />}
                    </HStack>
                  </AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <PresetsPanel />
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="projects">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  <AccordionItemTitle asChild>
                    <HStack gap="2">
                      Projects
                      {isProjectDirty && <Status value="warning" />}
                    </HStack>
                  </AccordionItemTitle>
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <ProjectsPanel />
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
            </AccordionRoot>
          </Bleed>
        </Tabs.Content>
      </form>
    </Tabs.Root>
  );
};
