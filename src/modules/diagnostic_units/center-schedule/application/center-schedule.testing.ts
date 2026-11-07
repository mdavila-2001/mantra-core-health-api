import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../../../../common';
import { DUNIT } from '../../diagnostic_units.concepts';
import type { UnitRow } from '../infrastructure/center-schedule.repository';
import type { StudyRow } from '../infrastructure/center-studies.repository';
import { BookOrderUseCase } from './book-order.use-case';
import { CancelOrderBookingUseCase } from './cancel-order-booking.use-case';
import { CenterAvailabilityService } from './center-availability.service';
import { CenterContextService } from './center-context.service';
import { GetBookingOptionsUseCase } from './get-booking-options.use-case';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';
import { GetStudyAvailabilityUseCase } from './get-study-availability.use-case';
import { ListCenterBookingsUseCase } from './list-center-bookings.use-case';
import { OrderBookingAccessService } from './order-booking-access.service';
import { OrderQuoteService } from './order-quote.service';
import { SaveCenterScheduleUseCase } from './save-center-schedule.use-case';
import { SetEquipmentStatusUseCase } from './set-equipment-status.use-case';

/** Test doubles for the center-schedule use cases (spec support only). */
type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const mockFn = (impl?: (...args: never[]) => unknown): AsyncMock =>
  jest.fn(impl as never) as AsyncMock;

export const TENANT = '11111111-1111-4111-8111-111111111111';
export const OTHER_TENANT = '22222222-2222-4222-8222-222222222222';
export const UNIT_ID = '33333333-3333-4333-8333-333333333333';
export const RESOURCE_ID = '44444444-4444-4444-8444-444444444444';
export const PATIENT = '55555555-5555-4555-8555-555555555555';
export const ORDER_ID = '66666666-6666-4666-8666-666666666666';
export const STUDY_CONCEPT = '77777777-7777-4777-8777-777777777777';
export const actor = {
  id: 'user-1',
  roles: ['USER'],
} as unknown as AuthenticatedUser;

export function unitRow(overrides: Partial<UnitRow> = {}): UnitRow {
  return {
    id: UNIT_ID,
    tenant_id: TENANT,
    practice_id: null,
    name: 'Centro Imagen Sur',
    type_concept_id: DUNIT.UNIT_TYPE_IMAGING,
    status_concept_id: DUNIT.UNIT_ACTIVE,
    verification_status_concept_id: DUNIT.VERIFICATION_VERIFIED,
    ...overrides,
  };
}

export function studyRow(overrides: Partial<StudyRow> = {}): StudyRow {
  return {
    id: 'offering-1',
    unit_id: UNIT_ID,
    study_code: 'STUDY-ECO-ABD',
    study_concept_id: STUDY_CONCEPT,
    modality_concept_id: DUNIT.MODALITY_ULTRASOUND,
    display_name: 'Ecografía abdominal',
    preparation_instructions: 'Ayuno de 6 a 8 horas.',
    amount: '250.00',
    currency_code: 'DU_CUR_BOB',
    ...overrides,
  };
}

export const SITE_ID = '7a0f8f3a-2d55-4b3e-9a51-000000000001';

/** The main (primary) site of the test center. */
export function mainSite(overrides: Record<string, unknown> = {}) {
  return {
    unit_id: UNIT_ID,
    site_id: SITE_ID,
    site_name: 'Sede central',
    is_primary: true,
    time_zone: 'America/La_Paz',
    address_text: 'Av. Busch 100, Santa Cruz',
    latitude: '-17.78',
    longitude: '-63.18',
    ...overrides,
  };
}

export function build() {
  const em = {
    fork: (): unknown => em,
    transactional: mockFn((fn: (tx: unknown) => unknown) => fn(em)),
    findOne: mockFn(async () => null),
    execute: mockFn(async () => []),
    flush: mockFn(async () => undefined),
  };
  const scheduleRepo = {
    findUnit: mockFn(async () => unitRow()),
    findUnitOfTenant: mockFn(async () => unitRow()),
    findMainSites: mockFn(async () => [mainSite()]),
    findSites: mockFn(async () => [mainSite()]),
    findResource: mockFn(async () => ({
      id: RESOURCE_ID,
      time_zone: 'America/La_Paz',
    })),
    createResource: mockFn(async () => RESOURCE_ID),
    findTemplateRules: mockFn(async () => []),
    retireTemplates: mockFn(async () => undefined),
    insertTemplate: mockFn(async () => undefined),
    findEquipment: mockFn(async () => []),
  };
  const studiesRepo = {
    findForUnit: mockFn(async () => [studyRow()]),
    findPublishedByConcept: mockFn(async () => [studyRow()]),
    findParts: mockFn(async () => []),
  };
  const bookingsRepo = {
    findOccupying: mockFn(async () => []),
    findForOrder: mockFn(async () => null),
    lockResource: mockFn(async () => undefined),
    takeSlot: mockFn(async () => 'slot-1'),
    insertBooking: mockFn(async () => 'booking-1'),
    cancel: mockFn(async () => undefined),
    listForResource: mockFn(async () => []),
  };
  const patients = {
    ownPatientProfileId: mockFn(async () => PATIENT),
    findDiagnosticOrder: mockFn(async () => ({
      id: ORDER_ID,
      patient_profile_id: PATIENT,
      code_concept_id: STUDY_CONCEPT,
      category_concept_id: null,
      modality_concept_id: null,
      performer_tenant_id: null as string | null,
      code_display: 'Abdominal ultrasound',
      code_code: 'DU_STUDY_ABDOMINAL_ULTRASOUND',
    })),
    hasReleasedResult: mockFn(async () => false),
    homeOf: mockFn(async () => null),
    orderedComponents: mockFn(async () => []),
    lockOrder: mockFn(async () => undefined),
  };
  const f5a = { announceChanges: mockFn(async () => undefined) };

  const context = new CenterContextService(
    scheduleRepo as never,
    studiesRepo as never,
  );
  const availability = new CenterAvailabilityService(bookingsRepo as never);
  const access = new OrderBookingAccessService(patients as never);
  const quotes = new OrderQuoteService(patients as never, studiesRepo as never);
  const reader = new GetCenterScheduleUseCase(
    em as never,
    scheduleRepo as never,
    bookingsRepo as never,
    context,
  );
  return {
    em,
    scheduleRepo,
    studiesRepo,
    bookingsRepo,
    patients,
    f5a,
    reader,
    saver: new SaveCenterScheduleUseCase(
      em as never,
      scheduleRepo as never,
      bookingsRepo as never,
      context,
      reader,
    ),
    equipment: new SetEquipmentStatusUseCase(
      em as never,
      f5a as never,
      context,
      reader,
    ),
    availability: new GetStudyAvailabilityUseCase(
      em as never,
      scheduleRepo as never,
      context,
      availability,
    ),
    options: new GetBookingOptionsUseCase(
      em as never,
      access,
      scheduleRepo as never,
      studiesRepo as never,
      patients as never,
      context,
      availability,
      quotes,
    ),
    booker: new BookOrderUseCase(
      em as never,
      access,
      patients as never,
      scheduleRepo as never,
      bookingsRepo as never,
      context,
      availability,
      quotes,
    ),
    canceller: new CancelOrderBookingUseCase(
      em as never,
      access,
      patients as never,
      bookingsRepo as never,
    ),
    bookings: new ListCenterBookingsUseCase(
      em as never,
      scheduleRepo as never,
      bookingsRepo as never,
      reader,
      context,
    ),
  };
}
