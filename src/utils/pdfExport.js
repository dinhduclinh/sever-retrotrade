const playwright = require("playwright");
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
  const footerIndex = content.toLowerCase().indexOf("<table");
  let mainContent = content;
  let footerContent = "";

  if (footerIndex !== -1) {
    mainContent = content.substring(0, footerIndex);
    footerContent = content.substring(footerIndex);
  }

  const escapeHtmlForPDF = (text) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

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
      padding: 50px; 
      background: white; 
      color: black; 
      position: relative;
      min-height: 100vh;
      overflow: visible;
    }
    pre { 
      white-space: pre-wrap !important; 
      margin: 0; 
      padding: 0; 
      font-family: inherit !important; 
      font-size: inherit !important; 
      line-height: inherit !important; 
      letter-spacing: 0.025em;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      max-width: 800px;
      border-collapse: collapse;
      margin-top: 150px;
    }
    td {
      width: 50%;
      text-align: left;
      vertical-align: top;
      padding: 0;
    }
    strong {
      display: block;
      margin-bottom: 10px;
    }
    .overlay-signature {
      position: absolute;
      object-fit: contain;
      width: 150px;
      height: auto;
      pointer-events: none;
    }
    @page { 
      size: A4; 
      margin: 50px; 
    }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <pre>${escapeHtmlForPDF(mainContent)}</pre>
  ${footerContent}
  ${signatures
    .map(
      (sig) => `
    <img src="${sig.imageUrl}" class="overlay-signature" style="left: ${sig.positionX}%; top: ${sig.positionY}%;" />
  `
    )
    .join("")}
</body>
</html>
`;

process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
  const browser = await playwright.chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "50px", right: "50px", bottom: "50px", left: "50px" },
    printBackground: true,
  });

  await browser.close();

  if (returnBuffer) return pdfBuffer;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${uuidv4().slice(
    0,
    8
  )}.pdf`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, pdfBuffer);

  return filePath;
}

module.exports = { generatePDF };
