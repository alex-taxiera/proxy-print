import { Button, VStack, Text, List } from "@chakra-ui/react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog";

import { ImportPreview } from "@/hooks/useTransfer";
import { formatCount } from "@/utils/pluralize";

type Props = {
  pending: ImportPreview | null;
  onConfirm: (options: { overwrite: boolean; applySettings: boolean }) => void;
  onCancel: () => void;
};

export const ImportBundleDialog = ({ pending, onConfirm, onCancel }: Props) => {
  const [overwrite, setOverwrite] = useState(false);
  const [applySettings, setApplySettings] = useState(false);

  const renamedPresets =
    pending?.presets.filter(
      (p) => pending.presetNameMap.get(p.name) !== p.name,
    ) ?? [];
  const renamedProjects =
    pending?.projects.filter(
      (p) => pending.projectNameMap.get(p.name) !== p.name,
    ) ?? [];

  return (
    <DialogRoot
      open={pending !== null}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Bundle</DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" marginTop="2">
            {pending && (
              <Text fontSize="sm">
                Found {formatCount(pending.presets.length, "preset")} and{" "}
                {formatCount(pending.projects.length, "project")}.
              </Text>
            )}
            {pending?.missingLocalImageCount ? (
              <Text fontSize="sm" color="orange.fg">
                {formatCount(
                  pending.missingLocalImageCount,
                  "local image was",
                  "local images were",
                )}{" "}
                not included in this bundle and will be skipped.
              </Text>
            ) : null}
            {(renamedPresets.length > 0 || renamedProjects.length > 0) &&
              !overwrite && (
                <VStack align="start" gap="1">
                  <Text fontSize="sm" color="fg.muted">
                    These names already exist and will be renamed:
                  </Text>
                  <List.Root fontSize="sm" color="fg.muted" paddingLeft="4">
                    {renamedPresets.map((p) => (
                      <List.Item key={`preset-${p.name}`}>
                        {p.name} → {pending?.presetNameMap.get(p.name)}
                      </List.Item>
                    ))}
                    {renamedProjects.map((p) => (
                      <List.Item key={`project-${p.name}`}>
                        {p.name} → {pending?.projectNameMap.get(p.name)}
                      </List.Item>
                    ))}
                  </List.Root>
                </VStack>
              )}
            {(renamedPresets.length > 0 || renamedProjects.length > 0) && (
              <Checkbox
                checked={overwrite}
                onCheckedChange={(details) =>
                  setOverwrite(details.checked === true)
                }
              >
                Replace existing instead of renaming
              </Checkbox>
            )}
            {pending?.settings && (
              <Checkbox
                checked={applySettings}
                onCheckedChange={(details) =>
                  setApplySettings(details.checked === true)
                }
              >
                Apply included print settings
              </Checkbox>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={() => onConfirm({ overwrite, applySettings })}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
