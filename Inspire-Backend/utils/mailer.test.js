import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { sendEmail } from './mailer.js'

const originalFetch = globalThis.fetch
const envKeys = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'EMAIL_USER',
    'EMAIL_PASS',
    'RESEND_API_KEY'
]
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

beforeEach(() => {
    for (const key of envKeys) delete process.env[key]
})

afterEach(() => {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
    }
})

test('sends multipart email through Gmail API ahead of a configured Resend key', async () => {
    process.env.GMAIL_CLIENT_ID = 'client-id'
    process.env.GMAIL_CLIENT_SECRET = 'client-secret'
    process.env.GMAIL_REFRESH_TOKEN = 'refresh-token'
    process.env.EMAIL_USER = 'inkspire@example.com'
    process.env.RESEND_API_KEY = 'unused-resend-key'

    const requests = []
    globalThis.fetch = async (url, options) => {
        requests.push({ url, options })
        if (url === 'https://oauth2.googleapis.com/token') {
            return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 })
        }
        if (url === 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send') {
            return new Response(JSON.stringify({ id: 'gmail-message-id' }), { status: 200 })
        }
        throw new Error(`Unexpected request: ${url}`)
    }

    const result = await sendEmail({
        to: 'writer@example.com',
        subject: 'Reset your Inkspire password',
        text: 'Choose a new password.',
        html: '<p>Choose a new password.</p>'
    })

    assert.equal(result.id, 'gmail-message-id')
    assert.equal(requests.length, 2)
    assert.match(requests[0].options.body.toString(), /grant_type=refresh_token/)
    assert.equal(requests[1].options.headers.Authorization, 'Bearer access-token')

    const { raw } = JSON.parse(requests[1].options.body)
    const mimeMessage = Buffer.from(raw, 'base64url').toString('utf8')
    assert.match(mimeMessage, /From: Inkspire <inkspire@example\.com>/)
    assert.match(mimeMessage, /To: writer@example\.com/)
    assert.match(mimeMessage, /Content-Type: text\/plain; charset=UTF-8/)
    assert.match(mimeMessage, /Content-Type: text\/html; charset=UTF-8/)
    assert.match(mimeMessage, /Q2hvb3NlIGEgbmV3IHBhc3N3b3JkLg==/)
    assert.match(mimeMessage, /PHA\+Q2hvb3NlIGEgbmV3IHBhc3N3b3JkLjwvcD4=/)
})

test('does not silently fall back when Gmail API OAuth configuration is incomplete', async () => {
    process.env.GMAIL_CLIENT_ID = 'client-id'
    process.env.RESEND_API_KEY = 'unused-resend-key'
    let requestCount = 0
    globalThis.fetch = async () => {
        requestCount += 1
        throw new Error('No provider request should be made')
    }

    await assert.rejects(
        sendEmail({
            to: 'writer@example.com',
            subject: 'Subject',
            text: 'Body',
            html: '<p>Body</p>'
        }),
        /GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, EMAIL_USER/
    )
    assert.equal(requestCount, 0)
})
