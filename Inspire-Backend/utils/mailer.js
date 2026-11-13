import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
config()

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
})

async function sendWithResend({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM
    if (!from) {
        throw new Error('EMAIL_FROM must be set when using Resend.')
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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

function getGmailApiConfiguration() {
    const configKeys = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN']
    const hasGmailApiConfiguration = configKeys.some((key) => process.env[key])

    if (!hasGmailApiConfiguration) return null

    const missingKeys = configKeys.filter((key) => !process.env[key])
    if (!process.env.EMAIL_USER) missingKeys.push('EMAIL_USER')
    if (missingKeys.length > 0) {
        throw new Error(`Gmail API email is missing required environment variables: ${missingKeys.join(', ')}.`)
    }

    return {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        user: process.env.EMAIL_USER
    }
}

async function getGmailAccessToken({ clientId, clientSecret, refreshToken }) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    })
    const responseBody = await response.text()

    if (!response.ok) {
        const error = new Error(`Google OAuth rejected the token refresh (${response.status}): ${responseBody.slice(0, 500)}`)
        error.statusCode = response.status
        throw error
    }

    const token = responseBody ? JSON.parse(responseBody) : {}
    if (!token.access_token) {
        throw new Error('Google OAuth did not return an access token.')
    }

    return token.access_token
}

function assertHeaderValue(value, label) {
    if (typeof value !== 'string' || !value || /[\r\n]/.test(value)) {
        throw new Error(`${label} must be a non-empty value without line breaks.`)
    }
    return value
}

function encodeMimePart(value) {
    const encoded = Buffer.from(value, 'utf8').toString('base64')
    return encoded.match(/.{1,76}/g)?.join('\r\n') || ''
}

function createGmailRawMessage({ to, subject, html, text, from }) {
    const recipient = assertHeaderValue(to, 'Email recipient')
    const sender = assertHeaderValue(from, 'Gmail sender')
    const safeSubject = assertHeaderValue(subject, 'Email subject')
    const boundary = `inkspire-${randomUUID()}`
    const message = [
        `From: Inkspire <${sender}>`,
        `To: ${recipient}`,
        `Subject: =?UTF-8?B?${Buffer.from(safeSubject, 'utf8').toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodeMimePart(text),
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodeMimePart(html),
        `--${boundary}--`,
        ''
    ].join('\r\n')

    return Buffer.from(message, 'utf8').toString('base64url')
}

async function sendWithGmailApi({ to, subject, html, text }, gmailConfig) {
    const accessToken = await getGmailAccessToken(gmailConfig)
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            raw: createGmailRawMessage({
                to,
                subject,
                html,
                text,
                from: gmailConfig.user
            })
        })
    })
    const responseBody = await response.text()

    if (!response.ok) {
        const error = new Error(`Gmail API rejected the email (${response.status}): ${responseBody.slice(0, 500)}`)
        error.statusCode = response.status
        throw error
    }

    return responseBody ? JSON.parse(responseBody) : {}
}

export async function sendEmail({ to, subject, html, text }) {
    const gmailConfig = getGmailApiConfiguration()
    if (gmailConfig) {
        return sendWithGmailApi({ to, subject, html, text }, gmailConfig)
    }

    if (process.env.RESEND_API_KEY) {
        return sendWithResend({ to, subject, html, text })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email is not configured. Set RESEND_API_KEY and EMAIL_FROM, or EMAIL_USER and EMAIL_PASS.')
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
    })
}
