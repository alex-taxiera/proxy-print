import {
  defineSlotRecipe,
  useSlotRecipe,
  Box,
  RecipeVariantProps,
} from "@chakra-ui/react";

export const guide = defineSlotRecipe({
  slots: ["root", "horizontal", "vertical"],
  base: {
    root: {
      position: "absolute",
      display: "var(--guide-display)",
      zIndex: "1",
      // Arms run --length either side of the cut corner, matching pdf-spec.
      "--length": "var(--guide-length, var(--bleed-edge-width))",
      // pdf-spec draws guide-colored dashes of length/5 with length/4 gaps
      // over a solid inverted-color line, starting at the arm's start.
      "--dash": "calc(var(--length) / 5)",
      "--dash-period": "calc(var(--length) * 9 / 20)",
    },
    horizontal: {
      position: "absolute",
      height: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color-inverted)",
      backgroundImage:
        "repeating-linear-gradient(to right, var(--guide-border-color) 0, var(--guide-border-color) var(--dash), transparent var(--dash), transparent var(--dash-period))",
    },
    vertical: {
      position: "absolute",
      width: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color-inverted)",
      backgroundImage:
        "repeating-linear-gradient(to bottom, var(--guide-border-color) 0, var(--guide-border-color) var(--dash), transparent var(--dash), transparent var(--dash-period))",
    },
  },
  variants: {
    position: {
      topLeft: {
        root: {
          top: "var(--guide-corner-offset)",
          left: "var(--guide-corner-offset)",
        },
        horizontal: {
          top: "0",
          left: "calc(-1 * var(--length))",
          width: "calc(2 * var(--length))",
        },
        vertical: {
          top: "calc(-1 * var(--length))",
          left: "0",
          height: "calc(2 * var(--length))",
        },
      },
      topRight: {
        root: {
          top: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          top: "0",
          right: "calc(-1 * var(--length))",
          width: "calc(2 * var(--length))",
        },
        vertical: {
          top: "calc(-1 * var(--length))",
          right: "0",
          height: "calc(2 * var(--length))",
        },
      },
      bottomLeft: {
        root: {
          bottom: "var(--guide-corner-offset)",
          left: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          left: "calc(-1 * var(--length))",
          width: "calc(2 * var(--length))",
        },
        vertical: {
          bottom: "calc(-1 * var(--length))",
          left: "0",
          height: "calc(2 * var(--length))",
        },
      },
      bottomRight: {
        root: {
          bottom: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          right: "calc(-1 * var(--length))",
          width: "calc(2 * var(--length))",
        },
        vertical: {
          bottom: "calc(-1 * var(--length))",
          right: "0",
          height: "calc(2 * var(--length))",
        },
      },
    },
  },
});

export type GuideProps = RecipeVariantProps<typeof guide>;

const Guide = ({ position = "topLeft" }: GuideProps) => {
  const recipe = useSlotRecipe({ key: "guide" });
  const styles = recipe({ position });
  return (
    <Box css={styles.root}>
      <Box css={styles.horizontal} />
      <Box css={styles.vertical} />
    </Box>
  );
};

export const Guides = () => {
  return (
    <>
      <Guide position="topLeft" />
      <Guide position="topRight" />
      <Guide position="bottomLeft" />
      <Guide position="bottomRight" />
    </>
  );
};
