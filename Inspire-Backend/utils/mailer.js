import { config } from 'dotenv'
config()

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

function getResendConfiguration() {
    const configKeys = ['RESEND_API_KEY', 'EMAIL_FROM']
    const missingKeys = configKeys.filter((key) => !process.env[key])

    if (missingKeys.length > 0) {
        const error = new Error(`Resend email is missing required environment variables: ${missingKeys.join(', ')}.`)
        error.code = 'EMAIL_CONFIGURATION_MISSING'
        throw error
    }

    return {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM
    }
}

export async function sendEmail({ to, subject, html, text }) {
    const { apiKey, from } = getResendConfiguration()
    const response = await fetch(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from, to: [to], subject, html, text })
    })
    const responseBody = await response.text()

    if (!response.ok) {
        const error = new Error(`Resend rejected the email (${response.status}): ${responseBody.slice(0, 500)}`)
        error.statusCode = response.status
        throw error
    }

    return responseBody ? JSON.parse(responseBody) : {}
}
