import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, json, useActionData } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusButton } from "~/components/ui/status-button";
import { authenticator } from "~/services/auth.server";
import { commitSession, getSession } from "~/services/session.server";
import { invariantResponse, useIsSubmitting } from "~/utils/misc";

export const meta: MetaFunction = () => {
  return [
    { title: "Login / CH" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type LoginActionErros = {
  formErrors: Array<string>;
  fieldErrors: {
    username: Array<string>;
    password: Array<string>;
  };
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
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  invariantResponse(typeof username === "string", "Username must be a string");
  invariantResponse(typeof password === "string", "Password must be a string");

  const errors: LoginActionErros = {
    formErrors: [],
    fieldErrors: {
      username: [],
      password: [],
    },
  };

  if (username === "") {
    errors.fieldErrors.username.push("Username is required");
  }

  if (password === "") {
    errors.fieldErrors.password.push("Password is required");
  }

  const hasErros =
    errors.formErrors.length ||
    Object.values(errors.fieldErrors).some((fieldErrors) => fieldErrors.length);

  if (hasErros) {
    return json({ status: "error", errors } as const, { status: 400 });
  }
  return await authenticator.authenticate("sign-in", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
}

function ErrorList({ errors }: { errors?: Array<string> | null }) {
  return errors?.length ? (
    <ul className="flex flex-col gap-1">
      {errors.map((error, i) => (
        <li key={i} className="text-[10px] text-destructive">
          {error}
        </li>
      ))}
    </ul>
  ) : null;
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();

  const formId = "login";

  const fieldErrors =
    actionData?.status === "error" ? actionData.errors.fieldErrors : null;
  const formErrors =
    actionData?.status === "error" ? actionData.errors.formErrors : null;

  return (
    <div className="font-sans p-4">
      <Form
        id={formId}
        method="POST"
        className="flex max-w-xl mx-auto h-full flex-col gap-y-6 overflow-y-auto overflow-x-hidden px-10 py-12 border rounded-md"
      >
        <h1 className="text-3xl font-bold text-center">
          Login to your account
        </h1>
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            name="username"
            placeholder="Username"
            required
          />
          <ErrorList errors={fieldErrors?.username} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <ErrorList errors={fieldErrors?.password} />
        </div>

        <ErrorList errors={formErrors} />

        <StatusButton
          form={formId}
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? "pending" : "idle"}
        >
          Login
        </StatusButton>
      </Form>
    </div>
  );
}
