import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Download, FileText, Sparkles, X } from 'lucide-react';
import RfpPreviewContent from './rfpPreviewContent';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface rfpPreviewProps {
  logo?: string;
  companyName?: string;
  companyWebsite?: string;
  letterhead?: string;
  phone?: string;
  rfpTitle?: string;
  naicsCode?: string;
  solicitationNumber?: string;
  issuedDate?: string;
  submittedBy?: string;
  sections: { id: number; title: string; content: string }[];
  theme?: string;
  closeRfpBuilder: () => void;
}

const rfpPreview: React.FC<rfpPreviewProps> = ({
  logo,
  companyName,
  companyWebsite,
  letterhead,
  phone,
  rfpTitle,
  naicsCode,
  solicitationNumber,
  issuedDate,
  submittedBy,
  sections,
  theme,
  closeRfpBuilder,
}) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    try {
      const contentElement = contentRef.current;
      if (!contentElement) throw new Error('Content element not found');

      // Force a repaint to ensure content is rendered
      window.getComputedStyle(contentElement).height;

      // Create a PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
      });

      const pageWidth = 8.5;
      const pageHeight = 11;
      const scale = 1.5;
      const maxPageHeightPx = pageHeight * 96 * scale;

      // Get all section elements
      const sectionElements = Array.from(contentElement.querySelectorAll('div.section')) as HTMLElement[];
      if (sectionElements.length === 0) {
        throw new Error('No sections found in content');
      }

      let currentHeight = 0;
      let currentPageElements: HTMLElement[] = [];
      let pageIndex = 0;

      // Create a temporary container for rendering each page
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '0';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '8.5in';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-1000';
      document.body.appendChild(tempContainer);

      for (let i = 0; i < sectionElements.length; i++) {
        const section = sectionElements[i];
        const clonedSection = section.cloneNode(true) as HTMLElement;
        clonedSection.style.display = 'block';

        // Append to measure height
        tempContainer.appendChild(clonedSection);

        // Force a repaint
        const computedStyle = window.getComputedStyle(clonedSection);
        console.log(`Section ${i + 1} computed styles:`, {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          height: computedStyle.height,
        });

        const sectionHeightPx = clonedSection.offsetHeight * scale;
        if (sectionHeightPx === 0) {
          console.warn(`Section ${i + 1} has zero height, skipping.`);
          tempContainer.removeChild(clonedSection);
          continue;
        }

        console.log(`Section ${i + 1} height (px, scaled): ${sectionHeightPx}`);
        console.log(`Section ${i + 1} content:`, clonedSection.outerHTML);

        tempContainer.removeChild(clonedSection);

        if (currentHeight + sectionHeightPx > maxPageHeightPx && currentPageElements.length > 0) {
          tempContainer.innerHTML = '';
          currentPageElements.forEach(element => {
            tempContainer.appendChild(element);
          });

          // Force a repaint
          const firstElement = tempContainer.firstChild as HTMLElement;
          if (firstElement) {
            window.getComputedStyle(firstElement).height;
          }

          // Minimal delay to ensure rendering
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(tempContainer, {
            scale: scale,
            useCORS: true,
            logging: true,
            windowWidth: 816,
            windowHeight: 1056,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
          });

          console.log('Canvas dimensions for page', pageIndex + 1, ':', { width: canvas.width, height: canvas.height });

          const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
          console.log('Data URL length for page', pageIndex + 1, ':', dataUrl.length);

          let imgHeight = (canvas.height * pageWidth) / canvas.width;
          imgHeight = Math.min(imgHeight, pageHeight);

          console.log('Calculated imgHeight for page', pageIndex + 1, ':', imgHeight);

          if (!canvas.width || !canvas.height || !isFinite(imgHeight) || imgHeight <= 0) {
            console.error('Invalid canvas dimensions or imgHeight for page', pageIndex + 1, ':', {
              width: canvas.width,
              height: canvas.height,
              imgHeight,
            });
            tempContainer.innerHTML = '';
            currentPageElements = [];
            currentHeight = 0;
            pageIndex++;
            continue;
          }

          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');

          tempContainer.innerHTML = '';
          currentPageElements = [];
          currentHeight = 0;
          pageIndex++;
        }

        currentPageElements.push(clonedSection);
        currentHeight += sectionHeightPx;
      }

      if (currentPageElements.length > 0) {
        tempContainer.innerHTML = '';
        currentPageElements.forEach(element => {
          tempContainer.appendChild(element);
        });

        // Force a repaint
        const firstElement = tempContainer.firstChild as HTMLElement;
        if (firstElement) {
          window.getComputedStyle(firstElement).height;
        }

        // Minimal delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('Last page elements:', currentPageElements.map(el => el.outerHTML));
        console.log('Rendering last page with elements:', tempContainer.innerHTML);

        const canvas = await html2canvas(tempContainer, {
          scale: scale,
          useCORS: true,
          logging: true,
          windowWidth: 816,
          windowHeight: 1056,
          backgroundColor: '#ffffff',
          foreignObjectRendering: false,
        });

        console.log('Last page canvas dimensions:', { width: canvas.width, height: canvas.height });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        console.log('Last page data URL length:', dataUrl.length);

        let imgHeight = (canvas.height * pageWidth) / canvas.width;
        imgHeight = Math.min(imgHeight, pageHeight);

        console.log('Last page imgHeight:', imgHeight);

        if (!canvas.width || !canvas.height || !isFinite(imgHeight) || imgHeight <= 0) {
          console.error('Invalid canvas dimensions or imgHeight for last page:', {
            width: canvas.width,
            height: canvas.height,
            imgHeight,
          });
        } else {
          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');
        }
      }

      document.body.removeChild(tempContainer);

      pdf.save(`${rfpTitle || 'Proposal'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const downloadWord = async () => {
    let contentElement: HTMLDivElement | null = null;
    let originalStyles: { [key: string]: string } | null = null;

    try {
      contentElement = contentRef.current;
      if (!contentElement) throw new Error('Content element not found');

      originalStyles = {
        position: contentElement.style.position,
        left: contentElement.style.left,
        display: contentElement.style.display,
      };
      contentElement.style.position = 'fixed';
      contentElement.style.left = '0';
      contentElement.style.display = 'block';

      await new Promise((resolve) => setTimeout(resolve, 100));
      window.getComputedStyle(contentElement).height;

      const sectionElements = Array.from(contentElement.querySelectorAll('div.section')) as HTMLElement[];
      if (sectionElements.length === 0) {
        throw new Error('No sections found in content');
      }
      console.log('Section elements:', sectionElements.map(s => s.outerHTML));

      const alignmentMap: { [key: string]: typeof AlignmentType[keyof typeof AlignmentType] } = {
        center: AlignmentType.CENTER,
        left: AlignmentType.LEFT,
        right: AlignmentType.RIGHT,
        justify: AlignmentType.JUSTIFIED,
      };

      const underlineMap: { [key: string]: string } = {
        underline: 'single',
        none: 'none',
      };

      const paragraphs = sectionElements.flatMap((section, sectionIndex) => {
        const textElements = Array.from(section.querySelectorAll('h1, h2, h3, p, div.whitespace-pre-line')) as HTMLElement[];
        if (textElements.length === 0) return [];

        const sectionParagraphs: Paragraph[] = [];
        textElements.forEach((element) => {
          const computedStyle = window.getComputedStyle(element);
          const textAlign = computedStyle.textAlign || 'left';
          const fontWeight = computedStyle.fontWeight;
          const fontSize = parseFloat(computedStyle.fontSize) * 2;

          let color: string | undefined;
          const rawColor = computedStyle.color;
          const hexMatch = rawColor.match(/#([0-9a-f]{3,6})/i);
          if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3) {
              hex = hex.split('').map(char => char + char).join('');
            }
            color = hex.toUpperCase();
          } else if (rawColor.startsWith('rgb')) {
            const hex = rgbToHex(rawColor);
            color = hex || undefined;
          }

          const textDecoration = computedStyle.textDecorationLine || 'none';
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
          const spacingAfter = marginBottom * 20;

          let defaultFontSize = 20;
          let defaultBold = false;
          if (element.tagName === 'H1') {
            defaultFontSize = 24;
            defaultBold = true;
          } else if (element.tagName === 'H2') {
            defaultFontSize = 22;
            defaultBold = true;
          } else if (element.tagName === 'H3') {
            defaultFontSize = 20;
            defaultBold = true;
          }

          if (element.classList.contains('whitespace-pre-line')) {
            const lines = (element.textContent || '').split('\n').map(line => line.trim()).filter(line => line);
            lines.forEach((line) => {
              sectionParagraphs.push(
                new Paragraph({
                  alignment: alignmentMap[textAlign] || AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: line,
                      bold: fontWeight === 'bold' || parseInt(fontWeight) >= 700 || defaultBold,
                      size: isNaN(fontSize) ? defaultFontSize : fontSize,
                      font: 'Arial',
                      color: color && /^[0-9a-f]{6}$/i.test(color) ? color : undefined,
                      underline: underlineMap[textDecoration] ? { type: underlineMap[textDecoration] as any } : undefined,
                    }),
                  ],
                  spacing: { after: spacingAfter },
                })
              );
            });
          } else {
            sectionParagraphs.push(
              new Paragraph({
                alignment: alignmentMap[textAlign] || AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: element.textContent || '',
                    bold: fontWeight === 'bold' || parseInt(fontWeight) >= 700 || defaultBold,
                    size: isNaN(fontSize) ? defaultFontSize : fontSize,
                    font: 'Arial',
                    color: color && /^[0-9a-f]{6}$/i.test(color) ? color : undefined,
                    underline: underlineMap[textDecoration] ? { type: underlineMap[textDecoration] as any } : undefined,
                  }),
                ],
                spacing: { after: spacingAfter },
              })
            );
          }
        });

        return sectionParagraphs;
      });

      Object.assign(contentElement.style, originalStyles);

      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${rfpTitle || 'Proposal'}.docx`);
    } catch (error) {
      console.error('Word generation failed:', error);
      if (contentElement && originalStyles) {
        Object.assign(contentElement.style, originalStyles);
      }
      alert('Failed to generate Word document. Please try again.');
    }
  };

  const rgbToHex = (rgb: string): string | null => {
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
    if (!rgbMatch) return null;
  
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
  
    const toHex = (value: number) => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
  
    return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const enhanceWithAI = () => {
    console.log('Enhance with AI clicked');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start overflow-y-auto pt-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 relative">
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Proposal Preview</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-blue-600"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              {showDownloadOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100 overflow-hidden">
                  <button
                    onClick={downloadPDF}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500" /> Download as PDF
                  </button>
                  <button
                    onClick={downloadWord}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" /> Download as Word
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={enhanceWithAI}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow hover:from-purple-700 hover:to-purple-800"
            >
              <Sparkles className="w-4 h-4" /> Enhance with AI
            </button>
            <button
              onClick={closeRfpBuilder}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-8 min-h-screen bg-gray-50">
          <div ref={contentRef}>
            <RfpPreviewContent
              logo={logo}
              companyName={companyName}
              companyWebsite={companyWebsite}
              letterhead={letterhead}
              phone={phone}
              rfpTitle={rfpTitle}
              naicsCode={naicsCode}
              solicitationNumber={solicitationNumber}
              issuedDate={issuedDate}
              submittedBy={submittedBy}
              theme={theme}
              sections={sections}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default rfpPreview;