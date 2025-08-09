import { forwardRef } from "react";

import * as StyledProgress from "./styled/progress";

export interface ProgressProps extends StyledProgress.RootProps {
  /**
   * The type of progress to render.
   * @default linear
   */
  type?: "linear" | "circular";
  /**
   * Whether to show the value text.
   * @default true
   */
  showValue?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (props, ref) => {
    const {
      children,
      type = "linear",
      showValue = true,
      value,
      ...rootProps
    } = props;

    const isIndeterminate = value === null;

    return (
      <StyledProgress.Root ref={ref} value={value} {...rootProps}>
        {children && <StyledProgress.Label>{children}</StyledProgress.Label>}
        {type === "linear" && (
          <StyledProgress.Track>
            <StyledProgress.Range
              data-state={isIndeterminate ? "indeterminate" : undefined}
              style={isIndeterminate ? { width: "100%" } : undefined}
            />
          </StyledProgress.Track>
        )}
        {type === "circular" && (
          <StyledProgress.Circle>
            <StyledProgress.CircleTrack />
            <StyledProgress.CircleRange
              data-state={isIndeterminate ? "indeterminate" : undefined}
            />
            {showValue && <StyledProgress.ValueText />}
          </StyledProgress.Circle>
        )}
        {showValue && !isIndeterminate && <StyledProgress.ValueText />}
      </StyledProgress.Root>
    );
  },
);

Progress.displayName = "Progress";
