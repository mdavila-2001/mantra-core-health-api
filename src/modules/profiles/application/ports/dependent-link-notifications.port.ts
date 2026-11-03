export interface DependentLinkNotification {
  readonly recipientUserId: string;
  readonly category: 'CLINICAL';
  readonly subject: string;
  readonly bodyText?: string;
  readonly destination?: {
    readonly type: 'DEPENDENT_LINK_REQUEST';
    readonly id: string;
  };
  readonly debounceKey?: string;
  readonly actorUserId?: string;
}

export interface DependentLinkNotificationsPort {
  emitInApp(input: DependentLinkNotification): Promise<unknown>;
}

export const DEPENDENT_LINK_NOTIFICATIONS_PORT = Symbol(
  'DEPENDENT_LINK_NOTIFICATIONS_PORT',
);
