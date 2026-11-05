import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrmSalesService } from './crm-sales.service';
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
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const salesRepo = {
    createAccount: mockFn(),
    findAccountById: mockFn(),
    createTeamMember: mockFn(),
    findTeamMember: mockFn(),
    createContact: mockFn(),
    createLead: mockFn(),
    findLeadByIdForUpdate: mockFn(),
    createOpportunity: mockFn(),
    findOpportunityByIdForUpdate: mockFn(),
    findStageById: mockFn(),
    findPipelineById: mockFn().mockResolvedValue({
      id: 'pipe-1',
      tenantId: TENANT,
    }),
    recordStageChange: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new CrmSalesService(em as any, salesRepo as any, logger as any);
  return { service: inTenant(raw, TENANT), raw, tx, salesRepo };
}

describe('CrmSalesService', () => {
  describe('createAccount (UC-49-01)', () => {
    it('creates the account and registers the creator as owner', async () => {
      const d = build();
      d.salesRepo.createAccount.mockReturnValue({ id: 'acc-1' });

      const res = await d.service.createAccount(
        { tenantId: TENANT, name: 'Clínica Sur', accountType: 'CUSTOMER' },
        actor,
      );

      expect(res.id).toBe('acc-1');
      expect(res.primaryContactId).toBeUndefined();
      expect(d.salesRepo.createTeamMember).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_OWNER,
        }),
      );
    });

    it('creates the primary contact in the same transaction when provided', async () => {
      const d = build();
      d.salesRepo.createAccount.mockReturnValue({ id: 'acc-1' });
      d.salesRepo.createContact.mockReturnValue({ id: 'contact-1' });

      const res = await d.service.createAccount(
        {
          tenantId: TENANT,
          name: 'Clínica Sur',
          accountType: 'CUSTOMER',
          primaryContactFirstName: 'Ana',
        },
        actor,
      );

      expect(res.primaryContactId).toBe('contact-1');
    });
  });

  describe('addTeamMember (UC-49-02)', () => {
    it('adds the member with the requested role', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({
        id: 'acc-1',
        tenantId: TENANT,
      });
      d.salesRepo.findTeamMember.mockResolvedValue(null);
      d.salesRepo.createTeamMember.mockReturnValue({ id: 'member-1' });

      const res = await d.service.addTeamMember(
        UUID,
        { userId: 'user-2', teamRole: 'MEMBER' },
        actor,
      );

      expect(res.teamRole).toBe('MEMBER');
    });

    it('rejects adding the same user twice', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({
        id: 'acc-1',
        tenantId: TENANT,
      });
      d.salesRepo.findTeamMember.mockResolvedValue({ id: 'member-existing' });

      await expect(
        d.service.addTeamMember(
          UUID,
          { userId: 'user-2', teamRole: 'MEMBER' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the account does not exist', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue(null);

      await expect(
        d.service.addTeamMember(
          UUID,
          { userId: 'user-2', teamRole: 'MEMBER' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('qualifyLead (UC-49-03)', () => {
    it('marks the lead as qualified and stores the score as a decimal string', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      };
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead);

      const res = await d.service.qualifyLead(
        UUID,
        { leadScore: 80, qualified: true },
        actor,
      );

      expect(res.leadStatusConceptId).toBe(CONCEPTS.LEAD_QUALIFIED);
      expect(lead.leadScore).toBe('80');
    });

    it('disqualifies the lead when the score is not enough', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      });

      const res = await d.service.qualifyLead(
        UUID,
        { leadScore: 10, qualified: false },
        actor,
      );

      expect(res.leadStatusConceptId).toBe(CONCEPTS.LEAD_DISQUALIFIED);
    });

    it('rejects re-qualifying an already converted lead', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_CONVERTED,
      });

      await expect(
        d.service.qualifyLead(
          UUID,
          { leadScore: 90, qualified: true },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('convertLead (UC-49-04)', () => {
    const dto = {
      pipelineId: 'pipe-1',
      stageId: UUID,
      opportunityName: 'Contrato anual',
    };
    const stageOf = (pipelineId: string) => ({ id: UUID, pipelineId });

    it('creates the opportunity and links it back to the lead', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_QUALIFIED,
        ownerUserId: 'user-1',
      };
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead);
      d.salesRepo.findStageById.mockResolvedValue(stageOf('pipe-1'));
      d.salesRepo.createOpportunity.mockReturnValue({ id: 'opp-1' });

      const res = await d.service.convertLead(UUID, dto, actor);

      expect(res.opportunityId).toBe('opp-1');
      expect(lead.leadStatusConceptId).toBe(CONCEPTS.LEAD_CONVERTED);
      expect(lead.convertedOpportunityId).toBe('opp-1');
      expect(d.salesRepo.recordStageChange).toHaveBeenCalled();
    });

    it('refuses to convert a lead that was never qualified', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      });

      await expect(
        d.service.convertLead(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to convert the same lead twice', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_CONVERTED,
      });

      await expect(
        d.service.convertLead(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('advanceStage (UC-49-07)', () => {
    it('moves the stage and records the change with the stage probability', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
        amount: '15000.00',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-2',
        pipelineId: 'pipe-1',
        probabilityPercent: '60',
      });

      const res = await d.service.advanceStage(
        UUID,
        { toStageId: 'stage-2' },
        actor,
      );

      expect(res.stageId).toBe('stage-2');
      expect(opportunity.probabilityPercent).toBe('60');
      expect(d.salesRepo.recordStageChange).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          fromStageId: 'stage-1',
          toStageId: 'stage-2',
        }),
      );
    });

    it('rejects advancing a closed opportunity', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        statusConceptId: CONCEPTS.OPPORTUNITY_WON,
      });

      await expect(
        d.service.advanceStage(UUID, { toStageId: 'stage-2' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects moving to the stage it is already in', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        stageId: 'stage-2',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      });

      await expect(
        d.service.advanceStage(UUID, { toStageId: 'stage-2' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('win / lose opportunity (UC-49-08 y UC-49-09)', () => {
    it('marks the opportunity as won and stamps wonAt', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        stageId: 'stage-3',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);

      const res = await d.service.winOpportunity(UUID, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.OPPORTUNITY_WON);
      expect(opportunity.wonAt).toBeInstanceOf(Date);
    });

    it('marks the opportunity as lost with its reason', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        stageId: 'stage-3',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);

      const res = await d.service.loseOpportunity(
        UUID,
        { reason: 'PRICE' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.OPPORTUNITY_LOST);
      expect(opportunity.lostReasonConceptId).toBe(CONCEPTS.LOST_REASON_PRICE);
    });

    it('rejects closing an opportunity that is already closed', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        tenantId: TENANT,
        pipelineId: 'pipe-1',
        statusConceptId: CONCEPTS.OPPORTUNITY_LOST,
      });

      await expect(
        d.service.winOpportunity(UUID, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('tenant del actor (CRM-01)', () => {
    /** Repositorio que respeta el contrato `(id, tenantId)`: lo ajeno no se encuentra. */
    const scoped =
      (row: any) =>
      (_tx: unknown, _id: string, tenantId: string): Promise<any> =>
        Promise.resolve(row.tenantId === tenantId ? row : null);

    it('Correcto: la cuenta nace con el tenant del contexto', async () => {
      const d = build();
      d.salesRepo.createAccount.mockReturnValue({ id: 'acc-1' });
      await d.service.createAccount(
        { tenantId: TENANT, name: 'Clínica', accountType: 'CUSTOMER' },
        actor,
      );
      expect(d.salesRepo.createAccount).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('Falla catalogada: tenantId del cuerpo distinto del activo da 403 CRM_TENANT_SCOPE_REQUIRED y no persiste', async () => {
      const d = build();
      const account = await thrown(
        d.service.createAccount(
          { tenantId: OTHER_TENANT, name: 'X', accountType: 'CUSTOMER' },
          actor,
        ),
      );
      expect(account.getStatus()).toBe(403);
      expect(account.reason).toBe(CrmErrorReason.CRM_TENANT_SCOPE_REQUIRED);
      expect(d.salesRepo.createAccount).not.toHaveBeenCalled();

      const lead = await thrown(
        d.service.createLead(
          { tenantId: OTHER_TENANT, source: 'WEB' } as any,
          actor,
        ),
      );
      expect(lead.reason).toBe(CrmErrorReason.CRM_TENANT_SCOPE_REQUIRED);
      expect(d.salesRepo.createLead).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no se crea nada', async () => {
      const d = build();
      await expect(
        d.raw.createAccount(
          { tenantId: TENANT, name: 'X', accountType: 'CUSTOMER' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.salesRepo.createAccount).not.toHaveBeenCalled();
    });

    it('Límite: el admin de A incorpora un miembro a una cuenta de A', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockImplementation(
        scoped({ id: 'acc-1', tenantId: TENANT }),
      );
      d.salesRepo.findTeamMember.mockResolvedValue(null);
      d.salesRepo.createTeamMember.mockReturnValue({ id: 'member-1' });
      await expect(
        d.service.addTeamMember(
          'acc-1',
          { userId: 'user-2', teamRole: 'MEMBER' },
          actor,
        ),
      ).resolves.toMatchObject({ id: 'member-1' });
      expect(d.salesRepo.findAccountById).toHaveBeenCalledWith(
        d.tx,
        'acc-1',
        TENANT,
      );
    });

    it('Error: la cuenta de B por UUID responde 404 idéntico a inexistente y no agrega miembros', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue(null);
      const missing = await thrown(
        d.service.addTeamMember(
          UUID,
          { userId: 'u', teamRole: 'MEMBER' },
          actor,
        ),
      );
      d.salesRepo.findAccountById.mockImplementation(
        scoped({ id: UUID, tenantId: OTHER_TENANT }),
      );
      const foreign = await thrown(
        d.service.addTeamMember(
          UUID,
          { userId: 'u', teamRole: 'MEMBER' },
          actor,
        ),
      );
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(CrmErrorReason.CRM_ACCOUNT_NOT_FOUND);
      expect(foreign.details).toBeUndefined();
      expect(d.salesRepo.createTeamMember).not.toHaveBeenCalled();
    });

    it('Error: aunque el repositorio devolviera una fila ajena, el servicio la trata como inexistente', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        tenantId: OTHER_TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      };
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead);
      await expect(
        d.service.qualifyLead(UUID, { leadScore: 90, qualified: true }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(lead.leadStatusConceptId).toBe(CONCEPTS.LEAD_NEW);
      expect(lead.leadScore).toBeUndefined();
    });

    it('Error: calificar/convertir el lead de B responde 404 uniforme sin transición', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        tenantId: OTHER_TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_QUALIFIED,
      };
      d.salesRepo.findLeadByIdForUpdate.mockImplementation(scoped(lead));
      const q = await thrown(
        d.service.qualifyLead(UUID, { leadScore: 1, qualified: false }, actor),
      );
      const c = await thrown(
        d.service.convertLead(
          UUID,
          { pipelineId: 'pipe-1', stageId: UUID, opportunityName: 'x' },
          actor,
        ),
      );
      expect(q.reason).toBe(CrmErrorReason.CRM_LEAD_NOT_FOUND);
      expect(c.reason).toBe(CrmErrorReason.CRM_LEAD_NOT_FOUND);
      expect(lead.leadStatusConceptId).toBe(CONCEPTS.LEAD_QUALIFIED);
      expect(d.salesRepo.createOpportunity).not.toHaveBeenCalled();
    });

    it.each([
      [
        'advanceStage',
        (d: any) => d.service.advanceStage(UUID, { toStageId: 's' }, actor),
      ],
      ['winOpportunity', (d: any) => d.service.winOpportunity(UUID, actor)],
      [
        'loseOpportunity',
        (d: any) => d.service.loseOpportunity(UUID, { reason: 'PRICE' }, actor),
      ],
    ])(
      'Error: %s sobre la oportunidad de B responde 404 uniforme, sin cambio ni histórico',
      async (_name, call) => {
        const d = build();
        const opportunity: any = {
          id: UUID,
          tenantId: OTHER_TENANT,
          pipelineId: 'pipe-b',
          stageId: 'stage-b',
          statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
        };
        d.salesRepo.findOpportunityByIdForUpdate.mockImplementation(
          scoped(opportunity),
        );
        const err = await thrown(call(d));
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(err.reason).toBe(CrmErrorReason.CRM_OPPORTUNITY_NOT_FOUND);
        expect(opportunity.statusConceptId).toBe(CONCEPTS.OPPORTUNITY_OPEN);
        expect(opportunity.stageId).toBe('stage-b');
        expect(d.salesRepo.recordStageChange).not.toHaveBeenCalled();
      },
    );
  });

  describe('pipeline, etapa y referencias comerciales (CRM-02)', () => {
    const lead = (): any => ({
      id: 'lead-1',
      tenantId: TENANT,
      leadStatusConceptId: CONCEPTS.LEAD_QUALIFIED,
      ownerUserId: 'user-1',
    });
    const body = {
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      opportunityName: 'Contrato',
    };

    it('Correcto: el lead de A se convierte con pipeline y etapa de A, con histórico coherente', async () => {
      const d = build();
      const l = lead();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(l);
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-1',
        pipelineId: 'pipe-1',
      });
      d.salesRepo.createOpportunity.mockReturnValue({ id: 'opp-1' });
      await d.service.convertLead(UUID, body, actor);
      expect(d.salesRepo.findPipelineById).toHaveBeenCalledWith(
        d.tx,
        'pipe-1',
        TENANT,
      );
      expect(d.salesRepo.findStageById).toHaveBeenCalledWith(
        d.tx,
        'stage-1',
        TENANT,
      );
      expect(d.salesRepo.createOpportunity).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          pipelineId: 'pipe-1',
          stageId: 'stage-1',
        }),
      );
      expect(d.salesRepo.recordStageChange).toHaveBeenCalledTimes(1);
    });

    it('Error: convertir con el pipeline de B responde 404 uniforme y no crea la oportunidad', async () => {
      const d = build();
      const l = lead();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(l);
      d.salesRepo.findPipelineById.mockResolvedValue(null);
      const err = await thrown(d.service.convertLead(UUID, body, actor));
      expect(err.reason).toBe(CrmErrorReason.CRM_PIPELINE_NOT_FOUND);
      expect(d.salesRepo.createOpportunity).not.toHaveBeenCalled();
      expect(l.leadStatusConceptId).toBe(CONCEPTS.LEAD_QUALIFIED);
    });

    it('Error: convertir con una etapa de un pipeline de B responde 404 uniforme', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead());
      d.salesRepo.findStageById.mockResolvedValue(null);
      const err = await thrown(d.service.convertLead(UUID, body, actor));
      expect(err.reason).toBe(CrmErrorReason.CRM_STAGE_NOT_FOUND);
      expect(d.salesRepo.createOpportunity).not.toHaveBeenCalled();
    });

    it('Falla catalogada: convertir con una etapa de otro pipeline de A da 422 CRM_STAGE_PIPELINE_MISMATCH', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead());
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-1',
        pipelineId: 'pipe-otro',
      });
      const err = await thrown(d.service.convertLead(UUID, body, actor));
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.reason).toBe(CrmErrorReason.CRM_STAGE_PIPELINE_MISMATCH);
      expect(d.salesRepo.createOpportunity).not.toHaveBeenCalled();
    });

    it('Error: convertir con la cuenta de B responde 404 uniforme y no crea la oportunidad', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead());
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-1',
        pipelineId: 'pipe-1',
      });
      d.salesRepo.findAccountById.mockResolvedValue(null);
      const err = await thrown(
        d.service.convertLead(UUID, { ...body, crmAccountId: UUID }, actor),
      );
      expect(err.reason).toBe(CrmErrorReason.CRM_ACCOUNT_NOT_FOUND);
      expect(d.salesRepo.createOpportunity).not.toHaveBeenCalled();
    });

    const openOpportunity = (): any => ({
      id: 'opp-1',
      tenantId: TENANT,
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      amount: '100.00',
      statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
    });

    it('Límite: mover a la etapa siguiente del mismo pipeline actualiza probabilidad e histórico una vez', async () => {
      const d = build();
      const opp = openOpportunity();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opp);
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-2',
        pipelineId: 'pipe-1',
        probabilityPercent: '40',
      });
      await d.service.advanceStage('opp-1', { toStageId: 'stage-2' }, actor);
      expect(opp.stageId).toBe('stage-2');
      expect(opp.probabilityPercent).toBe('40');
      expect(d.salesRepo.recordStageChange).toHaveBeenCalledTimes(1);
    });

    it('Error: mover a una etapa de un pipeline de B responde 404 uniforme, sin cambio ni histórico', async () => {
      const d = build();
      const opp = openOpportunity();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opp);
      d.salesRepo.findStageById.mockResolvedValue(null);
      const err = await thrown(
        d.service.advanceStage('opp-1', { toStageId: 'stage-b' }, actor),
      );
      expect(err.reason).toBe(CrmErrorReason.CRM_STAGE_NOT_FOUND);
      expect(opp.stageId).toBe('stage-1');
      expect(opp.probabilityPercent).toBeUndefined();
      expect(d.salesRepo.recordStageChange).not.toHaveBeenCalled();
    });

    it('Falla catalogada: la etapa de otro pipeline del mismo tenant da 422 CRM_STAGE_PIPELINE_MISMATCH', async () => {
      const d = build();
      const opp = openOpportunity();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opp);
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-x',
        pipelineId: 'pipe-otro',
        probabilityPercent: '90',
      });
      const err = await thrown(
        d.service.advanceStage('opp-1', { toStageId: 'stage-x' }, actor),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.getStatus()).toBe(422);
      expect(err.reason).toBe(CrmErrorReason.CRM_STAGE_PIPELINE_MISMATCH);
      expect(opp.stageId).toBe('stage-1');
      expect(opp.probabilityPercent).toBeUndefined();
      expect(d.salesRepo.recordStageChange).not.toHaveBeenCalled();
    });
  });
});
