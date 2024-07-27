import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, json } from "@remix-run/react";
import { authenticator } from "~/services/auth.server";
import { commitSession, getSession } from "~/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Login/CH" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
  const session = await getSession(request.headers.get("cookie"));
  const error = session.get(authenticator.sessionErrorKey);
  let errorMessage: string | null = null;
  if (typeof error?.message === "string") {
    errorMessage = error.message;
  }
  return json(
    { formError: errorMessage },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate("sign-in", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
}

export default function Login() {
  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl font-bold underline">Login</h1>

      <Form
        method="POST"
        className="flex flex-col gap-10 max-w-xl mx-auto border p-10"
      >
        <label>
          Username
          <input type="text" name="username" required />
        </label>

        <label>
          Password
          <input type="password" name="password" required />
        </label>

        <button type="submit">Login</button>
      </Form>
    </div>
  );
}
