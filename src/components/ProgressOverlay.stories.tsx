import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Button } from "@/components/ui-old/button";

import { progressEvents } from "@/utils/progress-events";

import { ProgressOverlay } from "./ProgressOverlay";

const meta: Meta<typeof ProgressOverlay> = {
  title: "Components/ProgressOverlay",
  component: ProgressOverlay,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        className={css({
          p: "4",
          margin: "auto",
          width: "100%",
        })}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component to trigger progress events
const ProgressTrigger = ({
  phases = [
    "Initializing...",
    "Processing images...",
    "Generating PDF...",
    "Finalizing...",
  ],
  duration = 5000,
}: {
  phases?: string[];
  duration?: number;
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const startProgress = () => {
    if (isRunning) return;

    setIsRunning(true);

    let currentPhase = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 100 / (duration / 100);

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          progressEvents.emit("complete");
          setIsRunning(false);
        }, 1000);
      }

      // Update phase
      const phaseIndex = Math.floor((currentProgress / 100) * phases.length);
      if (phaseIndex < phases.length && phaseIndex !== currentPhase) {
        currentPhase = phaseIndex;
      }

      progressEvents.emit("progress", {
        progress: Math.min(currentProgress, 100),
        phase: phases[currentPhase],
        totalProgressAmount: 100,
      });
    }, 100);
  };

  return (
    <Button
      onClick={startProgress}
      loading={isRunning}
      loadingText="Generating..."
    >
      Start PDF Generation
    </Button>
  );
};

export const Default: Story = {
  render: () => {
    return (
      <>
        <ProgressOverlay />
        <ProgressTrigger />
      </>
    );
  },
};

export const DetailedProgress: Story = {
  render: () => {
    return (
      <>
        <ProgressOverlay />
        <ProgressTrigger
          phases={[
            "Initializing PDF generator...",
            "Loading image files...",
            "Processing image 1 of 5...",
            "Processing image 2 of 5...",
            "Processing image 3 of 5...",
            "Processing image 4 of 5...",
            "Processing image 5 of 5...",
            "Compressing images...",
            "Generating PDF document...",
            "Finalizing and saving...",
          ]}
          duration={8000}
        />
      </>
    );
  },
};

export const IndeterminateProgress: Story = {
  render: () => {
    const startIndeterminate = () => {
      progressEvents.emit("progress", {
        progress: null,
        phase: "Processing...",
      });

      setTimeout(() => {
        progressEvents.emit("complete");
      }, 6000);
    };

    return (
      <>
        <ProgressOverlay />
        <Button onClick={startIndeterminate}>
          Start Indeterminate Progress
        </Button>
      </>
    );
  },
};

export const CustomTotalAmount: Story = {
  render: () => {
    const startCustomProgress = () => {
      let progress = 0;
      const total = 250;
      const interval = setInterval(() => {
        progress += 10;

        if (progress >= total) {
          progress = total;
          clearInterval(interval);
          setTimeout(() => {
            progressEvents.emit("complete");
          }, 1000);
        }

        progressEvents.emit("progress", {
          progress,
          totalProgressAmount: total,
          phase: `Processing step ${Math.floor(progress / 25) + 1} of 10...`,
        });
      }, 200);
    };

    return (
      <>
        <ProgressOverlay />
        <Button onClick={startCustomProgress}>Start Custom Total (250)</Button>
      </>
    );
  },
};
