import { useState, useEffect } from "react";
import { ProgressData, progressEvents } from "../utils/progress-events";
import { Dialog } from "./ui/dialog";
import { center, visuallyHidden } from "../../styled-system/patterns";
import { Progress } from "./ui/progress";

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
    <Dialog.Root open={isVisible}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title className={center({ mb: "4" })}>
            Generating PDF
          </Dialog.Title>
          <Dialog.Description>
            <Progress
              showValue={false}
              value={progress}
              max={totalProgressAmount}
            >
              <span className={visuallyHidden()}>Generating PDF</span>
            </Progress>
            <span
              className={center({
                color: "fg.muted",
                fontSize: "xs",
                fontWeight: "semibold",
                mt: "1"
              })}
            >
              {phase}
            </span>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
