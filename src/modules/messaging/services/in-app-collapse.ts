import { touch } from '../../../common';
import type { InAppNotifications } from '../entities';
import type {
  EmitInAppInput,
  EmitInAppResult,
} from '../notifications.contract';

/** What the collapse asks the service, bound to its transaction. */
export interface CollapseChecks {
  /** Opt-out reason of the category for the recipient, if any. */
  readonly optedOut: () => Promise<string | undefined>;
  /** End of the recipient's quiet hours (`now` when not in them). */
  readonly silentUntil: (now: Date) => Promise<Date>;
}

/**
 * A new fact about an object whose notice is still unread: one bell row per
 * object, showing its newest state (a cancelled visit must not keep reading
 * «requested»; a conversation shows its latest sender). The texts are the
 * emitters' own subject/body, already written for the bell, so no new class
 * of content reaches it.
 *
 * The phone buzzes again only when the newer fact would itself notify: its
 * category is not opted out and the recipient is not in quiet hours. Opted
 * out, the row stays exactly as it was (the newer fact is not shown).
 */
export async function collapseUnreadInApp(
  row: InAppNotifications,
  input: EmitInAppInput,
  actorUserId: string,
  checks: CollapseChecks,
): Promise<EmitInAppResult & { renotify?: boolean }> {
  const collapsed = {
    inAppNotificationId: row.id,
    requestId: row.notificationRequestId,
    suppressed: false,
  };
  if (await checks.optedOut()) return collapsed;

  const now = new Date();
  row.subject = input.subject;
  row.bodyText = input.bodyText;
  if (input.payloadJson !== undefined) row.payloadJson = input.payloadJson;
  // Still deferred by quiet hours: the release announces the newest text.
  const visible = row.availableAt <= now;
  if (visible) row.availableAt = now;
  touch(row, actorUserId, now);
  const silentUntil = await checks.silentUntil(now);
  // Same notificationId: the device replaces the previous banner.
  return { ...collapsed, renotify: visible && silentUntil <= now };
}
