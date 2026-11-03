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
import { CrmServiceRepository, CrmSalesRepository } from '../repositories';
import { CrmErrorReason } from '../crm.error-reasons';
import { assertBodyTenantMatches, crmNotFound, notFound } from './crm-scope';
import {
  CreateActivityDto,
  ActivityResponseDto,
  CreatePartnershipDto,
  PartnershipResponseDto,
  CreateCaseDto,
  CaseResponseDto,
  AddCaseCommentDto,
  ChangeCaseStatusDto,
  CaseStatusResponseDto,
  ChannelOptInDto,
  ChannelOptInResponseDto,
  Account360ResponseDto,
  type ActivityType,
  type ActivitySubject,
} from '../dto';

const ACCOUNT_NOT_FOUND = crmNotFound(
  'Cuenta no encontrada',
  CrmErrorReason.CRM_ACCOUNT_NOT_FOUND,
);
const CONTACT_NOT_FOUND = crmNotFound(
  'Contacto no encontrado',
  CrmErrorReason.CRM_CONTACT_NOT_FOUND,
);
const CASE_NOT_FOUND = crmNotFound(
  'Caso no encontrado',
  CrmErrorReason.CRM_CASE_NOT_FOUND,
);
const CHANNEL_NOT_FOUND = crmNotFound(
  'Canal de contacto no encontrado',
  CrmErrorReason.CRM_CONTACT_CHANNEL_NOT_FOUND,
);
const ACTIVITY_SUBJECT_NOT_FOUND = crmNotFound(
  'Sujeto de la actividad no encontrado',
  CrmErrorReason.CRM_ACTIVITY_SUBJECT_NOT_FOUND,
);

const ACTIVITY_TYPE_CONCEPT: Readonly<Record<ActivityType, string>> = {
  TASK: CONCEPTS.ACTIVITY_TASK,
  EVENT: CONCEPTS.ACTIVITY_EVENT,
  EMAIL: CONCEPTS.ACTIVITY_EMAIL,
  CALL: CONCEPTS.ACTIVITY_CALL,
  NOTE: CONCEPTS.ACTIVITY_NOTE,
};

const SUBJECT_CONCEPT: Readonly<Record<ActivitySubject, string>> = {
  ACCOUNT: CONCEPTS.SUBJECT_ACCOUNT,
  OPPORTUNITY: CONCEPTS.SUBJECT_OPPORTUNITY,
  CASE: CONCEPTS.SUBJECT_CASE,
};

const CASE_STATUS_CONCEPT: Readonly<
  Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', string>
> = {
  OPEN: CONCEPTS.CASE_OPEN,
  IN_PROGRESS: CONCEPTS.CASE_IN_PROGRESS,
  RESOLVED: CONCEPTS.CASE_RESOLVED,
  CLOSED: CONCEPTS.CASE_CLOSED,
};

const PRIORITY_CONCEPT: Readonly<Record<'LOW' | 'MEDIUM' | 'HIGH', string>> = {
  LOW: CONCEPTS.PRIORITY_LOW,
  MEDIUM: CONCEPTS.PRIORITY_MEDIUM,
  HIGH: CONCEPTS.PRIORITY_HIGH,
};

const ORIGIN_CONCEPT: Readonly<Record<'PORTAL' | 'PHONE' | 'EMAIL', string>> = {
  PORTAL: CONCEPTS.ORIGIN_PORTAL,
  PHONE: CONCEPTS.ORIGIN_PHONE,
  EMAIL: CONCEPTS.ORIGIN_EMAIL,
};

/** Estados que cierran el caso y fijan `closed_at`. */
const CLOSING_STATES: readonly string[] = [
  CONCEPTS.CASE_RESOLVED,
  CONCEPTS.CASE_CLOSED,
];

const ACCOUNT_360_LIMIT = 50;

/**
 * Actividades, alianzas, casos de servicio y consentimiento de canal
 * (UC-49-05/06/10/11/12/13/14/15).
 */
