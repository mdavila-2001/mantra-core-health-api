import type { ToolCatalogItem } from '../domain/tool-catalog';

/** Same shape as `ConfigurationState` in `ops-tools.service.ts`. */
interface PushConfigurationState {
  binding: 'real' | 'none';
  missingEnvVars: string[];
  message: string;
}

type Resolver = (
  env: NodeJS.ProcessEnv,
  tool: ToolCatalogItem,
) => PushConfigurationState;

const missingOf = (
  env: NodeJS.ProcessEnv,
  names: readonly string[],
): string[] => names.filter((name) => (env[name] ?? '').trim().length === 0);

/**
 * Mirrors the validation of `readFcmSender` (messaging): the value must be a
 * JSON object with string `client_email` and `private_key`. Kept local so the
 * ops console reads only the environment and never enters `messaging`; the
 * spec pins both checks to the same verdicts.
 */
export function isFcmServiceAccountJson(raw: string): boolean {
  try {
    const account = JSON.parse(raw) as {
      client_email?: unknown;
      private_key?: unknown;
    } | null;
    return (
      typeof account?.client_email === 'string' &&
      typeof account.private_key === 'string'
    );
  } catch {
    return false;
  }
}

/**
 * Configuration rules of the push senders, kept apart from the frozen
 * `ops-tools.service.ts`. Each one copies the condition of its sender.
 */
export const PUSH_RESOLVERS: { web_push: Resolver; native_push: Resolver } = {
  web_push: (env, tool) => {
    const missing = missingOf(env, tool.requiredEnvVars);
    return missing.length === 0
      ? {
          binding: 'real',
          missingEnvVars: [],
          message: 'Claves VAPID presentes; sin sonda en vivo.',
        }
      : {
          binding: 'none',
          missingEnvVars: missing,
          message: 'Faltan claves VAPID: el servicio de push queda inactivo.',
        };
  },

  // Same verdict as `NativePushService.enabled()` (`readFcmSender` on this env).
  native_push: (env, tool) => {
    const missing = missingOf(env, tool.requiredEnvVars);
    if (missing.length > 0) {
      return {
        binding: 'none',
        missingEnvVars: missing,
        message:
          'Faltan credenciales de FCM: el push a la app móvil queda inactivo.',
      };
    }
    return isFcmServiceAccountJson(env['FCM_SERVICE_ACCOUNT_JSON'] ?? '')
      ? {
          binding: 'real',
          missingEnvVars: [],
          message: 'Credenciales de FCM presentes; sin sonda en vivo.',
        }
      : {
          binding: 'none',
          // Present (so "configured"), but the sender stays off: the binding
          // and the message say why.
          missingEnvVars: [],
          message:
            'FCM_SERVICE_ACCOUNT_JSON no es una cuenta de servicio válida: el push a la app móvil queda inactivo.',
        };
  },
};
