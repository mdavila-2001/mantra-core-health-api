import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingWalkInService } from './scheduling-walk-in.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { SCHED } from '../scheduling.concepts';

const actor = { id: 'actor-1', roles: ['SCHEDULING_AGENT'] };

const DTO = {
  patient: {
    name: 'Lucía',
    lastName: 'Mamani',
    nationalId: '1234567',
    phone: '+591 70000000',
  },
  resourceId: 'resource-1',
  startAt: '2026-09-15T14:00:00.000Z',
  durationMinutes: 30,
  // Distinto del default ausente (presencial), para que la aserción del
  // camino feliz no pase por casualidad si el servicio dejara de mandarlo.
  channel: 'TELECONSULTA',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * El alta del paciente (`createWalkInPatient`) NO se dobla: corre de verdad
 * sobre repositorios simulados, igual que sus propias pruebas
 * (`walk-in-patient.spec.ts`), así que lo que este archivo cubre es qué hace
 * el SERVICIO con lo que esa función devuelve o lanza — un doble del módulo
 * habría probado un contrato inventado, no el real.
 */
function build() {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };

  const bookingResult = {
    booking: {
      id: 'booking-1',
      tenantId: 'tenant-1',
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
    },
    slot: { id: 'slot-1' },
    appointment: { id: 'appt-1', practitionerProfileId: 'hpid-1' },
    retractedSlots: 0,
  };
  const bookingsService = {
    crearCitaDirectaEnTransaccion: mockFn().mockResolvedValue(bookingResult),
    iniciarEnTransaccion: mockFn(async (_tx: any, booking: any) => {
      booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
    }),
  };

  const encountersRepo = {
    create: mockFn(() => ({ id: 'encounter-1', startAt: new Date() })),
    createParticipant: mockFn(),
  };

  const personsRepo = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'person-1', ...datos })),
  };
  const personProfilesRepo = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'profile-1', ...datos })),
  };
  const patientProfilesRepo = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'patient-1', ...datos })),
  };
  const identifiersRepo = {
    findActiveDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn((_tx: any, datos: any) => ({ id: 'ident-1', ...datos })),
  };
  const contactPointsRepo = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'contact-1', ...datos })),
  };
  const relatedPersonsRepo = {
    create: mockFn((_tx: any, datos: any) => ({ id: 'related-1', ...datos })),
  };

  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const service = new SchedulingWalkInService(
    em,
    bookingsService as any,
    encountersRepo as any,
    personsRepo as any,
    personProfilesRepo as any,
    patientProfilesRepo as any,
    identifiersRepo as any,
    contactPointsRepo as any,
    relatedPersonsRepo as any,
    logger as any,
  );

  return {
    service,
    em,
    tx,
    bookingsService,
    encountersRepo,
    identifiersRepo,
  };
}

describe('SchedulingWalkInService.createWalkInAppointment', () => {
  it('camino feliz: una sola transacción, alta, cita WALK_IN, encuentro y arranque', async () => {
    const { service, em, tx, bookingsService, encountersRepo } = build();

    const resultado = await service.createWalkInAppointment(DTO, actor as any);

    expect(em.transactional.mock.calls).toHaveLength(1);
    expect(bookingsService.crearCitaDirectaEnTransaccion).toHaveBeenCalledWith(
      tx,
      // `patient_profiles.profile_id` ES `persons.id`: por eso el paciente que
      // acaba de nacer se identifica por ese mismo valor. `channel` viaja tal
      // cual el dto lo declaró: es la modalidad de la cita, no el canal de
      // la reserva (que el servicio fija en `WALK_IN` más abajo).
      expect.objectContaining({
        patientProfileId: 'person-1',
        channel: 'TELECONSULTA',
      }),
      actor,
      { bookingChannel: 'WALK_IN' },
    );
    expect(encountersRepo.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
        appointmentId: 'appt-1',
        primaryPractitionerId: 'hpid-1',
      }),
    );
    expect(encountersRepo.createParticipant).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        encounterId: 'encounter-1',
        practitionerProfileId: 'hpid-1',
      }),
    );
    expect(bookingsService.iniciarEnTransaccion).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: 'booking-1' }),
      actor,
    );

    expect(resultado).toEqual({
      patientProfileId: 'person-1',
      personId: 'person-1',
      patientCode: expect.stringMatching(/^PAT-/),
      bookingId: 'booking-1',
      bookableSlotId: 'slot-1',
      appointmentId: 'appt-1',
      encounterId: 'encounter-1',
      statusConceptId: SCHED.BOOKING_IN_PROGRESS,
      retractedSlots: 0,
    });
  });

  it('el conflicto del alta sale de la transacción sin llamar a la cita', async () => {
    const { service, bookingsService, identifiersRepo } = build();
    identifiersRepo.findActiveDuplicate.mockResolvedValue({
      id: 'ident-existente',
    });

    await expect(
      service.createWalkInAppointment(DTO, actor as any),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      bookingsService.crearCitaDirectaEnTransaccion,
    ).not.toHaveBeenCalled();
  });

  it('el choque de horario de la cita sale sin crear el encuentro', async () => {
    const { service, bookingsService, encountersRepo } = build();
    bookingsService.crearCitaDirectaEnTransaccion.mockRejectedValue(
      new PreconditionFailedException('El paciente ya tiene un turno'),
    );

    await expect(
      service.createWalkInAppointment(DTO, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    expect(encountersRepo.create).not.toHaveBeenCalled();
  });

  it('el fallo al crear el encuentro sale sin iniciar la reserva', async () => {
    const { service, bookingsService, encountersRepo } = build();
    encountersRepo.create.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(
      service.createWalkInAppointment(DTO, actor as any),
    ).rejects.toThrow('boom');

    expect(bookingsService.iniciarEnTransaccion).not.toHaveBeenCalled();
  });
});
