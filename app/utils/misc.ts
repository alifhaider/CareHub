import { useFormAction, useNavigation } from "@remix-run/react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function typedBoolean<T>(
  value: T
): value is Exclude<T, false | null | undefined | "" | 0> {
  return Boolean(value);
}

export function formatTime(time: string) {
  const t = new Date(time);

  const hours = t.getHours();
  const minutes = t.getMinutes();
  if (hours > 12) {
    return `${hours - 12}:${minutes} PM`;
  }
  return `${hours}:${minutes} AM`;
}

/**
 * A handy utility that makes constructing class names easier.
 * It also merges tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Provide a condition and if that condition is falsey, this throws a 400
 * Response with the given message.
 *
 * inspired by invariant from 'tiny-invariant'
 *
 * @example
 * invariantResponse(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Response} if condition is falsey
 */
export function invariantResponse(
  condition: any,
  message?: string | (() => string),
  responseInit?: ResponseInit
): asserts condition {
  if (!condition) {
    throw new Response(
      typeof message === "function"
        ? message()
        : message ||
          "An invariant failed, please provide a message to explain why.",
      { status: 400, ...responseInit }
    );
  }
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 */
export function useIsSubmitting({
  formAction,
  formMethod = "POST",
}: {
  formAction?: string;
  formMethod?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
} = {}) {
  const contextualFormAction = useFormAction();
  const navigation = useNavigation();
  return (
    navigation.state === "submitting" &&
    navigation.formAction === (formAction ?? contextualFormAction) &&
    navigation.formMethod === formMethod
  );
}
