import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { Provider } from '@nestjs/common';
import { SchedulingBookingsService } from './application/bookings/scheduling-bookings.service';
import { SchedulingCatalogService } from './application/catalog/scheduling-catalog.service';
import { SchedulingWalkInService } from './application/walk-in/scheduling-walk-in.service';
import { AGENDA_NOTICE_PORT } from './application/ports/agenda-notice.port';
import { BOOKING_HISTORY_PORT } from './application/ports/booking-history.port';
import { CLINICAL_APPOINTMENTS_PORT } from './application/ports/clinical-appointments.port';
import { CLINICAL_ENCOUNTERS_PORT } from './application/ports/clinical-encounters.port';
import { FORM_ORIGIN_PORT } from './application/ports/form-origin.port';
import { INSURANCE_READ_PORT } from './application/ports/insurance-read.port';
import { PATIENT_REPRESENTATION_PORT } from './application/ports/patient-representation.port';
import { PRACTITIONER_AFFILIATIONS_PORT } from './application/ports/practitioner-affiliations.port';
import { PRACTITIONER_DIRECTORY_PORT } from './application/ports/practitioner-directory.port';
import { TENANT_DIRECTORY_PORT } from './application/ports/tenant-directory.port';
import { WALK_IN_PATIENT_REGISTRY_PORT } from './application/ports/walk-in-patient-registry.port';
import { SchedulingModule } from './scheduling.module';

/**
 * El grafo de inyección del módulo se resuelve.
 *
 * Con la agenda partida en casos de uso, puertos y adaptadores, un token mal
 * cableado no se vería hasta arrancar la app. Esta prueba arma los proveedores
 * **propios** del módulo con sus controllers y reemplaza por dobles lo que
 * llega de otros módulos (`imports`): si falta un `provide` o un `@Inject`, la
 * compilación del módulo falla acá.
 *
 * No prueba comportamiento ni arranca la base: es la comprobación de DI.
 */
describe('SchedulingModule · grafo de inyección', () => {
  const providers = Reflect.getMetadata(
    'providers',
    SchedulingModule,
  ) as Provider[];
  const controllers = Reflect.getMetadata(
    'controllers',
    SchedulingModule,
  ) as never[];

  it('provee explícitamente cada puerto (el mocker no puede taparlo)', () => {
    const provided = providers
      .filter(
        (p): p is { provide: unknown } =>
          typeof p === 'object' && 'provide' in p,
      )
      .map((p) => p.provide);
    for (const token of [
      AGENDA_NOTICE_PORT,
      BOOKING_HISTORY_PORT,
      CLINICAL_APPOINTMENTS_PORT,
      CLINICAL_ENCOUNTERS_PORT,
      FORM_ORIGIN_PORT,
      INSURANCE_READ_PORT,
      PATIENT_REPRESENTATION_PORT,
      PRACTITIONER_AFFILIATIONS_PORT,
      PRACTITIONER_DIRECTORY_PORT,
      TENANT_DIRECTORY_PORT,
      WALK_IN_PATIENT_REGISTRY_PORT,
    ]) {
      expect(provided).toContain(token);
    }
  });

  it('resuelve las fachadas con todos sus casos de uso y puertos', async () => {
    const moduleRef = await Test.createTestingModule({ providers, controllers })
      .useMocker(() => ({
        setContext: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fork: () => ({}),
      }))
      .compile();

    expect(moduleRef.get(SchedulingBookingsService)).toBeInstanceOf(
      SchedulingBookingsService,
    );
    expect(moduleRef.get(SchedulingCatalogService)).toBeInstanceOf(
      SchedulingCatalogService,
    );
    expect(moduleRef.get(SchedulingWalkInService)).toBeInstanceOf(
      SchedulingWalkInService,
    );
  });
});
