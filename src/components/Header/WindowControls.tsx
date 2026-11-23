import { ButtonGroup, IconButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuCopy, LuMinus, LuSquare, LuX } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";

import {
  closeWindow,
  isWindowMaximized,
  minimizeWindow,
  onWindowResized,
  toggleMaximizeWindow,
} from "@/desktop/window";

/** How long after the last resize event to re-read the maximized state. */
const RESIZE_SETTLES_MS = 100;

const run = (what: string, action: () => Promise<void>) => () => {
  action().catch((error: unknown) => {
    toaster.create({
      type: "error",
      title: `Couldn't ${what} the window`,
      description: error instanceof Error ? error.message : String(error),
    });
  });
};

/**
 * Minimize, maximize/restore and close, for windows whose native frame is off
 * (Windows and Linux). macOS keeps its own traffic lights.
 */
export const WindowControls = () => {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let current = true;
    let stop: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => {
      isWindowMaximized().then(
        (value) => {
          if (current) setMaximized(value);
        },
        () => {},
      );
    };
    // Snapping, Win+Up and double-clicking the bar all change this without
    // going through our button, so follow the window rather than the click.
    const settled = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, RESIZE_SETTLES_MS);
    };

    sync();
    onWindowResized(settled).then(
      (unlisten) => {
        if (current) stop = unlisten;
        else unlisten();
      },
      () => {},
    );

    return () => {
      current = false;
      clearTimeout(timer);
      stop?.();
    };
  }, []);

  return (
    <ButtonGroup
      gap="0"
      alignSelf="stretch"
      colorPalette="gray"
      variant="ghost"
      size="xs"
    >
      <IconButton
        height="full"
        width="11"
        borderRadius="none"
        aria-label="Minimize"
        onClick={run("minimize", minimizeWindow)}
      >
        <LuMinus />
      </IconButton>
      <IconButton
        height="full"
        width="11"
        borderRadius="none"
        aria-label={maximized ? "Restore" : "Maximize"}
        onClick={run(maximized ? "restore" : "maximize", toggleMaximizeWindow)}
      >
        {maximized ? <LuCopy /> : <LuSquare />}
      </IconButton>
      <IconButton
        height="full"
        width="11"
        borderRadius="none"
        aria-label="Close"
        _hover={{ bg: "red.solid", color: "red.contrast" }}
        onClick={run("close", closeWindow)}
      >
        <LuX />
      </IconButton>
    </ButtonGroup>
  );
};
