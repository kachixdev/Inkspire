import nodemailer from 'nodemailer'
import { config } from 'dotenv'
config()

function getGmailSmtpConfiguration() {
    const configKeys = ['EMAIL_USER', 'EMAIL_PASS']
    const missingKeys = configKeys.filter((key) => !process.env[key])

    if (missingKeys.length > 0) {
        const error = new Error(`Gmail SMTP email is missing required environment variables: ${missingKeys.join(', ')}.`)
        error.code = 'EMAIL_CONFIGURATION_MISSING'
        throw error
    }

    return {
        user: process.env.EMAIL_USER,
        appPassword: process.env.EMAIL_PASS
    }
}

export async function sendEmail({ to, subject, html, text }) {
    const { user, appPassword } = getGmailSmtpConfiguration()
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user,
            pass: appPassword
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    })

    return transporter.sendMail({
        from: `"Inkspire" <${user}>`,
        to,
        subject,
        html,
        text
    })
}
