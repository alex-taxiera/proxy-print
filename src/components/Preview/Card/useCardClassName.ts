import { css, cx, Styles } from "styled-system/css";

import { useCardPositionMeta } from "@/hooks/useCardClassNames";

export const useCardClassName = (props: {
  isEmpty: boolean;
  isPending: boolean;
  index: number;
  isDragging: boolean;
}) => {
  const { isEmpty, isPending, index, isDragging } = props;
  const positions = useCardPositionMeta();
  const beforeAfterBase: Styles = {
    pointerEvents: "none",
    display: isDragging ? "none" : "var(--guide-display)",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "0",
  };

  const highlightStyles: Styles = {
    outlineWidth: "4",
    outlineColor: "colorPalette.default",
    outlineStyle: "solid",
    zIndex: "1",
  };

  const classes: string[] = [
    "card",
    "group",
    css({
      position: "relative",
      transition: "outline-color 0.1s ease-in-out",
      outlineColor: "transparent",
      "--horizontal-guide-length":
        "calc(calc(var(--page-width) - calc(var(--item-width) * var(--columns-per-page))) / 2)",
      "--vertical-guide-length":
        "calc(calc(var(--page-height) - calc(var(--item-height) * var(--rows-per-page))) / 2)",
      _before: beforeAfterBase,
      _after: beforeAfterBase,
    }),
  ];

  if (isDragging) {
    classes.push(css({ opacity: 0.5 }));
  }

  if (!isEmpty && !isPending) {
    classes.push(
      css({
        _focusVisible: highlightStyles,
        _hover: highlightStyles,
      }),
    );
  }

  const { isFirstColumn, isFirstRow, isLastColumn, isLastRow } =
    positions[index];

  if (isFirstColumn) {
    classes.push(
      css({
        _before: {
          content: '""',
          position: "absolute",
          width: "var(--horizontal-guide-length)",
          right: "100%",
          top: "var(--guide-corner-offset)",
          bottom: "var(--guide-corner-offset)",
          borderTopWidth: "var(--guide-border-width)",
          borderBottomWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isFirstRow) {
    classes.push(
      css({
        _after: {
          content: '""',
          position: "absolute",
          height: "var(--vertical-guide-length)",
          bottom: "100%",
          left: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
          borderLeftWidth: "var(--guide-border-width)",
          borderRightWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isLastColumn) {
    classes.push(
      css({
        _before: {
          content: '""',
          position: "absolute",
          width: "var(--horizontal-guide-length)",
          left: "100%",
          top: "var(--guide-corner-offset)",
          bottom: "var(--guide-corner-offset)",
          borderTopWidth: "var(--guide-border-width)",
          borderBottomWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isLastRow) {
    classes.push(
      css({
        _after: {
          content: '""',
          position: "absolute",
          height: "var(--vertical-guide-length)",
          top: "100%",
          left: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
          borderLeftWidth: "var(--guide-border-width)",
          borderRightWidth: "var(--guide-border-width)",
        },
      }),
    );
  }

  return cx(...classes);
};
