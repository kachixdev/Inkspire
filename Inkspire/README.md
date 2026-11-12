# Inkspire Frontend

A React and Tailwind frontend for the Blog API. User, story, and comment data is loaded from the backend instead of local demo data.

## Run the project

```bash
npm install
npm run dev
```

## Run the backend

Start the backend project separately. The frontend currently sends API requests to `http://localhost:3030/api`.
The backend must allow credentialed requests from `http://localhost:5173`.

## Folder guide

```text
src/
├── components/
│   ├── blog/       Reusable blog cards
│   ├── common/     Avatar, empty states, protected routes
│   └── layout/     Header, footer, page layout
├── pages/          One file for each screen
├── utils/          Shared API and user helpers
├── styles/         Tailwind setup and shared CSS classes
├── App.jsx         All routes
└── main.jsx        App starting point and providers
```

## Backend behavior

- Comments are listed on each story, and signed-in users can view their own comments on their profile.
- User profile stories are selected from the public stories list.
- Users can delete their own stories and comments. Admins can moderate any story or comment.
- Signed-in users can update their profile details, upload an avatar (JPEG, PNG, or WebP up to 5 MB), and change their password after confirming the current password.
- Password recovery is initiated at `POST /api/users/forgot-password` with `{ "email": "..." }`. Return a generic success response whether or not the address is registered, and send a reset link to the address when applicable.
- The email link should point to the frontend route `/reset-password?token=...`. `POST /api/users/reset-password` accepts `{ "token": "...", "password": "..." }` and must validate the token before changing the password.

Password reset tokens and email delivery must be implemented by the backend, never in the browser. Use a random, single-use, expiring token (store only its hash), and send the link through a server-side email provider. If using Gmail SMTP, configure an app password in the backend's environment rather than putting Gmail credentials in this frontend.
