import { jest } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PractitionerAccessRequestsService } from './practitioner-access-requests.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CONS } from '../consent.concepts';
import {
  DecidePractitionerAccessRequestDto,
  RequestPractitionerAccessDto,
} from '../dto';

// Specialties of VS_MEDICAL_SPECIALTY come from a deterministic UUID v5.
const SPECIALTY_V5 = '3b9c1e5e-7c2b-5d3a-8f6e-1a2b3c4d5e6f';

/**
 * MCH-024 — este servicio no tenía spec propio: `collectCoverageFrom` sólo
 * miraba `iam`/`common`/`terminology`, así que su cobertura era 0% y el
 * reporte ni lo mencionaba. No es un archivo cualquiera para probar esto: es
 * la puerta de autorización de FT-07 (quién puede leer la historia clínica de
 * quién), la clase de control que MCH-024-AC02 pide proteger.
 */

const actorProfessional = { id: 'prof-1', roles: ['PRACTITIONER'] } as any;
const actorPatient = { id: 'pac-user-1', roles: ['PATIENT'] } as any;

/** Construye el sistema bajo prueba con dependencias controladas. */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => ({})),
  };
  const consentsRepo = {
    findByPatientCreatorCategory: mockFn().mockResolvedValue([]),
    create: mockFn(),
    findById: mockFn(),
  };
  const provisionsRepo = {
    create: mockFn(),
    findOpenByConsent: mockFn().mockResolvedValue([]),
  };
  const eventsRepo = { record: mockFn() };
  const clinicalGrantsRepo = {
    findActive: mockFn().mockResolvedValue(null),
    findActiveByConsent: mockFn().mockResolvedValue([{ id: 'grant-vivo' }]),
    create: mockFn(),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn(),
    findActiveByPerson: mockFn().mockResolvedValue(undefined),
  };
  const patientProfilesRepo = { findById: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const notices = { emit: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PractitionerAccessRequestsService(
    em as any,
    consentsRepo as any,
    provisionsRepo as any,
    eventsRepo as any,
    clinicalGrantsRepo as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    auditTrail as any,
    notices as any,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    consentsRepo,
    provisionsRepo,
    eventsRepo,
    clinicalGrantsRepo,
    accountLinksRepo,
    patientProfilesRepo,
    auditTrail,
    notices,
  };
}

describe('PractitionerAccessRequestsService', () => {
  describe('request (FT-07-R05)', () => {
    it('rechaza una segunda solicitud mientras haya una pendiente o un vínculo activo', async () => {
      const d = build();
      d.consentsRepo.findByPatientCreatorCategory.mockResolvedValue([
        { id: 'c-previo', statusConceptId: CONS.ACCESS_REQUEST_PENDING },
      ]);

      await expect(
        d.service.request(
          { patientProfileId: 'pac-1', specialtyConceptIds: ['esp-1'] } as any,
          actorProfessional,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('crea la solicitud y avisa al paciente cuando no hay nada pendiente', async () => {
      const d = build();
      const created = {
        id: 'c-nuevo',
        patientProfileId: 'pac-1',
        createdAt: new Date(),
        createdByUserId: actorProfessional.id,
      };
      d.consentsRepo.create.mockReturnValue(created);
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue({
        userId: 'pac-user-1',
      });

      const res = await d.service.request(
        { patientProfileId: 'pac-1', specialtyConceptIds: ['esp-1'] } as any,
        actorProfessional,
      );

      expect(res.id).toBe('c-nuevo');
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'ACCESS_REQUESTED',
          recipientUserId: 'pac-user-1',
        }),
      );
    });
  });

  describe('request — vínculo ya revocado', () => {
    const body = {
      patientProfileId: 'pac-1',
      specialtyConceptIds: ['esp-1'],
    } as any;

    function withCreated(d: ReturnType<typeof build>) {
      d.consentsRepo.create.mockReturnValue({
        id: 'c-nuevo',
        patientProfileId: 'pac-1',
        createdAt: new Date(),
      });
    }

    it('un vínculo activo sin ningún grant activo ya no cuenta como en curso: se retira y se puede volver a pedir', async () => {
      const d = build();
      withCreated(d);
      const stale: any = {
        id: 'c-viejo',
        statusConceptId: CONS.CONSENT_ACTIVE,
        updatedAt: new Date(),
      };
      d.consentsRepo.findByPatientCreatorCategory.mockResolvedValue([stale]);
      d.clinicalGrantsRepo.findActiveByConsent.mockResolvedValue([]);

      const res = await d.service.request(body, actorProfessional);

      expect(res.id).toBe('c-nuevo');
      expect(stale.statusConceptId).toBe(CONS.CONSENT_WITHDRAWN);
      expect(stale.validTo).toBeInstanceOf(Date);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          subjectId: 'c-viejo',
          eventTypeConceptId: CONS.EVENT_WITHDRAWN,
          newStatusConceptId: CONS.CONSENT_WITHDRAWN,
        }),
      );
    });

    it('un vínculo activo con su grant activo sigue dando 409', async () => {
      const d = build();
      d.consentsRepo.findByPatientCreatorCategory.mockResolvedValue([
        { id: 'c-vivo', statusConceptId: CONS.CONSENT_ACTIVE },
      ]);

      await expect(
        d.service.request(body, actorProfessional),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.clinicalGrantsRepo.findActiveByConsent).toHaveBeenCalledWith(
        d.tx,
        'c-vivo',
      );
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('un vínculo ya retirado o rechazado no bloquea y no se consulta su grant', async () => {
      const d = build();
      withCreated(d);
      d.consentsRepo.findByPatientCreatorCategory.mockResolvedValue([
        { id: 'c-1', statusConceptId: CONS.CONSENT_WITHDRAWN },
        { id: 'c-2', statusConceptId: CONS.ACCESS_REQUEST_DECLINED },
      ]);

      await d.service.request(body, actorProfessional);

      expect(d.clinicalGrantsRepo.findActiveByConsent).not.toHaveBeenCalled();
    });
  });

  describe('DTO — especialidades reales (UUID v5)', () => {
    it('la solicitud acepta una especialidad UUID v5', async () => {
      const dto = plainToInstance(RequestPractitionerAccessDto, {
        patientProfileId: '9f1c2b3a-4d5e-4f60-8a7b-0c1d2e3f4a5b',
        specialtyConceptIds: [SPECIALTY_V5],
      });
      expect(await validate(dto)).toEqual([]);
    });

    it('la decisión acepta una especialidad UUID v5 y sigue rechazando lo que no es UUID', async () => {
      const ok = plainToInstance(DecidePractitionerAccessRequestDto, {
        decision: 'ACCEPTED',
        authorizedSpecialtyConceptIds: [SPECIALTY_V5],
      });
      expect(await validate(ok)).toEqual([]);

      const bad = plainToInstance(DecidePractitionerAccessRequestDto, {
        decision: 'ACCEPTED',
        authorizedSpecialtyConceptIds: ['no-es-uuid'],
      });
      expect((await validate(bad)).length).toBeGreaterThan(0);
    });
  });

  describe('decide (FT-07-R06/R07) — titularidad', () => {
    const request = {
      id: 'c-1',
      categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
      patientProfileId: 'pac-titular',
      statusConceptId: CONS.ACCESS_REQUEST_PENDING,
      createdByUserId: 'prof-1',
    };

    // MCH-024-AC02: éste es el control crítico. Sin él, cualquier cuenta con
    // sesión de paciente podría aceptar o rechazar la solicitud de acceso de
    // OTRO paciente con sólo adivinar/enumerar el id de la solicitud.
    it('quien no es el paciente titular no puede decidir — 404, no 403 (no revela existencia)', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(request);
      // Sesión válida, pero de OTRO paciente.
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-intrusa',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-intruso', // distinto de solicitud.patientProfileId
      });

      await expect(
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPatient),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('sin perfil de paciente vinculado a la sesión, tampoco decide', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(request);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPatient),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('el paciente titular sí puede rechazar su propia solicitud', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({ ...request });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-titular',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-titular',
      });

      const res = await d.service.decide(
        'c-1',
        { decision: 'DECLINED' } as any,
        actorPatient,
      );

      expect(res.status).toBe(CONS.ACCESS_REQUEST_DECLINED);
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'ACCESS_DECLINED' }),
      );
    });

    it('P-10: el aviso sale después del commit, no desde dentro de la transacción', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({ ...request });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-titular',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-titular',
      });
      let insideTransaction = false;
      let noticeInside: boolean | undefined;
      d.em.transactional.mockImplementation(async (cb: any) => {
        insideTransaction = true;
        try {
          return await cb(d.tx);
        } finally {
          insideTransaction = false;
        }
      });
      d.notices.emit.mockImplementation(async () => {
        noticeInside = insideTransaction;
      });

      await d.service.decide(
        'c-1',
        { decision: 'DECLINED' } as any,
        actorPatient,
      );

      expect(d.notices.emit).toHaveBeenCalledTimes(1);
      expect(noticeInside).toBe(false);
    });
  });

  describe('decide (FT-07-R06) — no todo-o-nada', () => {
    const request = {
      id: 'c-1',
      categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
      patientProfileId: 'pac-titular',
      statusConceptId: CONS.ACCESS_REQUEST_PENDING,
      createdByUserId: 'prof-1',
      tenantId: 'tenant-1',
    };

    function asHolder(d: ReturnType<typeof build>) {
      d.consentsRepo.findById.mockResolvedValue({ ...request });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-titular',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-titular',
      });
      d.provisionsRepo.findOpenByConsent.mockResolvedValue([
        { dataClassConceptId: 'esp-1' },
      ]);
    }

    // El otro control crítico del método: el paciente no puede "autorizar"
    // una especialidad que el profesional nunca pidió — sería escalar el
    // pedido original sin que nadie lo haya solicitado.
    it('rechaza autorizar una especialidad que no estaba en lo pedido', async () => {
      const d = build();
      asHolder(d);

      await expect(
        d.service.decide(
          'c-1',
          {
            decision: 'ACCEPTED',
            authorizedSpecialtyConceptIds: ['esp-NO-PEDIDA'],
          } as any,
          actorPatient,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza aceptar sin autorizar ninguna especialidad', async () => {
      const d = build();
      asHolder(d);

      await expect(
        d.service.decide(
          'c-1',
          { decision: 'ACCEPTED', authorizedSpecialtyConceptIds: [] } as any,
          actorPatient,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('acepta un subconjunto válido y crea el grant clínico', async () => {
      const d = build();
      asHolder(d);

      const res = await d.service.decide(
        'c-1',
        {
          decision: 'ACCEPTED',
          authorizedSpecialtyConceptIds: ['esp-1'],
        } as any,
        actorPatient,
      );

      expect(res.status).toBe(CONS.CONSENT_ACTIVE);
      expect(d.clinicalGrantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pac-titular',
          grantedUserId: 'prof-1',
        }),
      );
    });

    it('crea un grant propio, ligado al consent, aunque el par ya tenga otro activo', async () => {
      const d = build();
      asHolder(d);
      // Another active grant of the pair (emergency, administrative) must not be
      // reused: revoking this consent would not find it.
      d.clinicalGrantsRepo.findActive.mockResolvedValue({ id: 'grant-ya' });

      await d.service.decide(
        'c-1',
        {
          decision: 'ACCEPTED',
          authorizedSpecialtyConceptIds: ['esp-1'],
        } as any,
        actorPatient,
      );

      expect(d.clinicalGrantsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.clinicalGrantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          consentId: 'c-1',
          grantedUserId: 'prof-1',
        }),
      );
    });
  });

  describe('decide — estado', () => {
    it('una solicitud ya decidida no se puede volver a decidir', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c-1',
        categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
        patientProfileId: 'pac-titular',
        statusConceptId: CONS.ACCESS_REQUEST_DECLINED,
        createdByUserId: 'prof-1',
      });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-titular',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-titular',
      });

      await expect(
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPatient),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('una solicitud inexistente (o de otra categoría) da 404', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.decide(
          'c-inexistente',
          { decision: 'DECLINED' } as any,
          actorPatient,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
