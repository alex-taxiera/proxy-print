import { Button } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LuDownload } from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";

import { checkForUpdate, installUpdate } from "@/desktop/updater";
import { IS_DESKTOP } from "@/desktop/window";

/**
 * Shows nothing until the desktop app finds a newer release, then offers to
 * install it. A failed check (offline, no release published yet) stays quiet:
 * it isn't something the user can act on.
 */
export const UpdateButton = () => {
  const { data: update } = useQuery({
    queryKey: ["desktop", "update"],
    queryFn: checkForUpdate,
    // A dev build isn't a release; there is nothing to update it to.
    enabled: IS_DESKTOP && !import.meta.env.DEV,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { mutate: install, isPending } = useMutation({
    mutationFn: installUpdate,
    onError: (error) => {
      toaster.create({
        type: "error",
        title: "Couldn't install the update",
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (!update) {
    return null;
  }

  return (
    <Button
      size="xs"
      colorPalette="accent"
      loading={isPending}
      loadingText="Updating…"
      onClick={() => install(update)}
    >
      <LuDownload />
      Update to {update.version}
    </Button>
  );
};
