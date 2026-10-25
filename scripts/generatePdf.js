const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const mdPath = path.join(rootDir, 'PROJECT_DOCUMENTATION.md');
  const pdfPath = path.join(rootDir, 'PROJECT_DOCUMENTATION.pdf');

  console.log('Reading Markdown:', mdPath);
  if (!fs.existsSync(mdPath)) {
    throw new Error(`File not found: ${mdPath}`);
  }

  // Convert markdown to HTML using npx marked
  console.log('Parsing Markdown to HTML...');
  const htmlBody = execSync('npx -y marked -i "' + mdPath + '"', {
    cwd: rootDir,
    maxBuffer: 10 * 1024 * 1024,
  }).toString();

  const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TasksManager — Central Project Documentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-top: 0;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
      margin-top: 1.8em;
    }

    h3 {
      font-size: 11.5pt;
      margin-top: 1.3em;
    }

    p, ul, ol {
      margin-top: 0;
      margin-bottom: 0.8em;
    }

    ul, ol {
      padding-left: 20px;
    }

    li {
      margin-bottom: 0.3em;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8.8pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8.2pt;
      line-height: 1.45;
      margin-top: 0.6em;
      margin-bottom: 1em;
      page-break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    blockquote {
      margin: 0.8em 0;
      padding: 8px 14px;
      background-color: #f8fafc;
      border-left: 4px solid #3b82f6;
      color: #334155;
      font-size: 9.5pt;
      border-radius: 0 4px 4px 0;
    }

    blockquote p:last-child {
      margin-bottom: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.8em;
      margin-bottom: 1.2em;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #1e293b;
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1.8em 0;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.8pt;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

  const tempHtmlPath = path.join(rootDir, 'scripts', 'temp_doc.html');
  fs.writeFileSync(tempHtmlPath, styledHtml, 'utf-8');

  console.log('Launching Playwright Chromium...');
  const { chromium } = require(path.join(rootDir, 'client', 'node_modules', '@playwright/test'));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Rendering HTML to PDF...');
  await page.goto('file:///' + tempHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '14mm',
      right: '14mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: -apple-system, sans-serif; font-size: 8pt; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>TasksManager — Architecture &amp; System Documentation</span>
        <span>October 2026</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: -apple-system, sans-serif; font-size: 8pt; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
        <span>Confidential &amp; Proprietary</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  try {
    fs.unlinkSync(tempHtmlPath);
  } catch {}

  console.log('PDF generated successfully at:', pdfPath);
}

main().catch((err) => {
  console.error('PDF Generation Failed:', err);
  process.exit(1);
});
