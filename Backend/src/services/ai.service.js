const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer-core")
const chromium = require("@sparticuz/chromium")
const { wrapResumeHtml } = require("../utils/resumePdf.template")

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

function getFriendlyAiErrorMessage(err) {
    const status = err?.status ?? err?.code
    const raw = err?.message || String(err)

    if (status === 429 || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
        return "The AI service rate limit was reached. Wait about a minute and try again, or use a Google AI API key with available quota (https://aistudio.google.com/apikey)."
    }

    if (raw.includes("GOOGLE_GENAI_API_KEY")) {
        return "AI API key is not configured on the server."
    }

    if (raw.trim().startsWith("{")) {
        try {
            const parsed = JSON.parse(raw)
            const nested = parsed?.error?.message
            if (nested) return getFriendlyAiErrorMessage({ message: nested, status: parsed?.error?.code })
        } catch {
            // ignore parse errors
        }
        return "AI service could not generate a response. Please try again in a minute."
    }

    if (raw.length > 200) {
        return "AI service could not generate a response. Please try again later."
    }

    return raw
}

function wrapAiError(err) {
    const friendly = getFriendlyAiErrorMessage(err)
    const error = new Error(friendly)
    const status = err?.status ?? err?.code
    if (status === 429 || String(err?.message).includes("RESOURCE_EXHAUSTED")) {
        error.statusCode = 429
    } else {
        error.statusCode = 503
    }
    return error
}

async function generateContent(ai, request) {
    try {
        return await ai.models.generateContent({
            model: GEMINI_MODEL,
            ...request,
        })
    } catch (err) {
        throw wrapAiError(err)
    }
}

function createAiClient() {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("GOOGLE_GENAI_API_KEY is not configured")
    }
    return new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENAI_API_KEY
    })
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const ai = createAiClient()

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await generateContent(ai, {
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function launchBrowser() {
    return puppeteer.launch({
        args: [ ...chromium.args, "--hide-scrollbars", "--disable-web-security" ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    })
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await launchBrowser()
    const page = await browser.newPage()
    const documentHtml = wrapResumeHtml(htmlContent)

    await page.emulateMediaType("print")
    await page.setContent(documentHtml, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: "12mm",
            bottom: "12mm",
            left: "14mm",
            right: "14mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const ai = createAiClient()

    const resumePdfSchema = z.object({
        html: z.string().describe("Resume body HTML fragment only (no html/head/body tags). Use the structure and classes described in the prompt.")
    })

    const prompt = `Create a tailored, ATS-friendly resume as an HTML FRAGMENT (inner body content only — do NOT include <html>, <head>, or <body> tags).

Candidate resume text: ${resume}
Self description: ${selfDescription}
Target job description: ${jobDescription}

STRICT LAYOUT RULES (styling is applied by our PDF template — follow structure exactly):
1. Wrap everything in this structure:
   <header class="resume-header">
     <h1>Full Name</h1>
     <p class="resume-contact">email | phone | LinkedIn URL | City, Country</p>
   </header>
   <section><h2>Professional Summary</h2><p class="objective">2-3 concise lines max.</p></section>
   <section><h2>Technical Skills</h2><div class="skills-grid">...</div></section>
   <section><h2>Experience</h2>...</section>
   <section><h2>Projects</h2>...</section>
   <section><h2>Education</h2>...</section>
   <section><h2>Certifications</h2><ul>...</ul></section>

2. LENGTH: Content MUST fit on 1-2 A4 pages when printed. Be concise:
   - Max 2-3 lines for summary
   - Max 6 skill lines in skills-grid (two columns)
   - Max 2 roles in Experience, 3 bullets each
   - Max 2 projects, 2 bullets each
   - Education: one line per degree (degree | school | year | grade)
   - Max 5 certification bullets

3. DO NOT use: box-shadow, cards, wide margins, padding wrappers, centered page containers, or inline width/margin styles.
4. DO NOT use <hr> tags. Section titles must be <h2> only.
5. Use <strong> only for key skills/terms inside bullets (sparingly).
6. Use <h3> for job titles and project names. Use <p class="entry-meta"> for dates/location lines.
7. Sound human and professional — not AI-generated.

Return JSON: { "html": "<fragment here>" }`

    const response = await generateContent(ai, {
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }