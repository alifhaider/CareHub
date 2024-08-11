import bcrypt from "bcryptjs";
import { type Password, type User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { prisma } from "~/db.server";
import { authSessionStorage } from "~/services/session.server";
import invariant from "tiny-invariant";
import { typedBoolean } from "~/utils/misc";
export { bcrypt }

export type { User };

export const authenticator = new Authenticator<User>(authSessionStorage, {
  sessionKey: "accessToken",
  sessionErrorKey: "authError",
  throwOnError: true,
});

// Tell the Authenticator to use the form strategy
// authenticator.use(
//   new FormStrategy(async ({ form }) => {
//     const username = form.get("username");
//     const password = form.get("password");

//     console.log(username, password, "from authenticator");

//     invariant(typeof username === "string", "username must be a string");
//     invariant(username.length > 0, "username must not be empty");

//     invariant(typeof password === "string", "password must be a string");
//     invariant(password.length > 0, "password must not be empty");

//     const user = await verifyLogin(username, password);
//     if (!user) {
//       throw new AuthorizationError("Invalid username or password");
//     }

//     return user;
//   }),
//   "sign-in"
// );

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const username = form.get("username");
    const password = form.get("password");
    invariant(typeof username === "string", "username must be a string");
    invariant(username.length > 0, "username must not be empty");

    invariant(typeof password === "string", "password must be a string");
    invariant(password.length > 0, "password must not be empty");
    const user = await verifyLogin(username, password);
    if (!user) {
      throw new Error("Invalid username or password");
    }
    return user;
  }),
  "sign-in"
);


export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) {
  const requestUrl = new URL(request.url);
  redirectTo =
    redirectTo === null
      ? null
      : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
  const loginParams = redirectTo
    ? new URLSearchParams([["redirectTo", redirectTo]])
    : null;
  const failureRedirect = ["/login", loginParams?.toString()]
    .filter(typedBoolean)
    .join("?");
  const userId = await authenticator.isAuthenticated(request, {
    failureRedirect,
  });
  return userId;
}

export async function getDoctor(request: Request) {
  const user = await requireUserId(request);
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: user?.id,
    },
  });

  if (!doctor) {
    return null;
  }

  return doctor;
}

async function verifyLogin(
  username: User["username"],
  password: Password["hash"]
) {
  // this is a fake function to simulate a login
  const userWithPassword = await prisma.user.findUnique({
    where: { username },
    include: { password: true },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  return userWithPassword;
}
