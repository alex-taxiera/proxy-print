import { vstack } from "styled-system/patterns";

import { Link } from "@/components/ui-old/link";

export const Empty = () => {
  return (
    <div
      className={vstack({
        paddingY: "6",
        paddingX: "2",
        gap: "6",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        height: "full",
      })}
    >
      <p>Add images to get started.</p>
      <p>
        Upload an XML from{" "}
        <Link asChild>
          <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
            MPC Autofill
          </a>
        </Link>{" "}
        &quot;Download XML&quot; option.
      </p>
      <p>Or import a decklist from your favorite deckbuilder!</p>
    </div>
  );
};
