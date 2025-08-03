import { ComponentProps } from "react";
import * as Toast from "./styled/toast";
import { Toaster } from "./styled/toast";
import { IconButton } from "./icon-button";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Progress } from "./progress";

type ToastOptions = Parameters<ComponentProps<typeof Toaster>["children"]>[0];

export type AlertToastProps = {
  toast: ToastOptions;
};

export type ProgressMeta = {
  progress: number | null;
  totalProgressAmount?: number;
};

const isProgressMeta = (meta: ToastOptions["meta"]): meta is ProgressMeta => {
  return !!meta && "progress" in meta;
};

export const AlertToast = ({ toast }: AlertToastProps) => {
  return (
    <Toast.Root key={toast.id}>
      {isProgressMeta(toast.meta) && (
        <Progress
          type="circular"
          showValue={false}
          size="sm"
          value={toast.meta.progress}
          max={toast.meta.totalProgressAmount ?? 100}
          gridArea="progress"
        />
      )}
      <Toast.Title>{toast.title}</Toast.Title>
      <Toast.Description>{toast.description}</Toast.Description>
      {toast.closable !== false && (
        <Toast.CloseTrigger asChild>
          <IconButton aria-label="Dismiss" size="xs">
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </IconButton>
        </Toast.CloseTrigger>
      )}
    </Toast.Root>
  );
};

export * as Toast from "./styled/toast";
export { createToaster, Toaster } from "./styled/toast";