@Injectable()
export class CrmServiceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceRepo - Valor de service repo requerido por la operación.
   * @param salesRepo - Valor de sales repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly serviceRepo: CrmServiceRepository,
    private readonly salesRepo: CrmSalesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CrmServiceService.name);
  }

  /**
   * UC-49-05 y UC-49-06: registra la actividad y, si el tipo lo requiere, su subtipo.
   *
   * `crm_activities` es la parte común (quién, sobre qué, en qué dirección); tarea y
   * nota añaden sus campos propios en la misma transacción. Los tipos sin tabla de
   * subtipo (evento, email, llamada) se quedan solo con la actividad.
   */
  async createActivity(
    dto: CreateActivityDto,
    actor: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    this.logger.info(
      {
        operation: 'crm.activity.create',
        tenantId,
        activityType: dto.activityType,
      },
      'Recording CRM activity',
    );

    return this.em.transactional(async (tx) => {
      // Cuenta, contacto y sujeto se resuelven dentro del tenant antes de
      // persistir: una referencia ajena responde como inexistente.
      await this.assertActivityReferences(tx, tenantId, dto);
      const activity = this.serviceRepo.createActivity(tx, {
        tenantId,
        activityTypeConceptId: ACTIVITY_TYPE_CONCEPT[dto.activityType],
        subjectTypeConceptId: SUBJECT_CONCEPT[dto.subjectType],
        subjectRefId: dto.subjectRefId,
        directionConceptId:
          dto.direction === 'INBOUND'
            ? CONCEPTS.DIRECTION_INBOUND
            : CONCEPTS.DIRECTION_OUTBOUND,
        subject: dto.subject,
        bodyText: dto.bodyText,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        crmAccountId: dto.crmAccountId,
        contactId: dto.contactId,
        ownerUserId: actor.id,
        statusConceptId: CONCEPTS.ACTIVITY_OPEN,
        actorUserId: actor.id,
      });

      let subtypeCreated = false;
      if (dto.activityType === 'TASK') {
        this.serviceRepo.createTask(tx, {
          crmActivityId: activity.id,
          taskSubtypeConceptId: CONCEPTS.ACTIVITY_TASK,
          priorityConceptId: CONCEPTS.PRIORITY_MEDIUM,
          dueDate: dto.dueAt ? new Date(dto.dueAt) : undefined,
          statusConceptId: CONCEPTS.ACTIVITY_OPEN,
          actorUserId: actor.id,
        });
        subtypeCreated = true;
      } else if (dto.activityType === 'NOTE') {
        if (!dto.bodyText) {
          throw new PreconditionFailedException(
            'Una nota requiere `bodyText`',
            {},
          );
        }
        this.serviceRepo.createNote(tx, {
          crmActivityId: activity.id,
          noteText: dto.bodyText,
          actorUserId: actor.id,
        });
        subtypeCreated = true;
      }

      return {
        id: activity.id,
        activityType: dto.activityType,
        subtypeCreated,
      };
    });
  }

  /**
   * Exige que la cuenta, el contacto y el sujeto de la actividad sean del tenant.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param dto - Cuerpo de la actividad.
   * @throws ResourceNotFoundException 404 uniforme si alguna referencia no existe o es ajena.
   */
  private async assertActivityReferences(
    tx: EntityManager,
    tenantId: string,
    dto: CreateActivityDto,
  ): Promise<void> {
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
    if (dto.contactId) {
      const contact = await this.salesRepo.findContactById(
        tx,
        dto.contactId,
        tenantId,
      );
      assertResourceInTenant(
        contact,
        contact?.tenantId,
        tenantId,
        CONTACT_NOT_FOUND,
      );
    }

    const subject =
      dto.subjectType === 'ACCOUNT'
        ? await this.salesRepo.findAccountById(tx, dto.subjectRefId, tenantId)
        : dto.subjectType === 'OPPORTUNITY'
          ? await this.salesRepo.findOpportunityById(
              tx,
              dto.subjectRefId,
              tenantId,
            )
          : await this.serviceRepo.findCaseById(tx, dto.subjectRefId, tenantId);
    assertResourceInTenant(
      subject,
      subject?.tenantId,
      tenantId,
      ACTIVITY_SUBJECT_NOT_FOUND,
    );
  }

  /** UC-49-10: registra la alianza y su acuerdo marco. */
  async createPartnership(
    dto: CreatePartnershipDto,
    actor: AuthenticatedUser,
  ): Promise<PartnershipResponseDto> {
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    this.logger.info(
      { operation: 'crm.partnership.create', tenantId },
      'Creating partnership',
    );

    return this.em.transactional(async (tx) => {
      const partnership = this.serviceRepo.createPartnership(tx, {
        tenantId,
        name: dto.name,
        partnershipTypeConceptId:
          dto.partnershipType === 'REFERRAL'
            ? CONCEPTS.PARTNERSHIP_REFERRAL
            : CONCEPTS.PARTNERSHIP_RESELLER,
        partnerRefType: dto.partnerRefType,
        partnerRefId: dto.partnerRefId,
        revenueSharePercent: dto.revenueSharePercent,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      let agreementId: string | undefined;
      if (dto.commitmentAmount) {
        const agreement = this.serviceRepo.createAgreement(tx, {
          partnershipId: partnership.id,
          agreementTypeConceptId: CONCEPTS.AGREEMENT_FRAMEWORK,
          commitmentAmount: dto.commitmentAmount,
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        agreementId = agreement.id;
      }

      return { id: partnership.id, name: dto.name, agreementId };
    });
  }

  /** UC-49-11: abre un caso de servicio. */
  async createCase(
    dto: CreateCaseDto,
    actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    this.logger.info(
      { operation: 'crm.case.create', tenantId, caseNumber: dto.caseNumber },
      'Opening service case',
    );

    const duplicate = await this.serviceRepo.findCaseByNumber(
      this.em,
      tenantId,
      dto.caseNumber,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un caso con ese número', {
        tenantId,
        caseNumber: dto.caseNumber,
      });
    }

    return this.em.transactional(async (tx) => {
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
      if (dto.primaryContactId) {
        const contact = await this.salesRepo.findContactById(
          tx,
          dto.primaryContactId,
          tenantId,
        );
        assertResourceInTenant(
          contact,
          contact?.tenantId,
          tenantId,
          CONTACT_NOT_FOUND,
        );
      }
      const serviceCase = this.serviceRepo.createCase(tx, {
        tenantId,
        caseNumber: dto.caseNumber,
        subject: dto.subject,
        description: dto.description,
        crmAccountId: dto.crmAccountId,
        primaryContactId: dto.primaryContactId,
        originConceptId: dto.origin ? ORIGIN_CONCEPT[dto.origin] : undefined,
        priorityConceptId: PRIORITY_CONCEPT[dto.priority ?? 'MEDIUM'],
        ownerUserId: actor.id,
        openedAt: new Date(),
        statusConceptId: CONCEPTS.CASE_OPEN,
        actorUserId: actor.id,
      });

      this.serviceRepo.recordCaseStatusChange(tx, {
        crmCaseId: serviceCase.id,
        toStatusConceptId: CONCEPTS.CASE_OPEN,
        changedByUserId: actor.id,
      });

      return {
        id: serviceCase.id,
        caseNumber: dto.caseNumber,
        statusConceptId: CONCEPTS.CASE_OPEN,
      };
    });
  }

  /** UC-49-12: añade un comentario al caso (público o interno). */
  async addCaseComment(
    caseId: string,
    dto: AddCaseCommentDto,
    actor: AuthenticatedUser,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string; /**
     * Identificador asociado a case.
     */
    caseId: string;
  }> {
    this.logger.info(
      { operation: 'crm.case.comment', caseId },
      'Adding case comment',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.serviceRepo.findCaseByIdForUpdate(
        tx,
        caseId,
        tenantId,
      );
      const serviceCase = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        CASE_NOT_FOUND,
      );
      if (serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED) {
        throw new PreconditionFailedException('No se comenta un caso cerrado', {
          caseId,
        });
      }

      const comment = this.serviceRepo.createCaseComment(tx, {
        crmCaseId: caseId,
        commentText: dto.commentText,
        isPublic: dto.isPublic,
        authorUserId: actor.id,
      });

      return { id: comment.id, caseId };
    });
  }

  /**
   * UC-49-12 y UC-49-13: transiciona el estado del caso.
   *
   * Cada cambio deja rastro en `crm_case_status_history`, y los estados de cierre
   * fijan `closed_at`. Un caso cerrado no se reabre por esta vía: hacerlo borraría
   * la fecha de cierre sobre la que se miden los SLA.
   */
  async changeCaseStatus(
    caseId: string,
    dto: ChangeCaseStatusDto,
    actor: AuthenticatedUser,
  ): Promise<CaseStatusResponseDto> {
    this.logger.info(
      { operation: 'crm.case.status', caseId, status: dto.status },
      'Changing case status',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const loaded = await this.serviceRepo.findCaseByIdForUpdate(
        tx,
        caseId,
        tenantId,
      );
      const serviceCase = assertResourceInTenant(
        loaded,
        loaded?.tenantId,
        tenantId,
        CASE_NOT_FOUND,
      );

      const target = CASE_STATUS_CONCEPT[dto.status];
      if (serviceCase.statusConceptId === target) {
        throw new PreconditionFailedException('El caso ya está en ese estado', {
          caseId,
        });
      }
      if (serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED) {
        throw new ConflictException(
          'Un caso cerrado no se reabre por esta vía',
          { caseId },
        );
      }

      const from = serviceCase.statusConceptId;
      serviceCase.statusConceptId = target;
      if (CLOSING_STATES.includes(target)) {
        serviceCase.closedAt = new Date();
      }
      touch(serviceCase, actor.id);

      this.serviceRepo.recordCaseStatusChange(tx, {
        crmCaseId: caseId,
        fromStatusConceptId: from,
        toStatusConceptId: target,
        changedByUserId: actor.id,
        reasonText: dto.reasonText,
      });

      return {
        caseId,
        statusConceptId: target,
        closedAt: serviceCase.closedAt?.toISOString(),
      };
    });
  }

  /**
   * UC-49-14: vista 360 de la cuenta.
   *
   * Es de solo lectura y no abre transacción de escritura. En producción esta vista
   * la sirve un read model materializado por el outbox; hasta que exista el módulo
   * 35, se compone en caliente desde las tablas fuente.
   */
  async getAccount360(accountId: string): Promise<Account360ResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const loaded = await this.salesRepo.findAccountById(
      em,
      accountId,
      tenantId,
    );
    const account = assertResourceInTenant(
      loaded,
      loaded?.tenantId,
      tenantId,
      ACCOUNT_NOT_FOUND,
    );

    const [activities, cases] = await Promise.all([
      this.serviceRepo.findActivitiesByAccount(
        em,
        accountId,
        tenantId,
        ACCOUNT_360_LIMIT,
      ),
      this.serviceRepo.findCasesByAccount(
        em,
        accountId,
        tenantId,
        ACCOUNT_360_LIMIT,
      ),
    ]);

    return {
      accountId,
      name: account.name,
      activityCount: activities.length,
      caseCount: cases.length,
    };
  }

  /**
   * UC-49-15: registra el consentimiento del canal de contacto.
   *
   * `do_not_contact` es la bandera que respeta marketing antes de enviar nada;
   * revocar el consentimiento la activa de inmediato.
   */
  async setChannelOptIn(
    contactId: string,
    endpointId: string,
    dto: ChannelOptInDto,
    actor: AuthenticatedUser,
  ): Promise<ChannelOptInResponseDto> {
    this.logger.info(
      { operation: 'crm.contact.opt-in', contactId, optIn: dto.optIn },
      'Updating channel consent',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const contact = await this.salesRepo.findContactById(
        tx,
        contactId,
        tenantId,
      );
      assertResourceInTenant(
        contact,
        contact?.tenantId,
        tenantId,
        CONTACT_NOT_FOUND,
      );

      const endpoint = await this.salesRepo.findChannelEndpointForUpdate(
        tx,
        endpointId,
      );
      if (!endpoint) throw notFound(CHANNEL_NOT_FOUND);
      // El canal declara su tenant (cuando lo tiene) y el de su contacto: uno
      // de otro tenant responde como inexistente, no como «es de otro contacto».
      if (endpoint.tenantId && endpoint.tenantId !== tenantId) {
        throw notFound(CHANNEL_NOT_FOUND);
      }
      if (endpoint.contactId !== contactId) {
        const owner = endpoint.contactId
          ? await this.salesRepo.findContactById(
              tx,
              endpoint.contactId,
              tenantId,
            )
          : null;
        if (!owner) throw notFound(CHANNEL_NOT_FOUND);
        throw new PreconditionFailedException(
          'El canal no pertenece a ese contacto',
          undefined,
          CrmErrorReason.CRM_CHANNEL_CONTACT_MISMATCH,
        );
      }

      endpoint.doNotContact = !dto.optIn;
      touch(endpoint, actor.id);

      return { endpointId, doNotContact: endpoint.doNotContact };
    });
  }
}
