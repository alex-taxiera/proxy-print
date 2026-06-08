import { Box, Button } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { progressEvents } from "@/utils/progress-events";

import { ProgressOverlay } from "./ProgressOverlay";

const meta: Meta<typeof ProgressOverlay> = {
  title: "Components/ProgressOverlay",
  component: ProgressOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Box padding="4" margin="auto" width="100%">
        <Story />
      </Box>
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
