import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { LabStaffGuard } from '../../../diagnostics/guards';
import { DiagnosticsPatientResultsController } from '../../../diagnostics/controllers/diagnostics-patient-results.controller';
import { DiagnosticsPatientResultsService } from '../../../diagnostics/services';
import { DiagnosticUnitsController } from '../../controllers/diagnostic-units.controller';
import {
  DiagnosticPricingService,
  DiagnosticStudiesService,
  DiagnosticUnitsAdminReadService,
  DiagnosticUnitsReadService,
  DiagnosticUnitsSearchService,
  DiagnosticUnitsService,
} from '../../services';
import { BookOrderUseCase } from '../application/book-order.use-case';
import { CancelOrderBookingUseCase } from '../application/cancel-order-booking.use-case';
import { GetBookingOptionsUseCase } from '../application/get-booking-options.use-case';
import { GetCenterScheduleUseCase } from '../application/get-center-schedule.use-case';
import { GetStudyAvailabilityUseCase } from '../application/get-study-availability.use-case';
import { ListCenterBookingsUseCase } from '../application/list-center-bookings.use-case';
import { SaveCenterScheduleUseCase } from '../application/save-center-schedule.use-case';
import { SetEquipmentStatusUseCase } from '../application/set-equipment-status.use-case';
import { ManageCenterEquipmentUseCase } from '../application/manage-center-equipment.use-case';
import { CENTER_SCHEDULE_CONTROLLERS } from '../center-schedule.providers';

/**
 * Route resolution with the real Nest router and the global validation pipe,
 * in the module's registration order. DOUBLE DECLARED: every use case is a
 * fake; guards are replaced (authorization is covered by `LabStaffGuard`'s
 * own suite). What this proves is which handler a path reaches.
 */
const UNIT = '33333333-3333-4333-8333-333333333333';
const ORDER = '66666666-6666-4666-8666-666666666666';
const ok = (tag: string) => jest.fn(async () => ({ tag }));

describe('center schedule routes (HTTP)', () => {
  let app: INestApplication;
  const reader = { forMe: ok('me'), forUnit: ok('unit') };
  const saver = { execute: ok('saved') };
  const equipment = { execute: ok('equipment') };
  const bookings = { execute: ok('bookings') };
  const devices = {
    create: ok('created'),
    update: ok('edited'),
    remove: ok('removed'),
  };
  const availability = { execute: ok('availability') };
  const options = { execute: ok('options') };
  const booker = { execute: ok('booked') };
  const canceller = { execute: jest.fn(async () => undefined) };
  const readService = { list: ok('list'), getById: ok('by-id') };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ...CENTER_SCHEDULE_CONTROLLERS,
        DiagnosticUnitsController,
        DiagnosticsPatientResultsController,
      ],
      providers: [
        { provide: GetCenterScheduleUseCase, useValue: reader },
        { provide: SaveCenterScheduleUseCase, useValue: saver },
        { provide: SetEquipmentStatusUseCase, useValue: equipment },
        { provide: ListCenterBookingsUseCase, useValue: bookings },
        { provide: ManageCenterEquipmentUseCase, useValue: devices },
        { provide: GetStudyAvailabilityUseCase, useValue: availability },
        { provide: GetBookingOptionsUseCase, useValue: options },
        { provide: BookOrderUseCase, useValue: booker },
        { provide: CancelOrderBookingUseCase, useValue: canceller },
        { provide: DiagnosticUnitsReadService, useValue: readService },
        ...[
          DiagnosticUnitsService,
          DiagnosticStudiesService,
          DiagnosticPricingService,
          DiagnosticUnitsAdminReadService,
          DiagnosticUnitsSearchService,
          DiagnosticsPatientResultsService,
        ].map((provide) => ({ provide, useValue: {} })),
      ],
    })
      .overrideGuard(LabStaffGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = { id: 'user-1', roles: ['PATIENT'] };
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());

  it('`me/schedule` reaches the `me` handler, not `:unitId` nor `:id`', async () => {
    const res = await http().get('/diagnostic-units/me/schedule').expect(200);
    expect(res.body).toEqual({ tag: 'me' });
  });

  it('`:unitId/schedule` validates the uuid and reaches the unit handler', async () => {
    await http()
      .get(`/diagnostic-units/${UNIT}/schedule`)
      .expect(200, { tag: 'unit' });
    await http().get('/diagnostic-units/not-a-uuid/schedule').expect(400);
  });

  it('`me/bookings` requires from/to and does not fall into `:id`', async () => {
    await http()
      .get('/diagnostic-units/me/bookings')
      .query({ from: '2026-11-04T04:00:00Z', to: '2026-11-05T04:00:00Z' })
      .expect(200, { tag: 'bookings' });
    await http().get('/diagnostic-units/me/bookings').expect(400);
    expect(readService.getById).not.toHaveBeenCalled();
  });

  it('`GET :id` keeps serving the directory detail', async () => {
    await http().get(`/diagnostic-units/${UNIT}`).expect(200, { tag: 'by-id' });
  });

  it('PUT schedule rejects a property the DTO does not declare', async () => {
    const block = {
      windows: [{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }],
      slotMinutes: 30,
    };
    const body = { general: block, modalities: [], studies: [] };
    await http()
      .put(`/diagnostic-units/${UNIT}/schedule`)
      .send(body)
      .expect(200);
    await http()
      .put(`/diagnostic-units/${UNIT}/schedule`)
      .send({ ...body, tenantId: 'x' })
      .expect(400);
    await http()
      .put(`/diagnostic-units/${UNIT}/schedule`)
      .send({ ...body, modalities: [{ modalityCode: 'ECG', schedule: block }] })
      .expect(400);
  });

  it('PATCH equipment only accepts the three statuses', async () => {
    const path = `/diagnostic-units/${UNIT}/equipment/${ORDER}`;
    await http().patch(path).send({ status: 'MAINTENANCE' }).expect(200);
    await http().patch(path).send({ status: 'BROKEN' }).expect(400);
  });

  it('equipment CRUD: register, edit and remove a production line', async () => {
    const base = `/diagnostic-units/${UNIT}/equipment`;
    await http()
      .post(base)
      .send({ name: 'Ecógrafo 2', modalityCode: 'ECO' })
      .expect(201, { tag: 'created' });
    await http().post(base).send({ name: '' }).expect(400);
    await http()
      .post(base)
      .send({ name: 'x', modalityCode: 'ECG' })
      .expect(400);
    await http()
      .put(`${base}/${ORDER}`)
      .send({ name: 'Ecógrafo B', modalityCode: null })
      .expect(200, { tag: 'edited' });
    await http().delete(`${base}/${ORDER}`).expect(200, { tag: 'removed' });
  });

  it('study availability is served on its own path', async () => {
    await http()
      .get(`/diagnostic-units/${UNIT}/study-availability`)
      .query({ studyCode: 'STUDY-ECO-ABD' })
      .expect(200, { tag: 'availability' });
  });

  it('order booking routes do not collide with `me/:reportId/*`', async () => {
    const base = `/diagnostic-results/me/orders/${ORDER}`;
    await http().get(`${base}/booking-options`).expect(200, { tag: 'options' });
    await http()
      .post(`${base}/booking`)
      .send({ unitId: UNIT, startAt: '2026-11-10T12:00:00.000Z' })
      .expect(201, { tag: 'booked' });
    await http().post(`${base}/booking`).send({ unitId: UNIT }).expect(400);
    await http().delete(`${base}/booking`).expect(204);
  });
});
