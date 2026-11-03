export interface PharmacyNotificationInput {
  readonly recipientUserId: string;
  readonly category: 'CLINICAL';
  readonly subject: string;
  readonly bodyText: string;
  readonly destination: {
    readonly type: 'PHARMACY_ORDER' | 'PRESCRIPTION';
    readonly id: string;
  };
  readonly debounceKey: string;
  readonly actorUserId: string;
}

export interface PharmacyNotificationResult {
  readonly requestId?: string;
  readonly inAppNotificationId?: string;
  readonly availableAt?: string;
  readonly suppressed: boolean;
  readonly suppressionReason?: string;
  readonly failed?: boolean;
}

/** Emisión de avisos del pedido de farmacia en la bandeja personal. */
export interface InAppNotificationPort {
  emit(input: PharmacyNotificationInput): Promise<PharmacyNotificationResult>;
}

/** Token de inyección del emisor in-app. */
export const IN_APP_NOTIFICATION_PORT = Symbol('IN_APP_NOTIFICATION_PORT');
