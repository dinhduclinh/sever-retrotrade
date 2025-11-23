const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

async function generatePDF({
  content,
  title = "Contract",
  outputDir = "./uploads/contracts/",
  returnBuffer = false,
  signatures = [],
}) {
  // Build HTML exact FE: <pre> content, <img absolute signatures>
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Times New Roman', Times, serif !important; 
          font-size: 14px !important; 
          line-height: 1.6 !important; 
          word-break: break-word !important; 
          hyphens: auto !important; 
          margin: 0; 
          padding: 50px; /* Exact FE container */
          background: white; 
          color: black; 
          width: 100%; 
          min-height: 100vh; 
          overflow: visible; 
          position: relative; /* Relative container for absolute signatures */
        }
        pre { 
          white-space: pre-wrap !important; 
          margin: 0; 
          padding: 0; 
          font-family: inherit !important; 
          font-size: inherit !important; 
          line-height: inherit !important; 
          word-break: inherit !important; 
          hyphens: inherit !important; 
          letter-spacing: 0.025em; /* tracking-wide */
          page-break-inside: avoid; /* Avoid break mid-line */
        }
        .signature-img { 
          position: absolute !important; /* Absolute to body for multi-page */
          object-fit: contain; 
          opacity: 0.8; 
          border: 2px solid #2563eb; /* blue-300 */
          border-radius: 0.5rem; /* rounded */
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-lg */
          pointer-events: none; 
          transform: translate(-50%, -50%) !important; 
          z-index: 20; 
          width: 128px !important; 
          height: 64px !important; 
          page-break-inside: avoid; /* Keep signature intact */
        }
        @media print { 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .signature-img { position: absolute; } /* Absolute per page on print */
        }
        @page { size: A4; margin: 50px; }
      </style>
    </head>
    <body>
      <pre>${escapeHtmlForPDF(content)}</pre>
      ${signatures
        .map(
          (sig, index) => `
        <img src="${sig.imageUrl}" alt="Signature ${
            index + 1
          }" class="signature-img" style="left: ${sig.positionX}%; top: ${
            sig.positionY
          }%;" />
      `
        )
        .join("")}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" }); 

  // căn lề pdf chính xác , chữ ký hiện đúng trên nhiều trang
  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "50px", right: "50px", bottom: "50px", left: "50px" }, 
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });

  await browser.close();

  if (returnBuffer) return pdfBuffer;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${uuidv4().slice(
    0,
    8
  )}.pdf`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}

function escapeHtmlForPDF(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { generatePDF };
