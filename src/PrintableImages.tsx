import { useContext, useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import "./PrintableImages.css";
import { SettingsContext } from "./SettingsContext";

interface PrintableImagesProps {
  files: File[];
}

export const PrintableImages = ({
  files,
}: PrintableImagesProps) => {
  const { cssVars } = useContext(SettingsContext);

  console.log('cssVars :', cssVars)
  const images = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      images.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: "cards",
    contentRef,
    bodyClass: 'reee',
    preserveAfterPrint: true,
  });

  const imageMatrix = useMemo(() => {
    if (images.length === 0) {
      return [];
    }

    const rows: string[][] = [];
    for (let i = 0; i < images.length; i += 9) {
      rows.push(images.slice(i, i + 9));
    }
    const paddingItems = rows.at(-1)!.length % 9;
    if (paddingItems > 0) {
      const filler = Array.from({ length: 9 - paddingItems }).fill("") as string[];
      rows.at(-1)!.push(...filler);
    }
    return rows;
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="printable-images" style={cssVars}>
      <button onClick={() => handlePrint()}>Print</button>
      <div ref={contentRef} className="print-container">
        {imageMatrix.map((row, pageIndex) => (
          <div className="page" key={pageIndex}>
            <div className="card-grid">
              {row.map((src, index) => (
                <div key={index + src} className="card">
                  <div className="image-container">
                    {src ? (
                      <img
                        src={src}
                        alt={`img-${pageIndex * 9 + index + 1}`}
                        className="image"
                      />
                    ) : (
                      <span className="empty" />
                    )}
                  </div>
                  <div className="guide top-left"></div>
                  <div className="guide top-right"></div>
                  <div className="guide bottom-left"></div>
                  <div className="guide bottom-right"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
