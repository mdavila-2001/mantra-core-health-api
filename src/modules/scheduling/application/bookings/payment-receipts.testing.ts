import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { BookingAccess } from './support/booking-access';
import { BookingChangeNotifier } from './support/booking-change-notifier';
import { PaymentReceiptAccess } from './support/payment-receipt-access';
import { ConfirmPaymentReceiptUseCase } from './use-cases/confirm-payment-receipt.use-case';
import { GetPaymentReceiptContentUseCase } from './use-cases/get-payment-receipt-content.use-case';
import { ListPaymentReceiptsUseCase } from './use-cases/list-payment-receipts.use-case';
import { RejectPaymentReceiptUseCase } from './use-cases/reject-payment-receipt.use-case';
import { UploadPaymentReceiptUseCase } from './use-cases/upload-payment-receipt.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

export const BOOKING = '33333333-3333-3333-3333-333333333333';
export const TENANT = '44444444-4444-4444-4444-444444444444';
export const PATIENT_PROFILE = '22222222-2222-2222-2222-222222222222';
export const RESOURCE = '55555555-5555-5555-5555-555555555555';
export const PRACTITIONER_PROFILE = '66666666-6666-6666-6666-666666666666';
export const FILE = '77777777-7777-7777-7777-777777777777';
export const RECEIPT = '88888888-8888-8888-8888-888888888888';

/** El paciente titular de la cita. */
export const patient = { id: 'patient-user', roles: ['PATIENT'] } as any;

/** El médico de la agenda de la cita. */
export const practitioner = {
  id: 'practitioner-user',
  roles: ['PRACTITIONER'],
  practitionerProfileId: PRACTITIONER_PROFILE,
} as any;

/** Otro médico, de otra agenda. */
export const otherPractitioner = {
  id: 'other-practitioner-user',
  roles: ['PRACTITIONER'],
  practitionerProfileId: '99999999-9999-9999-9999-999999999999',
} as any;

/** Una cita confirmada, de la agenda del médico. */
export function booking(statusConceptId: string = CONCEPTS.BOOKING_CONFIRMED) {
  return {
    id: BOOKING,
    tenantId: TENANT,
    patientProfileId: PATIENT_PROFILE,
    resourceId: RESOURCE,
    statusConceptId,
  };
}

/** Un comprobante de la cita, en la revisión que se pida. */
export function receipt(
  reviewStatusConceptId: string = SCHED.RECEIPT_PENDING,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: RECEIPT,
    tenantId: TENANT,
    appointmentBookingId: BOOKING,
    fileId: FILE,
    amount: '150.00',
    paidAt: null,
    note: null,
    uploadedByUserId: patient.id,
    uploadedAt: new Date('2026-10-27T15:00:00Z'),
    reviewStatusConceptId,
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date('2026-10-27T15:00:00Z'),
    updatedAt: new Date('2026-10-27T15:00:00Z'),
    rowVersion: 1,
    ...overrides,
  };
}

/** Lo que el aviso necesita de la cita. */
export const BOOKING_SNAPSHOT = {
  bookingId: BOOKING,
  tenantId: TENANT,
  patientProfileId: PATIENT_PROFILE,
  resourceId: RESOURCE,
  slotId: 'slot-1',
  startAt: new Date('2026-10-28T13:00:00Z'),
  resourceLabel: 'Dra. Ana Pérez',
};

/**
 * Los casos de uso de los comprobantes sobre dobles de sus dependencias.
 *
 * `BookingAccess`, `PaymentReceiptAccess` y `BookingChangeNotifier` son los
 * reales: así las pruebas miran la autorización y los avisos de verdad, no
 * una copia simulada de ellos.
 */
export function buildReceipts() {
  const tx: any = {
    create: mockFn((_entity: any, data: any) => data),
    persist: mockFn(),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
  };
  em.fork = mockFn(() => em);

  const bookingsRepo = {
    findBookingByIdForUpdate: mockFn().mockResolvedValue(booking()),
    findPaymentStateForUpdate: mockFn().mockResolvedValue(null),
    findPaymentState: mockFn().mockResolvedValue(null),
  };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue({
      id: RESOURCE,
      resourceRefId: PRACTITIONER_PROFILE,
      resourceRefType: 'health_practitioner_profiles',
    }),
  };
  const receiptsRepo = {
    findForBooking: mockFn().mockResolvedValue([]),
    findOfBooking: mockFn().mockResolvedValue(receipt()),
    findOfBookingForUpdate: mockFn().mockResolvedValue(receipt()),
    findUserDisplayNames: mockFn().mockResolvedValue(
      new Map([
        [patient.id, 'Juan Paciente'],
        [practitioner.id, 'Dra. Ana Pérez'],
      ]),
    ),
  };
  // Por omisión el paciente es el titular y nadie más lo representa.
  const representation = {
    representsPatient: mockFn(async (_profile: string, who: any) =>
      Promise.resolve(who.id === patient.id),
    ),
  };
  const files = {
    assertAttachable: mockFn().mockResolvedValue({
      mimeType: 'image/png',
      originalName: 'transferencia.png',
    }),
    describe: mockFn().mockResolvedValue(
      new Map([
        [FILE, { mimeType: 'image/png', originalName: 'transferencia.png' }],
      ]),
    ),
    download: mockFn().mockResolvedValue({
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
    }),
  };
  const history = {
    append: mockFn().mockResolvedValue(undefined),
    latestByBooking: mockFn(),
  };
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue(BOOKING_SNAPSHOT),
    findResourceAccount: mockFn().mockResolvedValue(practitioner.id),
    findDisplayNameForProfile: mockFn().mockResolvedValue('Juan Paciente'),
  };
  const notices = {
    emit: mockFn().mockResolvedValue({ delivered: true }),
    emitMany: mockFn().mockResolvedValue([]),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const access = new BookingAccess(
    bookingsRepo as any,
    catalogRepo as any,
    representation as any,
    {} as any,
  );
  const receiptsAccess = new PaymentReceiptAccess(
    bookingsRepo as any,
    receiptsRepo as any,
    access,
    representation as any,
    files as any,
  );
  const notifier = new BookingChangeNotifier(
    em,
    noticeRepo as any,
    notices as any,
    {} as any,
    logger as any,
  );

  return {
    tx,
    em,
    bookingsRepo,
    catalogRepo,
    receiptsRepo,
    representation,
    files,
    history,
    noticeRepo,
    notices,
    logger,
    upload: new UploadPaymentReceiptUseCase(
      em,
      bookingsRepo as any,
      receiptsAccess,
      files as any,
      notifier,
      logger as any,
    ),
    list: new ListPaymentReceiptsUseCase(
      em,
      receiptsRepo as any,
      receiptsAccess,
    ),
    content: new GetPaymentReceiptContentUseCase(
      em,
      receiptsAccess,
      files as any,
    ),
    confirm: new ConfirmPaymentReceiptUseCase(
      em,
      bookingsRepo as any,
      receiptsAccess,
      history as any,
      notifier,
      logger as any,
    ),
    reject: new RejectPaymentReceiptUseCase(
      em,
      receiptsAccess,
      notifier,
      logger as any,
    ),
  };
}

/** La representación del paciente que niega: la cita no es suya. */
export function notTheirs(representation: { representsPatient: any }) {
  representation.representsPatient.mockResolvedValue(false);
}
