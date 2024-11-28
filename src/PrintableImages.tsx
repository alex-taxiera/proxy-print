import { useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import "./PrintableImages.css";

interface PrintableImagesProps {
  files: File[];
}

export const PrintableImages = ({ files }: PrintableImagesProps) => {
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
  });

  const imageMatrix = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < images.length; i += 9) {
      rows.push(images.slice(i, i + 9));
    }
    return rows;
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="printable-images">
      <button onClick={() => handlePrint()}>Print</button>
      <div ref={contentRef} className="print-container">
        {imageMatrix.map((row, pageIndex) => (
          <div className="page" key={pageIndex}>
            <span className="page-title">Page {pageIndex + 1}</span>
            <div className="card-grid">
              {row.map((src, index) => (
                <div key={index + src} className="image-container">
                  <img
                    src={src}
                    alt={`img-${pageIndex * 9 + index + 1}`}
                    className="image"
                  />
                  <div className="dot top-left"></div>
                  <div className="dot top-right"></div>
                  <div className="dot bottom-left"></div>
                  <div className="dot bottom-right"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
