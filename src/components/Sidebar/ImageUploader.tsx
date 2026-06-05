import {
  Dialog,
  useFileUpload,
  type FileUploadFileAcceptDetails,
} from "@ark-ui/react";
import { useContext, useEffect, useState } from "react";

import { css } from "styled-system/css";
import { center, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui-old/button";
import { FileUpload } from "~/components/ui-old/file-upload";

import { DecklistDialog } from "~/components/DecklistDialog";

import {
  GoogleImageData,
  ImagesContext,
  LocalImageData,
  SlotInputData,
} from "~/context/ImagesContext";
import { useSettingsStore } from "~/store/settingsStore";
import { createFileHash } from "~/utils/create-file-hash";

import { XmlImportDialog, XmlImportPending } from "./XmlImportDialog";

type ParsedXmlUpload = {
  slots: SlotInputData[];
  defaultCardBack: GoogleImageData | null;
};

const parseCardSection = (
  xml: Document,
  sectionName: "fronts" | "backs",
  key: "front" | "back",
  slotMap: Map<number, SlotInputData>,
) => {
  const section = xml.querySelector(sectionName);
  const cards = section?.querySelectorAll("card");
  if (!cards) {
    return;
  }

  Array.from(cards).forEach((card) => {
    const id = card.querySelector("id")?.textContent?.trim();
    const name =
      card.querySelector("name")?.textContent?.trim() ?? `${sectionName}-card`;
    const slots = card
      .querySelector("slots")
      ?.textContent?.split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value));

    if (!id || !slots || slots.length === 0) {
      return;
    }

    slots.forEach((slotNumber) => {
      const existing = slotMap.get(slotNumber) ?? { front: null, back: null };
      slotMap.set(slotNumber, {
        ...existing,
        [key]: { id, name },
      });
    });
  });
};

const parseXML = (file: File): Promise<ParsedXmlUpload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(
        event.target?.result as string,
        "text/xml",
      );
      const slotMap = new Map<number, SlotInputData>();

      parseCardSection(xml, "fronts", "front", slotMap);
      parseCardSection(xml, "backs", "back", slotMap);

      if (slotMap.size === 0) {
        reject(new Error("No cards found in XML"));
        return;
      }

      const slots = Array.from(slotMap.entries())
        .sort(([slotA], [slotB]) => slotA - slotB)
        .map(([, slot]) => slot);

      const cardbackId = xml.querySelector("cardback")?.textContent?.trim();
      const defaultCardBack = cardbackId
        ? {
            id: cardbackId,
            name: "Default Card Back",
          }
        : null;

      resolve({
        slots,
        defaultCardBack,
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parseNonXmlFile = async (file: File): Promise<LocalImageData> => {
  const hash = await createFileHash(file);
  return { file, hash };
};

type ProcessFilesResult = {
  directAdds: LocalImageData[];
  xmlPending: XmlImportPending | null;
};

const processFiles = async (files: File[]): Promise<ProcessFilesResult> => {
  const xmlFiles = files.filter((file) => file.type === "text/xml");
  const nonXmlFiles = files.filter((file) => file.type !== "text/xml");
  const nonXmlFilesHashed = await Promise.all(nonXmlFiles.map(parseNonXmlFile));

  if (xmlFiles.length === 0) {
    return { directAdds: nonXmlFilesHashed, xmlPending: null };
  }

  const xmlFilesParsed = await Promise.all(xmlFiles.map(parseXML));
  const slotAdds = xmlFilesParsed.flatMap((parsed) => parsed.slots);
  const xmlDefaultCardBack =
    xmlFilesParsed.find((parsed) => parsed.defaultCardBack !== null)
      ?.defaultCardBack ?? null;

  return {
    directAdds: nonXmlFilesHashed,
    xmlPending: { slotAdds, xmlDefaultCardBack },
  };
};

export function ImageUploader() {
  const { onAdd, onAddSlots } = useContext(ImagesContext);
  const setDefaultCardBack = useSettingsStore((s) => s.setDefaultCardBack);
  const existingCardBack = useSettingsStore((s) => s.defaultCardBack);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pending XML import state
  const [xmlPending, setXmlPending] = useState<XmlImportPending | null>(null);
  const [updateDefaultCardBack, setUpdateDefaultCardBack] = useState(false);

  const onFileAccept = ({ files }: FileUploadFileAcceptDetails) => {
    setIsProcessing(true);
    processFiles(files)
      .then(({ directAdds, xmlPending: pending }) => {
        if (directAdds.length > 0) {
          onAdd(directAdds);
        }
        if (pending) {
          // Default the toggle: true when no existing card back, false otherwise
          setUpdateDefaultCardBack(
            pending.xmlDefaultCardBack !== null && existingCardBack === null,
          );
          setXmlPending(pending);
        }
      })
      .catch(console.error)
      .finally(() => setIsProcessing(false));
  };

  const handleXmlConfirm = () => {
    if (!xmlPending) return;
    // Set the card back in Zustand FIRST (synchronous) so that when onAddSlots
    // reads useSettingsStore.getState().defaultCardBack it sees the new value
    // and batches the card back download with the slot images in one wave.
    if (updateDefaultCardBack && xmlPending.xmlDefaultCardBack) {
      setDefaultCardBack(xmlPending.xmlDefaultCardBack);
    }
    onAddSlots(xmlPending.slotAdds);
    setXmlPending(null);
  };

  const handleXmlCancel = () => {
    setXmlPending(null);
  };

  const fileUpload = useFileUpload({
    maxFiles: Infinity,
    disabled: isProcessing,
    onFileAccept,
    accept: [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".xml"],
  });

  // hack to clear files after they are accepted
  const acceptedFiles = fileUpload.acceptedFiles;
  useEffect(() => {
    if (acceptedFiles.length > 0) {
      fileUpload.clearFiles();
    }
  }, [acceptedFiles, fileUpload]);

  return (
    <div
      className={vstack({ gap: "2", alignItems: "flex-start", width: "full" })}
    >
      <XmlImportDialog
        pending={xmlPending}
        hasExistingCardBack={existingCardBack !== null}
        updateDefaultCardBack={updateDefaultCardBack}
        onUpdateDefaultCardBackChange={setUpdateDefaultCardBack}
        onConfirm={handleXmlConfirm}
        onCancel={handleXmlCancel}
      />
      <FileUpload.RootProvider value={fileUpload}>
        <FileUpload.Trigger asChild>
          <FileUpload.Dropzone
            className={css({ cursor: "pointer" })}
            onClick={(e) => e.preventDefault()}
          >
            <FileUpload.Label className={center({ flexDirection: "column" })}>
              <span>{fileUpload.dragging ? "Drop!" : "Drop files here"}</span>
              <span
                className={css({
                  color: "fg.muted",
                  fontSize: "xs",
                  visibility: fileUpload.dragging ? "hidden" : "visible",
                })}
              >
                or click to browse
              </span>
            </FileUpload.Label>
          </FileUpload.Dropzone>
        </FileUpload.Trigger>
        <FileUpload.HiddenInput />
      </FileUpload.RootProvider>
      <DecklistDialog>
        <Dialog.Trigger asChild>
          <Button variant="link" size="xs" colorPalette="gray">
            Import from Decklist
          </Button>
        </Dialog.Trigger>
      </DecklistDialog>
    </div>
  );
}
