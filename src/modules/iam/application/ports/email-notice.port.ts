/** Un correo transaccional a un destinatario interno. */
export interface EmailNoticeInput {
  readonly recipientUserId: string;
  readonly recipientAddress: string;
  readonly subject: string;
  readonly bodyText: string;
}

/**
 * Encolado de los correos del acceso (verificación, restablecimiento).
 *
 * El puerto no devuelve nada: quien lo llama decide qué hacer si falla (todos
 * lo atrapan y siguen, porque la cuenta ya existe).
 */
export interface EmailNoticePort {
  enqueueEmail(input: EmailNoticeInput): Promise<void>;
}

export const EMAIL_NOTICE_PORT = Symbol('IAM_EMAIL_NOTICE_PORT');
