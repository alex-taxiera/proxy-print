import { RecipeVariantProps, sva } from "styled-system/css";

const guide = sva({
  slots: ["root", "horizontal", "vertical"],
  base: {
    root: {
      position: "absolute",
      display: "var(--guide-display)",
      zIndex: "1",
    },
    horizontal: {
      position: "absolute",
      height: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color)",
      backgroundImage:
        "repeating-linear-gradient(to right, var(--guide-border-color-inverted) 0, var(--guide-border-color-inverted) 2px, transparent 2px, transparent 4px)",
    },
    vertical: {
      position: "absolute",
      width: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color)",
      backgroundImage:
        "repeating-linear-gradient(to bottom, var(--guide-border-color-inverted) 0, var(--guide-border-color-inverted) 2px, transparent 2px, transparent 4px)",
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
          left: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          top: "calc(-1 * var(--bleed-edge-width))",
          left: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      topRight: {
        root: {
          top: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          top: "0",
          right: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          top: "calc(-1 * var(--bleed-edge-width))",
          right: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      bottomLeft: {
        root: {
          bottom: "var(--guide-corner-offset)",
          left: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          left: "calc(-1 *var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          bottom: "calc(-1 * var(--bleed-edge-width))",
          left: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      bottomRight: {
        root: {
          bottom: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          right: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          bottom: "calc(-1 * var(--bleed-edge-width))",
          right: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
    },
  },
});

export type GuideVariants = RecipeVariantProps<typeof guide>;

type GuideProps = NonNullable<GuideVariants>;

const Guide = ({ position = "topLeft" }: GuideProps) => {
  const styles = guide({ position });
  return (
    <div className={styles.root}>
      <div className={styles.horizontal} />
      <div className={styles.vertical} />
    </div>
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
