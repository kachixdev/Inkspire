import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import nodemailer from 'nodemailer'
import { sendEmail } from './mailer.js'

const originalCreateTransport = nodemailer.createTransport
const envKeys = ['EMAIL_USER', 'EMAIL_PASS']
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

beforeEach(() => {
    for (const key of envKeys) delete process.env[key]
})

afterEach(() => {
    nodemailer.createTransport = originalCreateTransport
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
    }
})

test('sends account email through Gmail SMTP with an App Password', async () => {
    process.env.EMAIL_USER = 'inkspire@gmail.com'
    process.env.EMAIL_PASS = 'test-app-password'

    let transportOptions
    let sentMessage
    nodemailer.createTransport = (options) => {
        transportOptions = options
        return {
            sendMail: async (message) => {
                sentMessage = message
                return { messageId: 'gmail-message-id' }
            }
        }
    }

    const result = await sendEmail({
        to: 'writer@example.com',
        subject: 'Reset your Inkspire password',
        text: 'Choose a new password.',
        html: '<p>Choose a new password.</p>'
    })

    assert.equal(result.messageId, 'gmail-message-id')
    assert.deepEqual(transportOptions, {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'inkspire@gmail.com',
            pass: 'test-app-password'
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    })
    assert.deepEqual(sentMessage, {
        from: '"Inkspire" <inkspire@gmail.com>',
        to: 'writer@example.com',
        subject: 'Reset your Inkspire password',
        text: 'Choose a new password.',
        html: '<p>Choose a new password.</p>'
    })
})

test('requires Gmail credentials before attempting email delivery', async () => {
    let transportCreated = false
    nodemailer.createTransport = () => {
        transportCreated = true
        throw new Error('No SMTP connection should be created')
    }

    await assert.rejects(
        sendEmail({
            to: 'writer@example.com',
            subject: 'Subject',
            text: 'Body',
            html: '<p>Body</p>'
        }),
        /EMAIL_USER, EMAIL_PASS/
    )
    assert.equal(transportCreated, false)
})

test('surfaces SMTP authentication errors', async () => {
    process.env.EMAIL_USER = 'inkspire@gmail.com'
    process.env.EMAIL_PASS = 'test-app-password'
    nodemailer.createTransport = () => ({
        sendMail: async () => {
            const error = new Error('Authentication failed')
            error.code = 'EAUTH'
            throw error
        }
    })

    await assert.rejects(
        sendEmail({
            to: 'writer@example.com',
            subject: 'Subject',
            text: 'Body',
            html: '<p>Body</p>'
        }),
        (error) => error.code === 'EAUTH'
    )
})
