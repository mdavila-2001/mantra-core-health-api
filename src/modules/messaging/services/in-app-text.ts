/** Subject shown when neither the delivery nor the payload brings one. */
export const FALLBACK_IN_APP_SUBJECT = 'Tiene un aviso nuevo';

/** First non-empty string among the candidates. */
function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

/**
 * Subject and body of an inbox row.
 *
 * The inline delivery (`createRequest` + `deliverNotification`) passes them
 * explicitly. The worker delivery only reports the outcome, so the text has to
 * come from the request payload, which every in-app emitter already fills:
 * `{subject, bodyText}` (agenda, profiles, community groups…) or `{text}`
 * (accounting). Without this the worker wrote rows with an empty subject.
 */
export function inboxText(
  explicit: { readonly subject?: string; readonly bodyText?: string },
  payloadJson: unknown,
): { subject: string; bodyText?: string } {
  const payload =
    payloadJson && typeof payloadJson === 'object'
      ? (payloadJson as Record<string, unknown>)
      : {};
  return {
    subject:
      firstText(explicit.subject, payload['subject'], payload['title']) ??
      FALLBACK_IN_APP_SUBJECT,
    bodyText: firstText(
      explicit.bodyText,
      payload['bodyText'],
      payload['body'],
      payload['text'],
    ),
  };
}
