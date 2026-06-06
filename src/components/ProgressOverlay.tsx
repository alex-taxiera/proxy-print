import { Center, VisuallyHidden } from "@chakra-ui/react";
import { useState, useEffect } from "react";

import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
} from "@/components/ui/dialog";
import {
  ProgressLabel,
  ProgressRoot,
  ProgressBar,
} from "@/components/ui/progress";

import { ProgressData, progressEvents } from "@/utils/progress-events";

export const ProgressOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState<number | null>(0);
  const [totalProgressAmount, setTotalProgressAmount] = useState(100);
  const [phase, setPhase] = useState("");

  useEffect(() => {
    const handleProgress = (data: ProgressData | void) => {
      if (data && typeof data === "object" && "progress" in data) {
        setProgress(data.progress);
        if (data.totalProgressAmount) {
          setTotalProgressAmount(data.totalProgressAmount);
        }
        if (data.phase) {
          setPhase(data.phase);
        }
        setIsVisible(true);
      }
    };

    const handleComplete = () => {
      setTimeout(() => {
        setIsVisible(false);
        setTotalProgressAmount(100);
        setProgress(0);
        setPhase("");
      }, 1000);
    };

    progressEvents.on("progress", handleProgress);
    progressEvents.on("complete", handleComplete);

    return () => {
      progressEvents.off("progress", handleProgress);
      progressEvents.off("complete", handleComplete);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <DialogRoot open={isVisible} size="sm">
      <DialogContent>
        <DialogHeader justifyContent="center">
          <DialogTitle marginBottom="4">Generating PDF</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <ProgressRoot
            colorPalette="accent"
            value={progress}
            max={totalProgressAmount}
          >
            <ProgressBar />
            <ProgressLabel marginTop="4" width="full">
              <VisuallyHidden>Generating PDF</VisuallyHidden>
              <Center margin="auto" fontWeight="semibold" color="fg.muted">
                {phase}
              </Center>
            </ProgressLabel>
          </ProgressRoot>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
};
