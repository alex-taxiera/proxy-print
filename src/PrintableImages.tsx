import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

interface PrintableImagesProps {
  files: File[];
}

export const PrintableImages = ({ files }: PrintableImagesProps) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages(imageUrls);
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: "cards",
    contentRef: printRef,
  });

  const renderGrid = (images: string[]) => {
    const rows = [];
    for (let i = 0; i < images.length; i += 9) {
      rows.push(
        <div className="page" key={i}>
          <span className="page-title">Page {i / 9 + 1}</span>
          <div className="card-grid">
            {images.slice(i, i + 9).map((src, index) => (
              <div key={index} className="image-container">
                <img src={src} alt={`img-${index}`} className="image" />
                <div className="dot top-left"></div>
                <div className="dot top-right"></div>
                <div className="dot bottom-left"></div>
                <div className="dot bottom-right"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return rows;
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="printable-images">
      <button onClick={() => handlePrint()}>Print</button>
      <div ref={printRef} className="print-container">
        {renderGrid(images)}
      </div>
      <style>{`
      .printable-images {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
        .print-container {
          display: block;
        }
        .page {
          height: 11in;
          width: 8.5in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, 2.5in);
          grid-template-rows: repeat(3, 3.5in);
          page-break-after: always;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .image-container {
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 2.5in;
          height: 3.5in;
        }
        .image {
          width: 2.625in;
          height: 3.625in;
          object-fit: cover;
        }
        .dot {
          position: absolute;
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
          display: none;
        }
        .dot.top-left {
          top: -2.5px;
          left: -2.5px;
        }
        .dot.top-right {
          top: -2.5px;
          right: -2.5px;
        }
        .dot.bottom-left {
          bottom: -2.5px;
          left: -2.5px;
        }
        .dot.bottom-right {
          bottom: -2.5px;
          right: -2.5px;
        }
        @media print {
          .dot {
            display: block;
          }
          .page-title {
             display: none;
          }
        }
      `}</style>
    </div>
  );
};
