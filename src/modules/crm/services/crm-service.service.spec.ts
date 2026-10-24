import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrmServiceService } from './crm-service.service';
import {
  CONCEPTS,
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CrmErrorReason } from '../crm.error-reasons';
import { inTenant, thrown } from './crm-tenant.testing';

const actor = { id: 'user-1', roles: ['CRM_AGENT'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
const UUID = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const forked = { fork: mockFn() };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const serviceRepo = {
    createActivity: mockFn(),
    createTask: mockFn(),
    createNote: mockFn(),
    createPartnership: mockFn(),
    createAgreement: mockFn(),
    createCase: mockFn(),
    findCaseByIdForUpdate: mockFn(),
    findCaseById: mockFn(),
    findCaseByNumber: mockFn(),
    createCaseComment: mockFn(),
    recordCaseStatusChange: mockFn(),
    findActivitiesByAccount: mockFn(),
    findCasesByAccount: mockFn(),
  };
  const salesRepo = {
    findAccountById: mockFn().mockResolvedValue({
      id: UUID,
      tenantId: TENANT,
      name: 'Cuenta',
    }),
    findOpportunityById: mockFn().mockResolvedValue({
      id: UUID,
      tenantId: TENANT,
    }),
    findContactById: mockFn().mockResolvedValue({ id: UUID, tenantId: TENANT }),
    findChannelEndpointForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new CrmServiceService(
    em as any,
    serviceRepo as any,
    salesRepo as any,
    logger as any,
  );
  return { service: inTenant(raw, TENANT), raw, tx, serviceRepo, salesRepo };
}

describe('CrmServiceService', () => {
  describe('createActivity (UC-49-05 y UC-49-06)', () => {
    const base = {
      tenantId: TENANT,
      subjectType: 'ACCOUNT' as const,
      subjectRefId: UUID,
      direction: 'OUTBOUND' as const,
    };

    it('creates the task subtype for a TASK activity', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'TASK' },
        actor,
      );

      expect(res.subtypeCreated).toBe(true);
      expect(d.serviceRepo.createTask).toHaveBeenCalled();
    });

    it('creates the note subtype and requires its body', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'NOTE', bodyText: 'Llamar la próxima semana' },
        actor,
      );

      expect(res.subtypeCreated).toBe(true);
      expect(d.serviceRepo.createNote).toHaveBeenCalled();
    });

    it('rejects a NOTE without body', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      await expect(
        d.service.createActivity(
          { ...base, activityType: 'NOTE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records a CALL without any subtype row', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'CALL' },
        actor,
      );

      expect(res.subtypeCreated).toBe(false);
      expect(d.serviceRepo.createTask).not.toHaveBeenCalled();
      expect(d.serviceRepo.createNote).not.toHaveBeenCalled();
    });
  });

  describe('createPartnership (UC-49-10)', () => {
    const dto = {
      tenantId: TENANT,
      name: 'Alianza Norte',
      partnershipType: 'REFERRAL' as const,
      partnerRefType: 'crm_accounts',
      partnerRefId: UUID,
    };

    it('creates the framework agreement when a commitment is given', async () => {
      const d = build();
      d.serviceRepo.createPartnership.mockReturnValue({ id: 'part-1' });
      d.serviceRepo.createAgreement.mockReturnValue({ id: 'agr-1' });

      const res = await d.service.createPartnership(
        { ...dto, commitmentAmount: '50000.00' },
        actor,
      );

      expect(res.agreementId).toBe('agr-1');
    });

    it('skips the agreement when there is no commitment', async () => {
      const d = build();
      d.serviceRepo.createPartnership.mockReturnValue({ id: 'part-1' });

      const res = await d.service.createPartnership(dto, actor);

      expect(res.agreementId).toBeUndefined();
      expect(d.serviceRepo.createAgreement).not.toHaveBeenCalled();
    });
  });

  describe('createCase (UC-49-11)', () => {
    const dto = {
      tenantId: TENANT,
      caseNumber: 'CASE-001',
      subject: 'Error de facturación',
    };

    it('opens the case and seeds its status history', async () => {
      const d = build();
      d.serviceRepo.findCaseByNumber.mockResolvedValue(null);
      d.serviceRepo.createCase.mockReturnValue({ id: 'case-1' });

      const res = await d.service.createCase(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.CASE_OPEN);
      expect(d.serviceRepo.recordCaseStatusChange).toHaveBeenCalled();
    });

    it('rejects a duplicate case number within the tenant', async () => {
      const d = build();
      d.serviceRepo.findCaseByNumber.mockResolvedValue({ id: 'case-existing' });

      await expect(
        d.service.createCase(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('changeCaseStatus (UC-49-12 y UC-49-13)', () => {
    it('stamps closedAt when the case reaches a closing state', async () => {
      const d = build();
      const serviceCase = {
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_IN_PROGRESS,
      };
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue(serviceCase);

      const res = await d.service.changeCaseStatus(
        UUID,
        { status: 'RESOLVED' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.CASE_RESOLVED);
      expect(res.closedAt).toEqual(expect.any(String));
    });

    it('records the transition in the case history', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_OPEN,
      });

      await d.service.changeCaseStatus(UUID, { status: 'IN_PROGRESS' }, actor);

      expect(d.serviceRepo.recordCaseStatusChange).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          fromStatusConceptId: CONCEPTS.CASE_OPEN,
          toStatusConceptId: CONCEPTS.CASE_IN_PROGRESS,
        }),
      );
    });

    it('rejects transitioning to the same status', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_OPEN,
      });

      await expect(
        d.service.changeCaseStatus(UUID, { status: 'OPEN' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to reopen a closed case through this path', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_CLOSED,
      });

      await expect(
        d.service.changeCaseStatus(UUID, { status: 'OPEN' }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addCaseComment (UC-49-12)', () => {
    it('adds the comment to an open case', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_OPEN,
      });
      d.serviceRepo.createCaseComment.mockReturnValue({ id: 'comment-1' });

      const res = await d.service.addCaseComment(
        UUID,
        { commentText: 'Revisado' },
        actor,
      );

      expect(res.id).toBe('comment-1');
    });

    it('refuses to comment on a closed case', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_CLOSED,
      });

      await expect(
        d.service.addCaseComment(UUID, { commentText: 'Tardío' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('setChannelOptIn (UC-49-15)', () => {
    it('revoking consent flags the endpoint as do-not-contact', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({
        id: 'contact-1',
        tenantId: TENANT,
      });
      const endpoint = { id: 'ep-1', contactId: UUID, doNotContact: false };
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue(endpoint);

      const res = await d.service.setChannelOptIn(
        UUID,
        UUID,
        { optIn: false },
        actor,
      );

      expect(res.doNotContact).toBe(true);
      expect(endpoint.doNotContact).toBe(true);
    });

    it('granting consent clears the flag', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({
        id: 'contact-1',
        tenantId: TENANT,
      });
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: UUID,
        doNotContact: true,
      });

      const res = await d.service.setChannelOptIn(
        UUID,
        UUID,
        { optIn: true },
        actor,
      );

      expect(res.doNotContact).toBe(false);
    });

    it('rejects an endpoint that belongs to another contact', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({
        id: 'contact-1',
        tenantId: TENANT,
      });
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: 'another-contact',
      });

      await expect(
        d.service.setChannelOptIn(UUID, UUID, { optIn: true }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('getAccount360 (UC-49-14)', () => {
    it('aggregates activities and cases without opening a write transaction', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({
        id: 'acc-1',
        tenantId: TENANT,
        name: 'Clínica Sur',
      });
      d.serviceRepo.findActivitiesByAccount.mockResolvedValue([{}, {}]);
      d.serviceRepo.findCasesByAccount.mockResolvedValue([{}]);

      const res = await d.service.getAccount360(UUID);

      expect(res).toEqual({
        accountId: UUID,
        name: 'Clínica Sur',
        activityCount: 2,
        caseCount: 1,
      });
    });

    it('throws when the account does not exist', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue(null);

      await expect(d.service.getAccount360(UUID)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('tenant del actor (CRM-01)', () => {
    const activity = {
      tenantId: TENANT,
      subjectType: 'ACCOUNT' as const,
      subjectRefId: UUID,
      direction: 'OUTBOUND' as const,
      activityType: 'CALL' as const,
    };

    it('Correcto: la actividad nace con el tenant del contexto y sus referencias se resuelven en él', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });
      await d.service.createActivity(
        { ...activity, crmAccountId: UUID, contactId: UUID },
        actor,
      );
      expect(d.serviceRepo.createActivity).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
      expect(d.salesRepo.findAccountById).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
      expect(d.salesRepo.findContactById).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
    });

    it('Falla catalogada: tenantId del cuerpo distinto del activo da 403 CRM_TENANT_SCOPE_REQUIRED sin persistir', async () => {
      const d = build();
      const results = await Promise.all([
        thrown(
          d.service.createActivity(
            { ...activity, tenantId: OTHER_TENANT },
            actor,
          ),
        ),
        thrown(
          d.service.createCase(
            { tenantId: OTHER_TENANT, caseNumber: 'C-1', subject: 'x' },
            actor,
          ),
        ),
        thrown(
          d.service.createPartnership(
            {
              tenantId: OTHER_TENANT,
              name: 'x',
              partnershipType: 'REFERRAL',
              partnerRefType: 't',
              partnerRefId: UUID,
            },
            actor,
          ),
        ),
      ]);
      for (const err of results) {
        expect(err.getStatus()).toBe(403);
        expect(err.reason).toBe(CrmErrorReason.CRM_TENANT_SCOPE_REQUIRED);
      }
      expect(d.serviceRepo.createActivity).not.toHaveBeenCalled();
      expect(d.serviceRepo.createCase).not.toHaveBeenCalled();
      expect(d.serviceRepo.createPartnership).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no se crea nada', async () => {
      const d = build();
      await expect(
        d.raw.createCase(
          { tenantId: TENANT, caseNumber: 'C-1', subject: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.serviceRepo.createCase).not.toHaveBeenCalled();
    });

    it.each([
      [
        'comentar',
        (d: any) => d.service.addCaseComment(UUID, { commentText: 'x' }, actor),
      ],
      [
        'cambiar el estado',
        (d: any) =>
          d.service.changeCaseStatus(UUID, { status: 'CLOSED' }, actor),
      ],
    ])(
      'Error: %s el caso de B responde 404 uniforme, sin comentario ni cambio de estado',
      async (_name, call) => {
        const d = build();
        const foreign: any = {
          id: UUID,
          tenantId: OTHER_TENANT,
          statusConceptId: CONCEPTS.CASE_OPEN,
        };
        // El repositorio respeta `(id, tenantId)`; aun si no lo hiciera, el servicio descarta la fila.
        d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue(foreign);
        const err = await thrown(call(d));
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(err.reason).toBe(CrmErrorReason.CRM_CASE_NOT_FOUND);
        expect(err.details).toBeUndefined();
        expect(foreign.statusConceptId).toBe(CONCEPTS.CASE_OPEN);
        expect(d.serviceRepo.createCaseComment).not.toHaveBeenCalled();
        expect(d.serviceRepo.recordCaseStatusChange).not.toHaveBeenCalled();
        expect(d.serviceRepo.findCaseByIdForUpdate).toHaveBeenCalledWith(
          d.tx,
          UUID,
          TENANT,
        );
      },
    );

    it('Error: el caso de B responde idéntico al caso inexistente', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue(null);
      const missing = await thrown(
        d.service.addCaseComment(UUID, { commentText: 'x' }, actor),
      );
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: UUID,
        tenantId: OTHER_TENANT,
        statusConceptId: CONCEPTS.CASE_OPEN,
      });
      const foreign = await thrown(
        d.service.addCaseComment(UUID, { commentText: 'x' }, actor),
      );
      expect(foreign.getResponse()).toEqual(missing.getResponse());
    });

    it('Error: la vista 360 de la cuenta de B responde 404 uniforme y no consulta actividades ni casos', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({
        id: UUID,
        tenantId: OTHER_TENANT,
        name: 'Ajena',
      });
      const err = await thrown(d.service.getAccount360(UUID));
      expect(err.reason).toBe(CrmErrorReason.CRM_ACCOUNT_NOT_FOUND);
      expect(d.serviceRepo.findActivitiesByAccount).not.toHaveBeenCalled();
      expect(d.serviceRepo.findCasesByAccount).not.toHaveBeenCalled();
    });

    it('la vista 360 acota actividades y casos al tenant activo', async () => {
      const d = build();
      d.serviceRepo.findActivitiesByAccount.mockResolvedValue([]);
      d.serviceRepo.findCasesByAccount.mockResolvedValue([]);
      await d.service.getAccount360(UUID);
      expect(d.serviceRepo.findActivitiesByAccount).toHaveBeenCalledWith(
        expect.anything(),
        UUID,
        TENANT,
        50,
      );
      expect(d.serviceRepo.findCasesByAccount).toHaveBeenCalledWith(
        expect.anything(),
        UUID,
        TENANT,
        50,
      );
    });

    it('Error: cambiar el consentimiento del contacto de B responde 404 uniforme y no toca el canal', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue(null);
      const err = await thrown(
        d.service.setChannelOptIn(UUID, UUID, { optIn: false }, actor),
      );
      expect(err.reason).toBe(CrmErrorReason.CRM_CONTACT_NOT_FOUND);
      expect(d.salesRepo.findChannelEndpointForUpdate).not.toHaveBeenCalled();
    });

    it('Error: el canal de otro tenant responde como inexistente, no como «es de otro contacto»', async () => {
      const d = build();
      const endpoint = {
        id: 'ep-1',
        tenantId: OTHER_TENANT,
        contactId: 'contacto-de-b',
        doNotContact: false,
      };
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue(endpoint);
      const err = await thrown(
        d.service.setChannelOptIn(UUID, 'ep-1', { optIn: false }, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(CrmErrorReason.CRM_CONTACT_CHANNEL_NOT_FOUND);
      expect(endpoint.doNotContact).toBe(false);
    });

    it('Error: un canal sin tenant cuyo contacto es de B responde 404, no 422', async () => {
      const d = build();
      d.salesRepo.findContactById.mockImplementation(
        (_tx: unknown, id: string) =>
          Promise.resolve(id === UUID ? { id, tenantId: TENANT } : null),
      );
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: 'contacto-de-b',
        doNotContact: false,
      });
      const err = await thrown(
        d.service.setChannelOptIn(UUID, 'ep-1', { optIn: false }, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(CrmErrorReason.CRM_CONTACT_CHANNEL_NOT_FOUND);
    });

    it('Falla catalogada: el canal de otro contacto del mismo tenant da 422 CRM_CHANNEL_CONTACT_MISMATCH', async () => {
      const d = build();
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: 'otro-contacto-de-a',
      });
      const err = await thrown(
        d.service.setChannelOptIn(UUID, 'ep-1', { optIn: true }, actor),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.reason).toBe(CrmErrorReason.CRM_CHANNEL_CONTACT_MISMATCH);
    });
  });

  describe('referencias comerciales de actividades y casos (CRM-02)', () => {
    const activity = {
      tenantId: TENANT,
      subjectType: 'ACCOUNT' as const,
      subjectRefId: UUID,
      direction: 'OUTBOUND' as const,
      activityType: 'CALL' as const,
    };

    it.each([
      [
        'crmAccountId',
        { crmAccountId: UUID },
        'findAccountById',
        CrmErrorReason.CRM_ACCOUNT_NOT_FOUND,
      ],
      [
        'contactId',
        { contactId: UUID },
        'findContactById',
        CrmErrorReason.CRM_CONTACT_NOT_FOUND,
      ],
    ])(
      'Error: %s de otro tenant responde 404 uniforme y no persiste la actividad',
      async (_name, extra, repoMethod, reason) => {
        const d = build();
        (d.salesRepo as Record<string, any>)[repoMethod].mockResolvedValue(
          null,
        );
        const err = await thrown(
          d.service.createActivity({ ...activity, ...extra }, actor),
        );
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(err.reason).toBe(reason);
        expect(d.serviceRepo.createActivity).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['ACCOUNT', 'findAccountById', 'salesRepo'],
      ['OPPORTUNITY', 'findOpportunityById', 'salesRepo'],
      ['CASE', 'findCaseById', 'serviceRepo'],
    ] as const)(
      'Error: el sujeto %s de otro tenant responde 404 uniforme y no persiste',
      async (subjectType, repoMethod, repo) => {
        const d = build();
        (d as any)[repo][repoMethod].mockResolvedValue({
          id: UUID,
          tenantId: OTHER_TENANT,
        });
        const err = await thrown(
          d.service.createActivity({ ...activity, subjectType }, actor),
        );
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(err.reason).toBe(CrmErrorReason.CRM_ACTIVITY_SUBJECT_NOT_FOUND);
        expect(d.serviceRepo.createActivity).not.toHaveBeenCalled();
      },
    );

    it('Correcto: el sujeto CASE del tenant se resuelve con findCaseById', async () => {
      const d = build();
      d.serviceRepo.findCaseById.mockResolvedValue({
        id: UUID,
        tenantId: TENANT,
      });
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });
      await d.service.createActivity(
        { ...activity, subjectType: 'CASE' },
        actor,
      );
      expect(d.serviceRepo.findCaseById).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
      expect(d.serviceRepo.createActivity).toHaveBeenCalled();
    });

    it.each([
      ['crmAccountId', { crmAccountId: UUID }, 'findAccountById'],
      ['primaryContactId', { primaryContactId: UUID }, 'findContactById'],
    ])(
      'Error: abrir un caso con %s de otro tenant responde 404 uniforme y no persiste',
      async (_name, extra, repoMethod) => {
        const d = build();
        d.serviceRepo.findCaseByNumber.mockResolvedValue(null);
        (d.salesRepo as Record<string, any>)[repoMethod].mockResolvedValue(
          null,
        );
        const err = await thrown(
          d.service.createCase(
            { tenantId: TENANT, caseNumber: 'C-1', subject: 'x', ...extra },
            actor,
          ),
        );
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(d.serviceRepo.createCase).not.toHaveBeenCalled();
        expect(d.serviceRepo.recordCaseStatusChange).not.toHaveBeenCalled();
      },
    );
  });
});
