import { createCookieSessionStorage } from "@remix-run/node";
import { createThemeSessionResolver } from "remix-themes";
import invariant from "tiny-invariant";

// You can default to 'development' if process.env.NODE_ENV is not set
const isProduction = process.env.NODE_ENV === "production";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    // domain: 'remix.run',
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: ["s3cr3t"],
    secure: isProduction,
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

// export const themeSessionResolver = createThemeSessionResolver(sessionStorage)
export const { getSession, commitSession, destroySession } = authSessionStorage;
