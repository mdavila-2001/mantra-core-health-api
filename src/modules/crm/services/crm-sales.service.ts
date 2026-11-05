import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { CrmSalesRepository } from '../repositories';
import { CrmErrorReason } from '../crm.error-reasons';
import {
  assertBodyTenantMatches,
  crmNotFound,
  notFound,
  stageMismatch,
} from './crm-scope';
import {
  CreateAccountDto,
  AccountResponseDto,
  AddTeamMemberDto,
  TeamMemberResponseDto,
  CreateLeadDto,
  QualifyLeadDto,
  LeadResponseDto,
  ConvertLeadDto,
  ConvertLeadResponseDto,
  AdvanceStageDto,
  LoseOpportunityDto,
  OpportunityResponseDto,
  type AccountType,
  type LeadSource,
} from '../dto';

const ACCOUNT_TYPE_CONCEPT: Readonly<Record<AccountType, string>> = {
  CUSTOMER: CONCEPTS.ACCOUNT_CUSTOMER,
  PROSPECT: CONCEPTS.ACCOUNT_PROSPECT,
  PARTNER: CONCEPTS.ACCOUNT_PARTNER,
};

const LEAD_SOURCE_CONCEPT: Readonly<Record<LeadSource, string>> = {
  WEB: CONCEPTS.LEAD_SOURCE_WEB,
  REFERRAL: CONCEPTS.LEAD_SOURCE_REFERRAL,
  CAMPAIGN: CONCEPTS.LEAD_SOURCE_CAMPAIGN,
};

const ACCOUNT_NOT_FOUND = crmNotFound(
  'Cuenta no encontrada',
  CrmErrorReason.CRM_ACCOUNT_NOT_FOUND,
);
const LEAD_NOT_FOUND = crmNotFound(
  'Lead no encontrado',
  CrmErrorReason.CRM_LEAD_NOT_FOUND,
);
const OPPORTUNITY_NOT_FOUND = crmNotFound(
  'Oportunidad no encontrada',
  CrmErrorReason.CRM_OPPORTUNITY_NOT_FOUND,
);
const PIPELINE_NOT_FOUND = crmNotFound(
  'Pipeline no encontrado',
  CrmErrorReason.CRM_PIPELINE_NOT_FOUND,
);
const STAGE_NOT_FOUND = crmNotFound(
  'Etapa no encontrada',
  CrmErrorReason.CRM_STAGE_NOT_FOUND,
);

const LOST_REASON_CONCEPT: Readonly<
  Record<'PRICE' | 'COMPETITOR' | 'NO_BUDGET', string>
> = {
  PRICE: CONCEPTS.LOST_REASON_PRICE,
  COMPETITOR: CONCEPTS.LOST_REASON_COMPETITOR,
  NO_BUDGET: CONCEPTS.LOST_REASON_NO_BUDGET,
};

/**
 * Ciclo comercial: cuentas, equipo, leads y oportunidades
 * (UC-49-01/02/03/04/07/08/09).
 */
