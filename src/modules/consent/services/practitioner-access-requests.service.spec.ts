import { jest } from '@jest/globals';

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

/**
 * MCH-024 — este servicio no tenía spec propio: `collectCoverageFrom` sólo
 * miraba `iam`/`common`/`terminology`, así que su cobertura era 0% y el
 * reporte ni lo mencionaba. No es un archivo cualquiera para probar esto: es
 * la puerta de autorización de FT-07 (quién puede leer la historia clínica de
 * quién), la clase de control que MCH-024-AC02 pide proteger.
 */

const actorProfesional = { id: 'prof-1', roles: ['PRACTITIONER'] } as any;
const actorPaciente = { id: 'pac-user-1', roles: ['PATIENT'] } as any;

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
          actorProfesional,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('crea la solicitud y avisa al paciente cuando no hay nada pendiente', async () => {
      const d = build();
      const creado = {
        id: 'c-nuevo',
        patientProfileId: 'pac-1',
        createdAt: new Date(),
        createdByUserId: actorProfesional.id,
      };
      d.consentsRepo.create.mockReturnValue(creado);
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue({
        userId: 'pac-user-1',
      });

      const res = await d.service.request(
        { patientProfileId: 'pac-1', specialtyConceptIds: ['esp-1'] } as any,
        actorProfesional,
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

  describe('decide (FT-07-R06/R07) — titularidad', () => {
    const solicitud = {
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
      d.consentsRepo.findById.mockResolvedValue(solicitud);
      // Sesión válida, pero de OTRO paciente.
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-intrusa',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-intruso', // distinto de solicitud.patientProfileId
      });

      await expect(
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPaciente),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('sin perfil de paciente vinculado a la sesión, tampoco decide', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(solicitud);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPaciente),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('el paciente titular sí puede rechazar su propia solicitud', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({ ...solicitud });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'persona-titular',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pac-titular',
      });

      const res = await d.service.decide(
        'c-1',
        { decision: 'DECLINED' } as any,
        actorPaciente,
      );

      expect(res.status).toBe(CONS.ACCESS_REQUEST_DECLINED);
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'ACCESS_DECLINED' }),
      );
    });
  });

  describe('decide (FT-07-R06) — no todo-o-nada', () => {
    const solicitud = {
      id: 'c-1',
      categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
      patientProfileId: 'pac-titular',
      statusConceptId: CONS.ACCESS_REQUEST_PENDING,
      createdByUserId: 'prof-1',
      tenantId: 'tenant-1',
    };

    function comoTitular(d: ReturnType<typeof build>) {
      d.consentsRepo.findById.mockResolvedValue({ ...solicitud });
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
      comoTitular(d);

      await expect(
        d.service.decide(
          'c-1',
          {
            decision: 'ACCEPTED',
            authorizedSpecialtyConceptIds: ['esp-NO-PEDIDA'],
          } as any,
          actorPaciente,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza aceptar sin autorizar ninguna especialidad', async () => {
      const d = build();
      comoTitular(d);

      await expect(
        d.service.decide(
          'c-1',
          { decision: 'ACCEPTED', authorizedSpecialtyConceptIds: [] } as any,
          actorPaciente,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('acepta un subconjunto válido y crea el grant clínico', async () => {
      const d = build();
      comoTitular(d);

      const res = await d.service.decide(
        'c-1',
        {
          decision: 'ACCEPTED',
          authorizedSpecialtyConceptIds: ['esp-1'],
        } as any,
        actorPaciente,
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

    it('no duplica el grant clínico si ya hay uno activo', async () => {
      const d = build();
      comoTitular(d);
      d.clinicalGrantsRepo.findActive.mockResolvedValue({ id: 'grant-ya' });

      await d.service.decide(
        'c-1',
        {
          decision: 'ACCEPTED',
          authorizedSpecialtyConceptIds: ['esp-1'],
        } as any,
        actorPaciente,
      );

      expect(d.clinicalGrantsRepo.create).not.toHaveBeenCalled();
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
        d.service.decide('c-1', { decision: 'DECLINED' } as any, actorPaciente),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('una solicitud inexistente (o de otra categoría) da 404', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.decide(
          'c-inexistente',
          { decision: 'DECLINED' } as any,
          actorPaciente,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
