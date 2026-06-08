"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  ToastOptions,
  createToaster,
} from "@chakra-ui/react";

import {
  ProgressCircleRoot,
  ProgressCircleRing,
} from "@/components/ui/progress-circle";

export const toaster = createToaster({
  placement: "bottom-start",
  pauseOnPageIdle: true,
});

export type ProgressMeta = {
  progress: number | null;
  totalProgressAmount?: number;
};

const isProgressMeta = (meta: ToastOptions["meta"]): meta is ProgressMeta => {
  return !!meta && "progress" in meta;
};

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {isProgressMeta(toast.meta) ? (
              <ProgressCircleRoot
                value={toast.meta.progress}
                max={toast.meta.totalProgressAmount ?? 100}
                size="sm"
              >
                <ProgressCircleRing />
              </ProgressCircleRoot>
            ) : toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
