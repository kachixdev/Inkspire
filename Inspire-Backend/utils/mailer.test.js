import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { sendEmail } from './mailer.js'

const originalFetch = globalThis.fetch
const envKeys = ['RESEND_API_KEY', 'EMAIL_FROM']
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

test('sends account email through the Resend HTTPS API', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.EMAIL_FROM = 'Inkspire <hello@example.com>'

    let request
    globalThis.fetch = async (url, options) => {
        request = { url, options }
        return new Response(JSON.stringify({ id: 'resend-message-id' }), { status: 200 })
    }

    const result = await sendEmail({
        to: 'writer@example.com',
        subject: 'Reset your Inkspire password',
        text: 'Choose a new password.',
        html: '<p>Choose a new password.</p>'
    })

    assert.equal(result.id, 'resend-message-id')
    assert.equal(request.url, 'https://api.resend.com/emails')
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.headers.Authorization, 'Bearer test-resend-key')
    assert.deepEqual(JSON.parse(request.options.body), {
        from: 'Inkspire <hello@example.com>',
        to: ['writer@example.com'],
        subject: 'Reset your Inkspire password',
        text: 'Choose a new password.',
        html: '<p>Choose a new password.</p>'
    })
})

test('requires a Resend API key and verified sender before sending', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key'
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
        /EMAIL_FROM/
    )
    assert.equal(requestCount, 0)
})

test('surfaces Resend API rejection status', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.EMAIL_FROM = 'Inkspire <hello@example.com>'
    globalThis.fetch = async () => new Response('{"message":"Invalid API key"}', { status: 401 })

    await assert.rejects(
        sendEmail({
            to: 'writer@example.com',
            subject: 'Subject',
            text: 'Body',
            html: '<p>Body</p>'
        }),
        (error) => error.statusCode === 401 && /Resend rejected the email/.test(error.message)
    )
})
