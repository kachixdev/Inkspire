import nodemailer from 'nodemailer'
import { config } from 'dotenv'
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

export async function sendEmail({ to, subject, html, text }) {
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
