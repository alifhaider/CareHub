import { createCookieSessionStorage } from 'react-router';
import invariant from 'tiny-invariant'

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be defined')

export const verifySessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'en_verification',
    sameSite: 'lax', // CSRF protection is advised if changing to 'none'
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    secrets: process.env.SESSION_SECRET.split(','),
    secure: process.env.NODE_ENV === 'production',
  },
})
