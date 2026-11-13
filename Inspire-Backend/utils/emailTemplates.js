const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
})[character])

const emailLayout = ({ preheader, eyebrow, title, content, buttonLabel, buttonUrl, footer }) => `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f8;color:#1c2944;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:36px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8eaf0;border-radius:20px;overflow:hidden;">
                    <tr>
                        <td style="padding:24px 32px;border-bottom:1px solid #eceef3;">
                            <span style="font-size:21px;font-weight:800;letter-spacing:-.7px;color:#1c2944;">Inkspire</span>
                            <span style="float:right;padding-top:6px;color:#777f92;font-size:11px;font-weight:700;letter-spacing:1.5px;">IDEAS, IN GOOD COMPANY</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:38px 32px 16px;">
                            <p style="margin:0 0 12px;color:#655beb;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">${eyebrow}</p>
                            <h1 style="margin:0;color:#1c2944;font-size:32px;line-height:1.2;letter-spacing:-1px;">${title}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 32px 32px;color:#555f75;font-size:16px;line-height:1.7;">
                            ${content}
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                                <tr>
                                    <td bgcolor="#1c2944" style="border-radius:999px;">
                                        <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${buttonLabel}</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0;color:#777f92;font-size:13px;line-height:1.6;">${footer}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f8f8fb;border-top:1px solid #eceef3;color:#777f92;font-size:12px;line-height:1.6;">
                            A quieter corner of the internet for words worth sharing.<br>
                            <span style="color:#a1a7b5;">You received this message because of activity on your Inkspire account.</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

export function createWelcomeEmail({ firstName, appUrl }) {
    const safeFirstName = escapeHtml(firstName || 'writer')
    const buttonUrl = new URL('/feed', appUrl).toString()

    return {
        subject: 'Welcome to Inkspire',
        html: emailLayout({
            preheader: 'Your next chapter starts here.',
            eyebrow: 'Welcome to the circle',
            title: 'Your next chapter starts here.',
            content: `<p style="margin:0 0 16px;">Hi ${safeFirstName},</p>
                <p style="margin:0;">Your Inkspire account is ready. Find a fresh perspective, share an idea, or start a conversation with writers who care about the words they put into the world.</p>`,
            buttonLabel: 'Explore Inkspire',
            buttonUrl,
            footer: 'We are glad you are here. Sign in whenever you are ready to pick up your pen.'
        }),
        text: `Welcome to Inkspire\n\nHi ${firstName || 'writer'},\n\nYour account is ready. Explore the community and find your next idea: ${buttonUrl}\n\nWe are glad you are here.`
    }
}

export function createPasswordResetEmail({ resetUrl }) {
    return {
        subject: 'Your Inkspire password reset link',
        html: emailLayout({
            preheader: 'A secure link to get you back into Inkspire.',
            eyebrow: 'Account security',
            title: "Let's get you back in.",
            content: `<p style="margin:0 0 16px;">We received a request to reset the password for your Inkspire account.</p>
                <p style="margin:0;">Use the secure link below to choose a new password. For your protection, this link expires in 15 minutes.</p>`,
            buttonLabel: 'Reset my password',
            buttonUrl: resetUrl,
            footer: 'If you did not request a password reset, you can safely ignore this email. Your password will not change.'
        }),
        text: `Reset your Inkspire password\n\nWe received a request to reset your password. Use this link within 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
    }
}

export function createPasswordChangedEmail({ firstName, appUrl }) {
    const safeFirstName = escapeHtml(firstName || 'writer')
    const resetUrl = new URL('/forgot-password', appUrl).toString()

    return {
        subject: 'Your Inkspire password was changed',
        html: emailLayout({
            preheader: 'A security update for your Inkspire account.',
            eyebrow: 'Account security',
            title: 'Your password was updated.',
            content: `<p style="margin:0 0 16px;">Hi ${safeFirstName},</p>
                <p style="margin:0;">The password for your Inkspire account was just changed. If you made this change, no further action is needed.</p>`,
            buttonLabel: 'Reset my password',
            buttonUrl: resetUrl,
            footer: 'If you did not change your password, reset it now and contact the Inkspire team.'
        }),
        text: `Your Inkspire password was changed\n\nHi ${firstName || 'writer'},\n\nThe password for your Inkspire account was just changed. If you did not make this change, reset it immediately: ${resetUrl}`
    }
}

export function createCommentNotificationEmail({
    commenterName,
    postTitle,
    commentText,
    postUrl,
}) {
    const safeCommenterName = escapeHtml(commenterName || 'A reader')
    const safePostTitle = escapeHtml(postTitle || 'your story')
    const safeComment = escapeHtml(String(commentText || '').slice(0, 800))

    return {
        subject: 'A new comment on your Inkspire story',
        html: emailLayout({
            preheader: 'Someone joined the conversation on your story.',
            eyebrow: 'New comment',
            title: 'Your story sparked a conversation.',
            content: `<p style="margin:0 0 16px;">${safeCommenterName} commented on <strong>${safePostTitle}</strong>:</p>
                <blockquote style="margin:0;padding:16px 20px;border-left:3px solid #655beb;background:#f8f8fb;color:#555f75;">${safeComment}</blockquote>`,
            buttonLabel: 'Read the conversation',
            buttonUrl: postUrl,
            footer: 'You received this message because you authored the story.'
        }),
        text: `${commenterName || 'A reader'} commented on "${postTitle || 'your story'}":\n\n${String(commentText || '').slice(0, 800)}\n\nRead the conversation: ${postUrl}`
    }
}
