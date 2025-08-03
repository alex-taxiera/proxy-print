import { Alert } from "./ui/alert";

export type TruncatedPreviewWarningProps = {
  maxPages: number;
  totalPages: number;
};

export const TruncatedPreviewWarning = ({
  maxPages,
  totalPages,
}: TruncatedPreviewWarningProps) => {
  if (totalPages <= maxPages) {
    return null;
  }

  return (
    <Alert.Root status="info">
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Preview is Limited</Alert.Title>
        <Alert.Description className="description">
          Only the first {maxPages} pages are visible in the preview. The
          complete document contains {totalPages} total pages.
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
};
