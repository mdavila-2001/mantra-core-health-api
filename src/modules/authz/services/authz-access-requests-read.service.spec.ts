import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import { AUTHZ } from '../authz.concepts';
import { AuthzAccessRequestsReadService } from './authz-access-requests-read.service';
import {
  ACTIVE_TENANT,
  buildClinicalScope,
  inTenant,
} from './authz-clinical-scope.testing';

const DAY = 86_400_000;
const past = new Date(Date.now() - 10 * DAY);
const yesterday = new Date(Date.now() - DAY);
const patient = {
  id: 'u-pat',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;
const doctor = {
  id: 'u-doc',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'prac-1',
} as any;

/** A care relationship row (circuit B). */
const care = (over: Record<string, unknown>): any => ({
  id: 'cr',
  tenantId: ACTIVE_TENANT,
  patientProfileId: 'pat-1',
  practitionerProfileId: 'prac-1',
  relationshipTypeConceptId: AUTHZ.CARE_REL_TREATING,
  statusConceptId: CONCEPTS.STATE_PENDING,
  establishedByUserId: 'u-doc',
  validFrom: past,
  validTo: null,
  createdAt: past,
  ...over,
});

/** A practitioner-access consent row (circuit A). */
const consent = (over: Record<string, unknown>): any => ({
  id: 'co',
  tenantId: ACTIVE_TENANT,
  patientProfileId: 'pat-1',
  createdByUserId: 'u-doc',
  statusConceptId: CONS.ACCESS_REQUEST_PENDING,
  validFrom: null,
  validTo: null,
  createdAt: past,
  ...over,
});

/** Builds the service under test with a controlled repository. */
function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    careOfPatient: mockFn().mockResolvedValue([]),
    careOfPractitioner: mockFn().mockResolvedValue([]),
    accessConsentsOfPatient: mockFn().mockResolvedValue([]),
    accessConsentsCreatedBy: mockFn().mockResolvedValue([]),
    provisionsOf: mockFn().mockResolvedValue([]),
    namesByPersonId: mockFn().mockResolvedValue(new Map()),
    personIdByUserId: mockFn().mockResolvedValue(new Map()),
  };
  const { scope } = buildClinicalScope();
  const service = new AuthzAccessRequestsReadService(
    em as any,
    scope,
    repo as any,
  );
  return { service: inTenant(service), em, fork, repo };
}

