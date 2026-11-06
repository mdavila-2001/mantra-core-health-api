import { JWT } from 'google-auth-library';

/** OAuth2 scope required by the FCM HTTP v1 API. */
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const FCM_TIMEOUT_MS = 10_000;
/** Android notification channel the mobile app creates on start. */
export const ANDROID_CHANNEL_ID = 'alovida_avisos';
/** Fixed, generic text: the lock screen must never show patient data. */
const PUSH_TITLE = 'AloVida';
const PUSH_BODY = 'Tiene un aviso nuevo en AloVida';

/** Ready-to-use FCM sender: project id plus a cached OAuth2 client. */
export interface FcmSender {
  readonly projectId: string;
  readonly auth: Pick<JWT, 'getAccessToken'>;
}

/** Outcome of one send: `gone` means the token must be forgotten. */
export type FcmOutcome =
  | { readonly kind: 'sent' }
  | { readonly kind: 'gone' }
  | {
      readonly kind: 'failed';
      readonly status?: number;
      readonly code?: string;
    };

/**
 * Reads `FCM_PROJECT_ID` and `FCM_SERVICE_ACCOUNT_JSON` (the service account
 * key file contents as one JSON string). Returns `null` when either is missing
 * or unusable, so the caller degrades to a no-op.
 */
export function readFcmSender(
  env: NodeJS.ProcessEnv = process.env,
): FcmSender | null {
  const projectId = env['FCM_PROJECT_ID']?.trim();
  const raw = env['FCM_SERVICE_ACCOUNT_JSON']?.trim();
  if (!projectId || !raw) return null;
  try {
    const account = JSON.parse(raw) as {
      client_email?: unknown;
      private_key?: unknown;
    };
    if (
      typeof account.client_email !== 'string' ||
      typeof account.private_key !== 'string'
    ) {
      return null;
    }
    const auth = new JWT({
      email: account.client_email,
      key: account.private_key,
      scopes: [FCM_SCOPE],
    });
    return { projectId, auth };
  } catch {
    return null;
  }
}

/** FCM `data` map: every value must be a string. */
export type FcmData = Readonly<Record<string, string>>;

/** Body of `projects/{id}/messages:send` for one registration token. */
export function buildFcmMessage(token: string, data: FcmData): unknown {
  return {
    message: {
      token,
      notification: { title: PUSH_TITLE, body: PUSH_BODY },
      data,
      android: {
        priority: 'HIGH',
        notification: { channel_id: ANDROID_CHANNEL_ID },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { sound: 'default' } },
      },
    },
  };
}

interface FcmErrorBody {
  error?: {
    status?: string;
    message?: string;
    details?: { errorCode?: string }[];
  };
}

/**
 * `true` when FCM says the token itself is dead or foreign: UNREGISTERED
 * (HTTP 404), SENDER_ID_MISMATCH, or INVALID_ARGUMENT about the token. A
 * generic INVALID_ARGUMENT (malformed payload) must not wipe every token.
 */
export function isDeadToken(status: number, body: FcmErrorBody): boolean {
  const codes = (body.error?.details ?? []).map((d) => d.errorCode);
  if (status === 404 || codes.includes('UNREGISTERED')) return true;
  if (codes.includes('SENDER_ID_MISMATCH')) return true;
  const invalid =
    codes.includes('INVALID_ARGUMENT') ||
    body.error?.status === 'INVALID_ARGUMENT';
  return (
    status === 400 &&
    invalid &&
    /registration token/i.test(body.error?.message ?? '')
  );
}

/** Sends one message. Never throws: every failure becomes an outcome. */
export async function sendFcm(
  sender: FcmSender,
  token: string,
  data: FcmData,
): Promise<FcmOutcome> {
  try {
    const { token: accessToken } = await sender.auth.getAccessToken();
    if (!accessToken) return { kind: 'failed', code: 'NO_ACCESS_TOKEN' };
    const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(sender.projectId)}/messages:send`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(buildFcmMessage(token, data)),
      signal: AbortSignal.timeout(FCM_TIMEOUT_MS),
    });
    if (response.ok) return { kind: 'sent' };
    const body = (await response.json().catch(() => ({}))) as FcmErrorBody;
    if (isDeadToken(response.status, body)) return { kind: 'gone' };
    return {
      kind: 'failed',
      status: response.status,
      code: body.error?.details?.[0]?.errorCode ?? body.error?.status,
    };
  } catch (error: unknown) {
    return {
      kind: 'failed',
      code: error instanceof Error ? error.name : 'unknown',
    };
  }
}