@Injectable()
export class CrmSalesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param salesRepo - Valor de sales repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly salesRepo: CrmSalesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CrmSalesService.name);
  }

  /**
   * UC-49-01: crea la cuenta y, opcionalmente, su contacto principal.
   *
   * Ambos nacen en la misma transacción: una cuenta con contacto a medias obligaría
   * al llamador a compensar el alta parcial.
   */
  async createAccount(
    dto: CreateAccountDto,
    actor: AuthenticatedUser,
  ): Promise<AccountResponseDto> {
    // El tenant sale del contexto verificado; el del cuerpo sólo se contrasta.
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    this.logger.info(
      { operation: 'crm.account.create', tenantId },
      'Creating CRM account',
    );

    return this.em.transactional(async (tx) => {
      const account = this.salesRepo.createAccount(tx, {
        tenantId,
        name: dto.name,
        accountTypeConceptId: ACCOUNT_TYPE_CONCEPT[dto.accountType],
        website: dto.website,
        taxId: dto.taxId,
        parentAccountId: dto.parentAccountId,
        ownerUserId: actor.id,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      let primaryContactId: string | undefined;
      if (dto.primaryContactFirstName) {
        const contact = this.salesRepo.createContact(tx, {
          tenantId,
          crmAccountId: account.id,
          firstName: dto.primaryContactFirstName,
          lastName: dto.primaryContactLastName,
          contactTypeConceptId: CONCEPTS.CONTACT_PERSON,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        primaryContactId = contact.id;
      }

      // Quien crea la cuenta queda como propietario en el equipo.
      this.salesRepo.createTeamMember(tx, {
        crmAccountId: account.id,
        userId: actor.id,
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_OWNER,
        accessLevelConceptId: CONCEPTS.ACCESS_WRITE,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: account.id,
        name: dto.name,
        primaryContactId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /** UC-49-02: suma un usuario al equipo de la cuenta. */
  async addTeamMember(
    accountId: string,
    dto: AddTeamMemberDto,
    actor: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    this.logger.info(
      { operation: 'crm.account.add-member', accountId, userId: dto.userId },
      'Adding account team member',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.salesRepo.findAccountById(
        tx,
        accountId,
        tenantId,
      );
      assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        ACCOUNT_NOT_FOUND,
      );

      const existing = await this.salesRepo.findTeamMember(
        tx,
        accountId,
        dto.userId,
      );
      if (existing) {
        throw new ConflictException(
          'El usuario ya pertenece al equipo de la cuenta',
          {
            accountId,
            userId: dto.userId,
          },
        );
      }

      const member = this.salesRepo.createTeamMember(tx, {
        crmAccountId: accountId,
        userId: dto.userId,
        teamRoleConceptId:
          dto.teamRole === 'OWNER'
            ? CONCEPTS.TEAM_ROLE_OWNER
            : CONCEPTS.TEAM_ROLE_MEMBER,
        accessLevelConceptId:
          dto.accessLevel === 'WRITE'
            ? CONCEPTS.ACCESS_WRITE
            : CONCEPTS.ACCESS_READ,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return { id: member.id, userId: dto.userId, teamRole: dto.teamRole };
    });
  }

  /** UC-49-03: captura un lead entrante. */
  async createLead(
    dto: CreateLeadDto,
    actor: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    this.logger.info(
      { operation: 'crm.lead.create', tenantId, source: dto.source },
      'Capturing lead',
    );

    return this.em.transactional(async (tx) => {
      const lead = this.salesRepo.createLead(tx, {
        tenantId,
        leadSourceConceptId: LEAD_SOURCE_CONCEPT[dto.source],
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        interestText: dto.interestText,
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
        ownerUserId: actor.id,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return { id: lead.id, leadStatusConceptId: CONCEPTS.LEAD_NEW };
    });
  }

  /** UC-49-03: califica o descarta el lead según la puntuación obtenida. */
  async qualifyLead(
    leadId: string,
    dto: QualifyLeadDto,
    actor: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    this.logger.info(
      { operation: 'crm.lead.qualify', leadId, qualified: dto.qualified },
      'Qualifying lead',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.salesRepo.findLeadByIdForUpdate(
        tx,
        leadId,
        tenantId,
      );
      const lead = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        LEAD_NOT_FOUND,
      );
      if (lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED) {
        throw new ConflictException('El lead ya fue convertido', { leadId });
      }

      // La columna es `numeric`: el score entra como número por la API y se persiste
      // como cadena para no arrastrar imprecisión de coma flotante.
      lead.leadScore = String(dto.leadScore);
      lead.leadStatusConceptId = dto.qualified
        ? CONCEPTS.LEAD_QUALIFIED
        : CONCEPTS.LEAD_DISQUALIFIED;
      touch(lead, actor.id);

      return {
        id: leadId,
        leadStatusConceptId: lead.leadStatusConceptId,
        leadScore: dto.leadScore,
      };
    });
  }

  /**
   * UC-49-04: convierte el lead en oportunidad.
   *
   * Solo un lead calificado se convierte: convertir uno descartado o ya convertido
   * duplicaría el pipeline con negocio que no existe.
   */
  async convertLead(
    leadId: string,
    dto: ConvertLeadDto,
    actor: AuthenticatedUser,
  ): Promise<ConvertLeadResponseDto> {
    this.logger.info(
      { operation: 'crm.lead.convert', leadId },
      'Converting lead',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.salesRepo.findLeadByIdForUpdate(
        tx,
        leadId,
        tenantId,
      );
      const lead = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        LEAD_NOT_FOUND,
      );
      if (lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED) {
        throw new ConflictException('El lead ya fue convertido', {
          leadId,
          opportunityId: lead.convertedOpportunityId,
        });
      }
      if (lead.leadStatusConceptId !== CONCEPTS.LEAD_QUALIFIED) {
        throw new PreconditionFailedException(
          'Solo se convierte un lead calificado',
          { leadId },
        );
      }

      // Pipeline, etapa y cuenta se resuelven dentro del tenant antes de
      // crear nada: una referencia ajena responde como inexistente.
      const pipeline = await this.salesRepo.findPipelineById(
        tx,
        dto.pipelineId,
        tenantId,
      );
      assertResourceInTenant(
        pipeline,
        pipeline?.tenantId,
        tenantId,
        PIPELINE_NOT_FOUND,
      );
      const stage = await this.salesRepo.findStageById(
        tx,
        dto.stageId,
        tenantId,
      );
      if (!stage) {
        throw notFound(STAGE_NOT_FOUND);
      } else if (stage.pipelineId !== dto.pipelineId) {
        throw stageMismatch();
      }
      if (dto.crmAccountId) {
        const account = await this.salesRepo.findAccountById(
          tx,
          dto.crmAccountId,
          tenantId,
        );
        assertResourceInTenant(
          account,
          account?.tenantId,
          tenantId,
          ACCOUNT_NOT_FOUND,
        );
      }

      const opportunity = this.salesRepo.createOpportunity(tx, {
        tenantId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        name: dto.opportunityName,
        crmAccountId: dto.crmAccountId ?? lead.crmAccountId,
        amount: dto.amount,
        currencyConceptId: dto.amount ? CONCEPTS.CURRENCY_BOB : undefined,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        ownerUserId: lead.ownerUserId ?? actor.id,
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
        actorUserId: actor.id,
      });

      lead.leadStatusConceptId = CONCEPTS.LEAD_CONVERTED;
      lead.convertedOpportunityId = opportunity.id;
      lead.convertedAt = new Date();
      touch(lead, actor.id);

      this.salesRepo.recordStageChange(tx, {
        opportunityId: opportunity.id,
        toStageId: dto.stageId,
        changedByUserId: actor.id,
        amountAtChange: dto.amount,
      });

      return { leadId, opportunityId: opportunity.id };
    });
  }

  /**
   * UC-49-07: mueve la oportunidad de etapa.
   *
   * Cada movimiento queda en `opportunity_stage_history` con el importe y la
   * probabilidad del momento: el histórico del pipeline no se puede reconstruir
   * después si solo se guarda la etapa actual.
   */
  async advanceStage(
    opportunityId: string,
    dto: AdvanceStageDto,
    actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    this.logger.info(
      {
        operation: 'crm.opportunity.advance',
        opportunityId,
        toStageId: dto.toStageId,
      },
      'Advancing opportunity stage',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.salesRepo.findOpportunityByIdForUpdate(
        tx,
        opportunityId,
        tenantId,
      );
      const opportunity = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        OPPORTUNITY_NOT_FOUND,
      );
      if (opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN) {
        throw new PreconditionFailedException(
          'La oportunidad ya está cerrada',
          { opportunityId },
        );
      }
      if (opportunity.stageId === dto.toStageId) {
        throw new PreconditionFailedException(
          'La oportunidad ya está en esa etapa',
          {
            opportunityId,
          },
        );
      }

      const stage = await this.salesRepo.findStageById(
        tx,
        dto.toStageId,
        tenantId,
      );
      if (!stage) {
        throw notFound(STAGE_NOT_FOUND);
      } else if (stage.pipelineId !== opportunity.pipelineId) {
        // La probabilidad y el histórico se calcularían desde una etapa de
        // otro embudo: se corta antes de mover nada.
        throw stageMismatch();
      }

      const fromStageId = opportunity.stageId;
      opportunity.stageId = dto.toStageId;
      if (stage.probabilityPercent !== undefined) {
        opportunity.probabilityPercent = stage.probabilityPercent;
      }
      touch(opportunity, actor.id);

      this.salesRepo.recordStageChange(tx, {
        opportunityId,
        fromStageId,
        toStageId: dto.toStageId,
        changedByUserId: actor.id,
        amountAtChange: opportunity.amount,
        probabilityAtChange: stage.probabilityPercent,
      });

      return {
        id: opportunityId,
        stageId: dto.toStageId,
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
    });
  }

  /** UC-49-08: marca la oportunidad como ganada. */
  async winOpportunity(
    opportunityId: string,
    actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.closeOpportunity(
      opportunityId,
      CONCEPTS.OPPORTUNITY_WON,
      actor,
    );
  }

  /** UC-49-09: marca la oportunidad como perdida, con su motivo. */
  async loseOpportunity(
    opportunityId: string,
    dto: LoseOpportunityDto,
    actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.closeOpportunity(
      opportunityId,
      CONCEPTS.OPPORTUNITY_LOST,
      actor,
      LOST_REASON_CONCEPT[dto.reason],
    );
  }

  /** Cierre común de ganada/perdida: misma precondición y mismo registro histórico. */
  private async closeOpportunity(
    opportunityId: string,
    targetStatusConceptId: string,
    actor: AuthenticatedUser,
    lostReasonConceptId?: string,
  ): Promise<OpportunityResponseDto> {
    const won = targetStatusConceptId === CONCEPTS.OPPORTUNITY_WON;
    this.logger.info(
      {
        operation: won ? 'crm.opportunity.win' : 'crm.opportunity.lose',
        opportunityId,
      },
      'Closing opportunity',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.salesRepo.findOpportunityByIdForUpdate(
        tx,
        opportunityId,
        tenantId,
      );
      const opportunity = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        OPPORTUNITY_NOT_FOUND,
      );
      if (opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN) {
        throw new ConflictException('La oportunidad ya está cerrada', {
          opportunityId,
        });
      }

      opportunity.statusConceptId = targetStatusConceptId;
      if (won) opportunity.wonAt = new Date();
      if (lostReasonConceptId)
        opportunity.lostReasonConceptId = lostReasonConceptId;
      touch(opportunity, actor.id);

      this.salesRepo.recordStageChange(tx, {
        opportunityId,
        fromStageId: opportunity.stageId,
        toStageId: opportunity.stageId,
        changedByUserId: actor.id,
        amountAtChange: opportunity.amount,
        reasonConceptId: lostReasonConceptId,
      });

      return {
        id: opportunityId,
        stageId: opportunity.stageId,
        statusConceptId: targetStatusConceptId,
      };
    });
  }
}