describe('AuthzAccessRequestsReadService', () => {
  describe('listForPatient', () => {
    it('sin perfil de paciente devuelve vacío sin consultar', async () => {
      const d = build();

      const out = await d.service.listForPatient({ id: 'u', roles: [] } as any);

      expect(out).toEqual([]);
      expect(d.repo.careOfPatient).not.toHaveBeenCalled();
    });

    it('lee con un fork que conserva la transacción de la petición y acotado al tenant activo', async () => {
      const d = build();

      await d.service.listForPatient(patient);

      expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
      expect(d.repo.careOfPatient).toHaveBeenCalledWith(
        d.fork,
        'pat-1',
        ACTIVE_TENANT,
      );
      expect(d.repo.accessConsentsOfPatient).toHaveBeenCalledWith(
        d.fork,
        'pat-1',
        ACTIVE_TENANT,
      );
    });

    it('las de un profesional son recibidas: la cabecera es CABECERA y las demás ATENCION', async () => {
      const d = build();
      d.repo.careOfPatient.mockResolvedValue([
        care({
          id: 'cab',
          relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
        }),
        care({ id: 'vis', createdAt: new Date(past.getTime() - DAY) }),
      ]);
      d.repo.namesByPersonId.mockResolvedValue(
        new Map([['prac-1', 'Dra. Ana Pérez']]),
      );

      const out = await d.service.listForPatient(patient);

      expect(out.map((i) => [i.id, i.kind, i.direction, i.status])).toEqual([
        ['cab', 'CABECERA', 'RECEIVED', 'PENDING'],
        ['vis', 'ATENCION', 'RECEIVED', 'PENDING'],
      ]);
      expect(out[0]).toMatchObject({
        counterpart: { profileId: 'prac-1', displayName: 'Dra. Ana Pérez' },
        requestedAt: past,
        decidedAt: null,
        requestedSpecialtyConceptIds: [],
        authorizedSpecialtyConceptIds: [],
      });
    });

    it('la cabecera que pidió el propio paciente es enviada', async () => {
      const d = build();
      d.repo.careOfPatient.mockResolvedValue([
        care({
          relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
          establishedByUserId: 'u-pat',
        }),
      ]);

      const out = await d.service.listForPatient(patient);

      expect(out[0]).toMatchObject({ kind: 'CABECERA', direction: 'SENT' });
    });

    it('mapea cada estado de B y deja fuera el que no conoce', async () => {
      const d = build();
      const row = (id: string, statusConceptId: string, validTo: any = null) =>
        care({ id, statusConceptId, validTo });
      d.repo.careOfPatient.mockResolvedValue([
        row('pen', CONCEPTS.STATE_PENDING),
        row('act', CONCEPTS.STATE_ACTIVE),
        row('act-vencida', CONCEPTS.STATE_ACTIVE, yesterday),
        row('rev', CONCEPTS.STATE_REVOKED, yesterday),
        row('exp', CONCEPTS.STATE_EXPIRED, yesterday),
        row('rec', AUTHZ.CARE_REL_STATUS_DECLINED, yesterday),
        row('raro', 'concepto-desconocido'),
      ]);

      const out = await d.service.listForPatient(patient);

      expect(Object.fromEntries(out.map((i) => [i.id, i.status]))).toEqual({
        pen: 'PENDING',
        act: 'ACTIVE',
        'act-vencida': 'EXPIRED',
        rev: 'REVOKED',
        exp: 'EXPIRED',
        rec: 'REJECTED',
      });
      const byId = Object.fromEntries(out.map((i) => [i.id, i]));
      expect(byId.pen.decidedAt).toBeNull();
      expect(byId.act.decidedAt).toEqual(past);
      expect(byId.rec.decidedAt).toEqual(yesterday);
    });

    it('una relación acotada a pago no es una solicitud de acceso y no se muestra', async () => {
      const d = build();
      d.repo.careOfPatient.mockResolvedValue([
        care({
          id: 'pago',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          purposeConceptId: AUTHZ.PURPOSE_PAYMENT,
        }),
        care({
          id: 'trat',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          purposeConceptId: AUTHZ.PURPOSE_TREATMENT,
        }),
      ]);

      const out = await d.service.listForPatient(patient);

      expect(out.map((i) => i.id)).toEqual(['trat']);
    });

    it('las granulares son recibidas, con las especialidades pedidas y las autorizadas', async () => {
      const d = build();
      d.repo.accessConsentsOfPatient.mockResolvedValue([
        consent({
          id: 'gra',
          statusConceptId: CONS.CONSENT_ACTIVE,
          validFrom: yesterday,
          validTo: new Date(Date.now() + 30 * DAY),
        }),
      ]);
      d.repo.provisionsOf.mockResolvedValue([
        {
          consentId: 'gra',
          dataClassConceptId: 'esp-1',
          actionConceptId: CONS.ACTION_PERMIT,
        },
        {
          consentId: 'gra',
          dataClassConceptId: 'esp-2',
          actionConceptId: CONS.ACTION_DENY,
        },
      ]);
      d.repo.personIdByUserId.mockResolvedValue(new Map([['u-doc', 'prac-1']]));
      d.repo.namesByPersonId.mockResolvedValue(
        new Map([['prac-1', 'Dr. Luis Gómez']]),
      );

      const out = await d.service.listForPatient(patient);

      expect(out).toEqual([
        {
          id: 'gra',
          kind: 'GRANULAR',
          direction: 'RECEIVED',
          counterpart: { profileId: 'prac-1', displayName: 'Dr. Luis Gómez' },
          requestedAt: past,
          decidedAt: yesterday,
          status: 'ACTIVE',
          requestedSpecialtyConceptIds: ['esp-1', 'esp-2'],
          authorizedSpecialtyConceptIds: ['esp-1'],
        },
      ]);
    });

    it('mapea cada estado de A', async () => {
      const d = build();
      d.repo.accessConsentsOfPatient.mockResolvedValue([
        consent({ id: 'pen' }),
        consent({ id: 'act', statusConceptId: CONS.CONSENT_ACTIVE }),
        consent({
          id: 'rec',
          statusConceptId: CONS.ACCESS_REQUEST_DECLINED,
          validTo: yesterday,
        }),
        consent({
          id: 'ret',
          statusConceptId: CONS.CONSENT_WITHDRAWN,
          validFrom: past,
          validTo: yesterday,
        }),
        consent({ id: 'exp', statusConceptId: CONS.CONSENT_EXPIRED }),
      ]);

      const out = await d.service.listForPatient(patient);

      expect(Object.fromEntries(out.map((i) => [i.id, i.status]))).toEqual({
        pen: 'PENDING',
        act: 'ACTIVE',
        rec: 'REJECTED',
        ret: 'REVOKED',
        exp: 'EXPIRED',
      });
      expect(out.find((i) => i.id === 'rec')?.decidedAt).toEqual(yesterday);
    });

    it('un profesional sin persona vinculada queda sin profileId ni nombre, no inventado', async () => {
      const d = build();
      d.repo.accessConsentsOfPatient.mockResolvedValue([consent({})]);

      const out = await d.service.listForPatient(patient);

      expect(out[0].counterpart).toEqual({});
    });

    it('ordena la más reciente primero', async () => {
      const d = build();
      d.repo.careOfPatient.mockResolvedValue([
        care({ id: 'vieja', createdAt: past }),
      ]);
      d.repo.accessConsentsOfPatient.mockResolvedValue([
        consent({ id: 'nueva', createdAt: yesterday }),
      ]);

      const out = await d.service.listForPatient(patient);

      expect(out.map((i) => i.id)).toEqual(['nueva', 'vieja']);
    });
  });

  describe('listForPractitioner', () => {
    it('sin perfil profesional devuelve vacío sin consultar', async () => {
      const d = build();

      const out = await d.service.listForPractitioner({
        id: 'u',
        roles: [],
      } as any);

      expect(out).toEqual([]);
      expect(d.repo.careOfPractitioner).not.toHaveBeenCalled();
    });

    it('recibidas: sólo las cabeceras que inició un paciente; enviadas: lo que él mismo inició', async () => {
      const d = build();
      d.repo.careOfPractitioner.mockResolvedValue([
        care({
          id: 'cab-recibida',
          relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
          establishedByUserId: 'u-pat',
        }),
        care({
          id: 'cab-enviada',
          relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
          establishedByUserId: 'u-doc',
        }),
        care({ id: 'vis-enviada', establishedByUserId: 'u-doc' }),
        // Started by someone else and not a primary-care request: it is not his inbox.
        care({ id: 'ajena', establishedByUserId: 'u-recepcion' }),
      ]);
      d.repo.namesByPersonId.mockResolvedValue(
        new Map([['pat-1', 'Marta Rojas']]),
      );

      const out = await d.service.listForPractitioner(doctor);

      expect(Object.fromEntries(out.map((i) => [i.id, i.direction]))).toEqual({
        'cab-recibida': 'RECEIVED',
        'cab-enviada': 'SENT',
        'vis-enviada': 'SENT',
      });
      expect(out[0].counterpart).toEqual({
        profileId: 'pat-1',
        displayName: 'Marta Rojas',
      });
    });

    it('las granulares que pidió son enviadas, con el paciente como contraparte', async () => {
      const d = build();
      d.repo.accessConsentsCreatedBy.mockResolvedValue([
        consent({ id: 'gra', statusConceptId: CONS.ACCESS_REQUEST_DECLINED }),
      ]);
      d.repo.namesByPersonId.mockResolvedValue(
        new Map([['pat-1', 'Marta Rojas']]),
      );

      const out = await d.service.listForPractitioner(doctor);

      expect(d.repo.accessConsentsCreatedBy).toHaveBeenCalledWith(
        d.fork,
        'u-doc',
        ACTIVE_TENANT,
      );
      expect(out).toEqual([
        expect.objectContaining({
          id: 'gra',
          kind: 'GRANULAR',
          direction: 'SENT',
          status: 'REJECTED',
          counterpart: { profileId: 'pat-1', displayName: 'Marta Rojas' },
        }),
      ]);
    });
  });
});
