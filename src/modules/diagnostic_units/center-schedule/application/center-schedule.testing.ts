import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../../../../common';
import { DUNIT } from '../../diagnostic_units.concepts';
import type {
  EquipmentRow,
  UnitRow,
} from '../infrastructure/center-schedule.repository';
import type { StudyRow } from '../infrastructure/center-studies.repository';
import { AddEquipmentUseCase } from './add-equipment.use-case';
import { BookOrderUseCase } from './book-order.use-case';
import { CancelOrderBookingUseCase } from './cancel-order-booking.use-case';
import { CenterAvailabilityService } from './center-availability.service';
import { CenterContextService } from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { GetBookingOptionsUseCase } from './get-booking-options.use-case';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';
import { GetStudyAvailabilityUseCase } from './get-study-availability.use-case';
import { ListCenterBookingsUseCase } from './list-center-bookings.use-case';
import { OrderBookingAccessService } from './order-booking-access.service';
import { RemoveEquipmentUseCase } from './remove-equipment.use-case';
import { SaveCenterScheduleUseCase } from './save-center-schedule.use-case';
import { SaveDeviceScheduleUseCase } from './save-device-schedule.use-case';
import { UpdateEquipmentUseCase } from './update-equipment.use-case';

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
export const DEVICE_ID = '88888888-8888-4888-8888-888888888888';
export const DEVICE_RESOURCE_ID = '99999999-9999-4999-8999-999999999999';
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

/** An operational ultrasound device of the unit. */
export function equipmentRow(
  overrides: Partial<EquipmentRow> = {},
): EquipmentRow {
  return {
    id: DEVICE_ID,
    type_concept_id: DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
    type_display: 'Ultrasound equipment',
    manufacturer: 'GE',
    model: 'Logiq',
    serial_number: 'SN-1',
    modality_concept_id: DUNIT.MODALITY_ULTRASOUND,
    status_concept_id: DUNIT.EQUIPMENT_OPERATIONAL,
    ...overrides,
  };
}

/** A booking row as `findOccupying` returns it. */
export function occupyingRow(
  start: Date,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'other',
    slot_id: 'slot-0',
    resource_id: RESOURCE_ID,
    start_at: start,
    end_at: new Date(start.getTime() + 1_800_000),
    modality_code: 'ECO',
    study_code: 'STUDY-ECO-ABD',
    equipment_id: null as string | null,
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
    findMainSites: mockFn(async () => [
      {
        unit_id: UNIT_ID,
        site_name: 'Sede central',
        time_zone: 'America/La_Paz',
        address_text: 'Av. Busch 100, Santa Cruz',
        latitude: '-17.78',
        longitude: '-63.18',
      },
    ]),
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
  const devicesRepo = {
    findResources: mockFn(async () => []),
    findTemplateRules: mockFn(async () => []),
    createResource: mockFn(async () => DEVICE_RESOURCE_ID),
    retireResource: mockFn(async () => undefined),
    hasBookings: mockFn(async () => false),
    findMainSiteId: mockFn(async () => ({
      id: 'site-1',
      imaging_available: true,
    })),
    deleteEquipment: mockFn(async () => undefined),
  };
  const equipmentRepo = {
    findBySerial: mockFn(async () => null),
    create: jest.fn((_em: unknown, data: unknown) => ({
      id: 'eq-new',
      ...(data as object),
    })),
  };
  const studiesRepo = {
    findForUnit: mockFn(async () => [studyRow()]),
    findPublishedByConcept: mockFn(async () => [studyRow()]),
  };
  const bookingsRepo = {
    findOccupying: mockFn(async () => []),
    findForOrder: mockFn(async () => null),
    lockResource: mockFn(async () => undefined),
    takeSlot: mockFn(async () => 'slot-1'),
    insertBooking: mockFn(async () => 'booking-1'),
    moveToDevice: mockFn(async () => undefined),
    cancel: mockFn(async () => undefined),
    listForResources: mockFn(async () => []),
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
    lockOrder: mockFn(async () => undefined),
  };
  const f5a = { announceChanges: mockFn(async () => undefined) };

  const context = new CenterContextService(
    scheduleRepo as never,
    studiesRepo as never,
    devicesRepo as never,
  );
  const availability = new CenterAvailabilityService(bookingsRepo as never);
  const devices = new DeviceBookingsService(
    bookingsRepo as never,
    devicesRepo as never,
  );
  const access = new OrderBookingAccessService(patients as never);
  const reader = new GetCenterScheduleUseCase(
    em as never,
    scheduleRepo as never,
    devices,
    context,
  );
  const updater = new UpdateEquipmentUseCase(
    em as never,
    f5a as never,
    equipmentRepo as never,
    bookingsRepo as never,
    context,
    devices,
    reader,
  );
  return {
    em,
    scheduleRepo,
    devicesRepo,
    equipmentRepo,
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
      devices,
      reader,
    ),
    equipment: updater,
    adder: new AddEquipmentUseCase(
      em as never,
      equipmentRepo as never,
      devicesRepo as never,
      bookingsRepo as never,
      context,
      devices,
      reader,
    ),
    remover: new RemoveEquipmentUseCase(
      em as never,
      devicesRepo as never,
      context,
      updater,
      reader,
    ),
    deviceSchedule: new SaveDeviceScheduleUseCase(
      em as never,
      scheduleRepo as never,
      bookingsRepo as never,
      context,
      devices,
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
    ),
    booker: new BookOrderUseCase(
      em as never,
      access,
      patients as never,
      scheduleRepo as never,
      bookingsRepo as never,
      context,
      availability,
      devices,
    ),
    canceller: new CancelOrderBookingUseCase(
      em as never,
      access,
      patients as never,
      bookingsRepo as never,
    ),
    bookings: new ListCenterBookingsUseCase(
      em as never,
      bookingsRepo as never,
      context,
      reader,
    ),
  };
}
