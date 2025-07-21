// Import jsPDF in the worker
importScripts('./jspdf.umd.js');

// PDF generation worker
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  if (type === 'generatePdf') {
    const { pages, settings, pageHeight, pageWidth, unit } = data;
    const { jsPDF } = self.jspdf
    
    try {
      const pdf = new jsPDF({
        orientation: pageWidth > pageHeight ? "l" : "p",
        unit: unit,
        format: [pageWidth, pageHeight],
      });

      const pdfOptions = {
        orientation: pageWidth > pageHeight ? "l" : "p",
        unit: unit,
        format: [pageWidth, pageHeight],
      };

      // Process pages in batches
      const batchSize = 4;
      let processedCount = 0;

      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        
        // Process each page in the batch
        for (let pageIndex = 0; pageIndex < batch.length; pageIndex++) {
          const pageData = batch[pageIndex];
          
          if (i + pageIndex !== 0) {
            pdf.addPage(pdfOptions.format, pdfOptions.orientation);
          }
          
          // Process cards on this page
          for (const cardData of pageData.cards) {
            const { imageDataUrl, pdfX, pdfY, containerWidth, containerHeight, scaleX, scaleY, cardPosition, guides } = cardData;
            
            // Add image to PDF
            if (imageDataUrl) {
              pdf.addImage(
                imageDataUrl,
                'JPEG',
                pdfX,
                pdfY,
                containerWidth * scaleX,
                containerHeight * scaleY
              );
            }
            
            // Add guides if needed
            if (guides && guides.enabled) {
              const pdfContainerWidth = containerWidth * scaleX;
              const pdfContainerHeight = containerHeight * scaleY;

              // Set line color and style
              pdf.setDrawColor(0, 0, 0); // Black for guides
              pdf.setLineWidth(guides.thickness);

              // Edge guides
              // Convert mm to PDF units (assuming PDF unit is inches, 1 inch = 25.4 mm)
              const bleedEdgeWidthPdf = guides.guidesAtBleedEdge ? 0 : guides.unit === 'in' ? guides.bleedEdgeWidth / 25.4 : guides.bleedEdgeWidth;
              // Crosshair size (4mm = 0.157 inches)
              const crosshairSize = bleedEdgeWidthPdf || (guides.unit === 'in' ? 1 / 25.4 : 1);
              
              // Calculate crosshair positions (at the edges of the card area - 63mm x 88mm)
              const topLeft = {
                x: pdfX + bleedEdgeWidthPdf,
                y: pdfY + bleedEdgeWidthPdf
              }
              const topRight = {
                x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
                y: pdfY + bleedEdgeWidthPdf
              }
              const bottomLeft = {
                x: pdfX + bleedEdgeWidthPdf,
                y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf
              }
              const bottomRight = {
                x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
                y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf
              }

              // Parse inverted guide color
              const invertedColorMatch = guides.invertedGuideColor.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
              if (invertedColorMatch) {
                const r = parseInt(invertedColorMatch[1], 16);
                const g = parseInt(invertedColorMatch[2], 16);
                const b = parseInt(invertedColorMatch[3], 16);
                pdf.setDrawColor(r, g, b);
              }

              // draw base crosshair with inverted color
              pdf.setLineWidth(guides.unit === 'in' ? guides.guidesThickness / 24.5 : guides.guidesThickness);

              // top left
              pdf.line(topLeft.x - crosshairSize, topLeft.y, topLeft.x + crosshairSize, topLeft.y);
              pdf.line(topLeft.x, topLeft.y - crosshairSize, topLeft.x, topLeft.y + crosshairSize);

              // top right
              pdf.line(topRight.x - crosshairSize, topRight.y, topRight.x + crosshairSize, topRight.y);
              pdf.line(topRight.x, topRight.y - crosshairSize, topRight.x, topRight.y + crosshairSize);
              
              // bottom left
              pdf.line(bottomLeft.x - crosshairSize, bottomLeft.y, bottomLeft.x + crosshairSize, bottomLeft.y);
              pdf.line(bottomLeft.x, bottomLeft.y - crosshairSize, bottomLeft.x, bottomLeft.y + crosshairSize);

              // bottom right
              pdf.line(bottomRight.x - crosshairSize, bottomRight.y, bottomRight.x + crosshairSize, bottomRight.y);
              pdf.line(bottomRight.x, bottomRight.y - crosshairSize, bottomRight.x, bottomRight.y + crosshairSize);
              
              // Parse guide color
              const guideColorMatch = guides.guideColor.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
              if (guideColorMatch) {
                const r = parseInt(guideColorMatch[1], 16);
                const g = parseInt(guideColorMatch[2], 16);
                const b = parseInt(guideColorMatch[3], 16);
                pdf.setDrawColor(r, g, b);
              }
              
              // Draw crosshairs with guide color centered on the crosshair
              pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
              pdf.line(topLeft.x - crosshairSize, topLeft.y, topLeft.x + crosshairSize, topLeft.y);
              pdf.line(topLeft.x, topLeft.y - crosshairSize, topLeft.x, topLeft.y + crosshairSize);
              
              // Draw crosshair at top-right corner
              pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
              pdf.line(topRight.x - crosshairSize, topRight.y, topRight.x + crosshairSize, topRight.y);
              pdf.line(topRight.x, topRight.y - crosshairSize, topRight.x, topRight.y + crosshairSize);
              
              // Draw crosshair at bottom-left corner
              pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
              pdf.line(bottomLeft.x - crosshairSize, bottomLeft.y, bottomLeft.x + crosshairSize, bottomLeft.y);
              pdf.line(bottomLeft.x, bottomLeft.y - crosshairSize, bottomLeft.x, bottomLeft.y + crosshairSize);
              
              // Draw crosshair at bottom-right corner
              pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
              pdf.line(bottomRight.x - crosshairSize, bottomRight.y, bottomRight.x + crosshairSize, bottomRight.y);
              pdf.line(bottomRight.x, bottomRight.y - crosshairSize, bottomRight.x, bottomRight.y + crosshairSize);
              
              pdf.setLineDashPattern([], 0); // reset line dash pattern
              pdf.setDrawColor(0, 0, 0); // Reset line color to black for subsequent lines
              
              // Draw edge guides that extend to page boundaries
              
              // Top edge guide (if first row)
              if (cardPosition.isFirstRow) {
                pdf.line(topLeft.x, 0, topLeft.x, topLeft.y - (crosshairSize));
                pdf.line(topRight.x, 0, topRight.x, topRight.y - (crosshairSize));
              }
              
              // Bottom edge guide (if last row)
              if (cardPosition.isLastRow) {
                pdf.line(bottomLeft.x, pageHeight, bottomLeft.x, bottomLeft.y + (crosshairSize));
                pdf.line(bottomRight.x, pageHeight, bottomRight.x, bottomRight.y + (crosshairSize));
              }
              
              // Left edge guide (if first column)
              if (cardPosition.isFirstColumn) {
                pdf.line(0, topLeft.y, topLeft.x - (crosshairSize), topLeft.y);
                pdf.line(0, bottomLeft.y, bottomLeft.x - (crosshairSize), bottomLeft.y);
              }
              
              // Right edge guide (if last column)
              if (cardPosition.isLastColumn) {
                pdf.line(pageWidth, topRight.y, topRight.x + (crosshairSize), topRight.y);
                pdf.line(pageWidth, bottomRight.y, bottomRight.x + (crosshairSize), bottomRight.y);
              }
            }
          }
        }

        processedCount += batch.length;
        
        // Report progress
        self.postMessage({
          type: 'progress',
          processed: processedCount,
          total: pages.length,
          percentage: Math.round((processedCount / pages.length) * 100)
        });
      }

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      
      // Send result back
      self.postMessage({
        type: 'complete',
        blob: pdfBlob
      }); // Remove transfer list to avoid structured clone error

    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
}; 
