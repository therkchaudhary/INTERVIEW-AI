const RESUME_PRINT_CSS = `
@page {
    size: A4;
    margin: 12mm 14mm;
}

* {
    box-sizing: border-box;
}

html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    font-family: "Segoe UI", Calibri, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.32;
    color: #1f2937;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.resume {
    width: 100%;
    max-width: 100%;
    padding: 0;
    margin: 0;
}

.resume * {
    max-width: 100% !important;
}

.resume [style*="box-shadow"],
.resume [style*="border-radius"],
.resume .card,
.resume .container {
    box-shadow: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}

.resume-header {
    text-align: center;
    margin-bottom: 8pt;
    padding-bottom: 6pt;
    border-bottom: 1.5pt solid #1d4ed8;
}

.resume-header h1 {
    font-size: 17pt;
    font-weight: 700;
    letter-spacing: 0.3pt;
    margin: 0 0 4pt 0;
    color: #111827;
}

.resume-contact {
    font-size: 8.5pt;
    color: #4b5563;
    line-height: 1.4;
}

.resume-contact a {
    color: #1d4ed8;
    text-decoration: none;
}

.resume h2,
.resume .section-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1d4ed8;
    text-transform: uppercase;
    letter-spacing: 0.35pt;
    margin: 9pt 0 4pt 0;
    padding-bottom: 2pt;
    border-bottom: 0.75pt solid #93c5fd;
    page-break-after: avoid;
}

.resume h3 {
    font-size: 10pt;
    font-weight: 600;
    margin: 5pt 0 2pt 0;
    color: #111827;
    page-break-after: avoid;
}

.resume p {
    margin: 0 0 3pt 0;
    font-size: 9.5pt;
}

.resume ul {
    margin: 2pt 0 5pt 0;
    padding-left: 14pt;
}

.resume li {
    margin-bottom: 2pt;
    font-size: 9.5pt;
}

.resume .entry-meta {
    font-size: 9pt;
    color: #6b7280;
    margin-bottom: 2pt;
}

.resume .skills-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 14pt;
    row-gap: 3pt;
    margin-bottom: 4pt;
}

.resume .skills-grid p,
.resume .skills-grid li {
    margin: 0;
    font-size: 9.5pt;
}

.resume .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 14pt;
}

.resume strong,
.resume b {
    font-weight: 600;
    color: #1e40af;
}

.resume section,
.resume .section {
    margin-bottom: 4pt;
    page-break-inside: avoid;
}

.resume .objective {
    font-size: 9.5pt;
    text-align: justify;
    margin-bottom: 2pt;
}
`

function extractResumeBody(html) {
    if (!html || typeof html !== "string") return ""

    let content = html.trim()

    const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    if (bodyMatch) content = bodyMatch[ 1 ]

    content = content
        .replace(/<!DOCTYPE[^>]*>/gi, "")
        .replace(/<\/?html[^>]*>/gi, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<\/?body[^>]*>/gi, "")
        .trim()

    return content
}

function wrapResumeHtml(fragmentHtml) {
    const body = extractResumeBody(fragmentHtml)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${RESUME_PRINT_CSS}</style>
</head>
<body>
    <div class="resume">
        ${body}
    </div>
</body>
</html>`
}

module.exports = { wrapResumeHtml }
