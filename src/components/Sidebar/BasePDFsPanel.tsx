import {
  Button,
  createListCollection,
  HStack,
  IconButton,
  Input,
  Link,
  Listbox,
  Text,
  useFilter,
  VStack,
} from "@chakra-ui/react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { LuPencil, LuSquareCheck, LuTrash2 } from "react-icons/lu";

import { Field } from "@/components/ui/field";
import { Tooltip } from "@/components/ui/tooltip";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { useSettingsStore } from "@/store/settingsStore";
import { applyBasePdfPageSize } from "@/utils/basePdf";

import { DialogTrigger } from "../ui/dialog";
import { FileUploadRoot, FileUploadTrigger } from "../ui/file-upload";
import { CreateBasePdfDialog } from "./CreateBasePdfDialog";
import { ExportCutlineDxfDialog } from "./ExportCutlineDxfDialog";
import { HowToUseAutoCutterDialog } from "./HowToUseAutoCutterDialog";

export const BasePDFsPanel = () => {
  const { formState, handle } = useSettingsFormState();
  const basePdfs = useSettingsStore((s) => s.basePdfs);
  const activeBasePdfId = useSettingsStore((s) => s.activeBasePdfId);
  const addBasePdf = useSettingsStore((s) => s.addBasePdf);
  const renameBasePdf = useSettingsStore((s) => s.renameBasePdf);
  const deleteBasePdf = useSettingsStore((s) => s.deleteBasePdf);
  const setActiveBasePdfId = useSettingsStore((s) => s.setActiveBasePdfId);

  const [basePdfFilter, setBasePdfFilter] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDxfDialogOpen, setIsDxfDialogOpen] = useState(false);

  const handleUpload = async (file: File) => {
    const bytes = await file.arrayBuffer();
    const bytesArray = new Uint8Array(bytes);
    const doc = await PDFDocument.load(bytesArray);
    const pageCount = doc.getPageCount();

    addBasePdf({ name: file.name, bytes: bytesArray, pageCount });
    await applyBasePdfPageSize(bytesArray, formState.unit, handle);
  };

  const handleSelect = async (id: string) => {
    setActiveBasePdfId(id);
    const entry = basePdfs[id];
    if (entry) {
      await applyBasePdfPageSize(entry.bytes, formState.unit, handle);
    }
  };

  const basePdfEntries = Object.entries(basePdfs);

  const listFilter = useFilter({ sensitivity: "base" });

  const basePdfCollection = createListCollection({
    items: basePdfEntries.map(([id, data]) => ({
      value: id,
      label: data.name,
    })),
  });

  const displayedBasePdfs = basePdfCollection.items.filter((item) =>
    listFilter.contains(item.label, basePdfFilter),
  );

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameBasePdf(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <>
      <HowToUseAutoCutterDialog>
        <DialogTrigger asChild>
          <Link fontSize="sm" as="button" colorPalette="accent">
            How do I use this?
          </Link>
        </DialogTrigger>
      </HowToUseAutoCutterDialog>
      <Tooltip content="Generates a DXF based on your current layout for use with your cutting software">
        <Button
          variant="outline"
          size="sm"
          colorPalette="gray"
          type="button"
          onClick={() => setIsDxfDialogOpen(true)}
        >
          Export DXF...
        </Button>
      </Tooltip>
      <Field
        label="Base PDFs"
        helperText="Cards will be printed on top of the active base PDF. Page size is locked to its dimensions"
      >
        <VStack align="start" width="full">
          <CreateBasePdfDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
          <ExportCutlineDxfDialog
            open={isDxfDialogOpen}
            onOpenChange={setIsDxfDialogOpen}
          />
          <HStack>
            <FileUploadRoot
              maxFiles={1}
              accept={{ "application/pdf": [".pdf"] }}
              onFileChange={(details) => {
                const file = details.acceptedFiles[0];
                if (file) {
                  void handleUpload(file);
                }
              }}
            >
              <FileUploadTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  colorPalette="gray"
                  type="button"
                >
                  Upload PDF...
                </Button>
              </FileUploadTrigger>
            </FileUploadRoot>
            <Button
              variant="outline"
              size="sm"
              colorPalette="gray"
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create...
            </Button>
          </HStack>

          {activeBasePdfId && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="gray"
              alignSelf="flex-start"
              type="button"
              onClick={() => setActiveBasePdfId(null)}
            >
              Clear active base PDF
            </Button>
          )}

          <Listbox.Root
            collection={basePdfCollection}
            value={activeBasePdfId ? [activeBasePdfId] : undefined}
            onValueChange={({ value }) => void handleSelect(value[0])}
            visibility={basePdfEntries.length > 0 ? "visible" : "hidden"}
            width="full"
          >
            <Listbox.Label>Saved base PDFs</Listbox.Label>
            <Listbox.Input
              as={Input}
              placeholder="Type to filter base PDFs..."
              onChange={(e) => setBasePdfFilter(e.target.value)}
            />
            {displayedBasePdfs.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                No base PDFs found, adjust the filter
              </Text>
            ) : (
              <Listbox.Content>
                {displayedBasePdfs.map((item) =>
                  renamingId === item.value ? (
                    <Listbox.Item
                      key={item.value}
                      item={item}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HStack flex="1">
                        <Input
                          size="xs"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                        <IconButton
                          size="xs"
                          variant="ghost"
                          type="button"
                          aria-label="Confirm rename"
                          onClick={commitRename}
                        >
                          <LuSquareCheck />
                        </IconButton>
                      </HStack>
                    </Listbox.Item>
                  ) : (
                    <Listbox.Item key={item.value} item={item}>
                      <Listbox.ItemText lineClamp="1">
                        {item.label}
                      </Listbox.ItemText>
                      <Listbox.ItemIndicator />
                      <IconButton
                        size="xs"
                        variant="ghost"
                        type="button"
                        aria-label={`Rename "${item.label}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(item.value, item.label);
                        }}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        type="button"
                        aria-label={`Delete "${item.label}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBasePdf(item.value);
                        }}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </Listbox.Item>
                  ),
                )}
              </Listbox.Content>
            )}
          </Listbox.Root>
        </VStack>
      </Field>
    </>
  );
};
