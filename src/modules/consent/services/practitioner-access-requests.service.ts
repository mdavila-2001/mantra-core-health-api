import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConsentsRepository,
  ConsentProvisionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { ClinicalAccessGrantsRepository } from '../../authz/repositories';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { AuditTrailService } from '../../audit/services';
import { CONS } from '../consent.concepts';
import {
  DecidePractitionerAccessRequestDto,
  PractitionerAccessRequestResponseDto,
  RequestPractitionerAccessDto,
} from '../dto';
import {
  PRACTITIONER_ACCESS_NOTICE_PORT,
  type PractitionerAccessNoticePort,
} from '../ports/practitioner-access-notice.port';
import type { Consents } from '../entities';

const DEFAULT_VALIDITY_MONTHS = 12;

/**
 * FT-07-R05/R06/R07/R08 — el vínculo médico-paciente que faltaba después de
 * la búsqueda (TAREA-07 S1+S3, ya en `dev`).
 *
 * `clinical-read.service.ts` documenta la brecha explícitamente: hoy el
 * acceso nace del turno confirmado del día "mientras el grupo define el
 * modelo de consentimiento". Este servicio ES ese modelo — reutiliza
 * `consent.consents`/`consent_provisions` (ya migradas) en vez de agregar
 * tablas nuevas, y al aceptar crea el `authz.clinical_access_grants` que
 * `assertPuedeLeerHistoria` ya sabe consultar.
 *
 * Ciclo: `request` (profesional, tras buscar) → aviso in-app al paciente →
 * `decide` (paciente, elige QUÉ especialidades autoriza — no todo o nada) →
 * si acepta, `consents` pasa a ACTIVE, se crean las provisiones permitidas/
 * denegadas y el grant clínico que habilita la lectura.
 */
@Injectable()
export class PractitionerAccessRequestsService {
  constructor(
    private readonly em: EntityManager,
    private readonly consentsRepo: ConsentsRepository,
    private readonly provisionsRepo: ConsentProvisionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly clinicalGrantsRepo: ClinicalAccessGrantsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly auditTrail: AuditTrailService,
    @Inject(PRACTITIONER_ACCESS_NOTICE_PORT)
    private readonly notices: PractitionerAccessNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerAccessRequestsService.name);
  }

  /** FT-07-R05: el profesional pide acceso tras encontrar al paciente. */
  async request(
    dto: RequestPractitionerAccessDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto> {
    this.logger.info(
      {
        operation: 'consent.practitioner-access.request',
        patientProfileId: dto.patientProfileId,
      },
      'Practitioner requesting record access',
    );
    const consent = await this.em.transactional(async (tx) => {
      const existing = await this.consentsRepo.findByPatientCreatorCategory(
        tx,
        dto.patientProfileId,
        actor.id,
        CONS.CATEGORY_PRACTITIONER_ACCESS,
      );
      const inCourse = existing.find(
        (c) =>
          c.statusConceptId === CONS.ACCESS_REQUEST_PENDING ||
          c.statusConceptId === CONS.CONSENT_ACTIVE,
      );
      if (inCourse) {
        throw new ConflictException(
          'Ya existe una solicitud pendiente o un vínculo activo con este paciente',
          { consentId: inCourse.id, status: inCourse.statusConceptId },
        );
      }

      const fresh = this.consentsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
        processingPurposeId: SEED.processingPurposeId,
        statusConceptId: CONS.ACCESS_REQUEST_PENDING,
        tenantId: SEED.tenantId,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const specialtyId of dto.specialtyConceptIds) {
        this.provisionsRepo.create(tx, {
          consentId: fresh.id,
          provisionTypeConceptId: CONS.PROVISION_TYPE_BASE,
          actionConceptId: CONS.ACTION_REQUESTED,
          dataClassConceptId: specialtyId,
          actorUserId: actor.id,
          createdByUserId: actor.id,
        });
      }

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        subjectId: fresh.id,
        eventTypeConceptId: CONS.EVENT_ACCESS_REQUESTED,
        previousStatusConceptId: CONS.STATUS_NONE,
        newStatusConceptId: CONS.ACCESS_REQUEST_PENDING,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'PRACTITIONER_ACCESS_REQUESTED',
        entity: 'consent',
        entityId: fresh.id,
      });

      return fresh;
    });

    // Fuera de la transacción, como todo aviso: que la campana no suene no
    // deshace una solicitud que ya existe.
    const patientUserId = await this.resolveUserIdForPatient(
      dto.patientProfileId,
    );
    if (patientUserId) {
      await this.notices.emit({
        kind: 'ACCESS_REQUESTED',
        recipientUserId: patientUserId,
        subject: 'Un médico pidió acceder a su historia clínica',
        bodyText:
          dto.reasonText ??
          'Un profesional le encontró en el padrón y pidió acceder a su expediente. Usted elige qué áreas autorizar.',
        requestId: consent.id,
      });
    } else {
      this.logger.warn(
        {
          operation: 'consent.practitioner-access.request',
          patientProfileId: dto.patientProfileId,
        },
        'No se encontró cuenta de usuario para avisarle al paciente',
      );
    }

    return this.toResponse(consent, dto.specialtyConceptIds, []);
  }

  /** FT-07-R06: las solicitudes que el paciente logueado tiene para decidir. */
  async listMineAsPatient(
    actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto[]> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return [];
    const profile = await this.patientProfilesRepo.findById(em, link.personId);
    if (!profile) return [];

    const pendientes = await this.consentsRepo.findPendingForPatient(
      em,
      profile.profileId,
      CONS.CATEGORY_PRACTITIONER_ACCESS,
      CONS.ACCESS_REQUEST_PENDING,
    );

    const results: PractitionerAccessRequestResponseDto[] = [];
    for (const consent of pendientes) {
      const provisions = await this.provisionsRepo.findOpenByConsent(
        em,
        consent.id,
      );
      const requested = provisions
        .filter((p) => p.actionConceptId === CONS.ACTION_REQUESTED)
        .map((p) => p.dataClassConceptId)
        .filter((id): id is string => id !== undefined);
      results.push(this.toResponse(consent, requested, []));
    }
    return results;
  }

  /**
   * FT-07-R05/R06/R07: el paciente decide. Aceptar exige elegir QUÉ áreas
   * autoriza (subconjunto de lo pedido); rechazar no requiere nada más.
   */
  async decide(
    id: string,
    dto: DecidePractitionerAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto> {
    this.logger.info(
      { operation: 'consent.practitioner-access.decide', consentId: id },
      'Patient deciding practitioner access request',
    );

    return this.em.transactional(async (tx) => {
      const consent = await this.consentsRepo.findById(tx, id);
      if (
        !consent ||
        consent.categoryConceptId !== CONS.CATEGORY_PRACTITIONER_ACCESS
      ) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }

      // Titularidad: sólo el paciente titular decide. Mismo criterio que
      // `assertOwnRecord` — el 404 de arriba ya cubre "no es tuya".
      const link = await this.accountLinksRepo.findActiveByUser(tx, actor.id);
      const profile = link
        ? await this.patientProfilesRepo.findById(tx, link.personId)
        : null;
      if (!profile || profile.profileId !== consent.patientProfileId) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }

      if (consent.statusConceptId !== CONS.ACCESS_REQUEST_PENDING) {
        throw new ConflictException('Esta solicitud ya fue decidida', {
          id,
          status: consent.statusConceptId,
        });
      }

      const requested = await this.provisionsRepo.findOpenByConsent(tx, id);
      const requestedSpecialties = new Set(
        requested
          .map((p) => p.dataClassConceptId)
          .filter((v): v is string => v !== undefined),
      );
      const practitionerUserId = consent.createdByUserId;
      if (!practitionerUserId) {
        // No debería ocurrir: `request()` siempre setea `createdByUserId`.
        throw new PreconditionFailedException(
          'La solicitud no tiene profesional asociado',
          { id },
        );
      }

      const now = new Date();

      if (dto.decision === 'DECLINED') {
        consent.statusConceptId = CONS.ACCESS_REQUEST_DECLINED;
        consent.grantedByUserId = actor.id;
        consent.validTo = now;
        touch(consent, actor.id, now);
        for (const provision of requested) {
          provision.actionConceptId = CONS.ACTION_DENY;
          touch(provision, actor.id, now);
        }
        this.eventsRepo.record(tx, {
          subjectTypeConceptId: CONS.SUBJECT_CONSENT,
          subjectId: id,
          eventTypeConceptId: CONS.EVENT_ACCESS_DECLINED,
          previousStatusConceptId: CONS.ACCESS_REQUEST_PENDING,
          newStatusConceptId: CONS.ACCESS_REQUEST_DECLINED,
          recordedByUserId: actor.id,
        });
        await tx.flush();
        await this.auditTrail.record(tx, actor, {
          action: 'PRACTITIONER_ACCESS_DECLINED',
          entity: 'consent',
          entityId: id,
        });

        await this.notices.emit({
          kind: 'ACCESS_DECLINED',
          recipientUserId: practitionerUserId,
          subject: 'El paciente no autorizó el acceso',
          bodyText: 'El paciente decidió no darle acceso a su expediente.',
          requestId: id,
        });

        return this.toResponse(consent, [...requestedSpecialties], []);
      }

      // ACCEPTED. El DTO exige `authorizedSpecialtyConceptIds` (@ValidateIf) —
      // acá se comprueba además que sea subconjunto de lo pedido: el paciente
      // no puede "autorizar" una especialidad que nadie le pidió.
      const authorized = dto.authorizedSpecialtyConceptIds ?? [];
      const invalid = authorized.filter(
        (id) => !requestedSpecialties.has(id),
      );
      if (invalid.length > 0) {
        throw new PreconditionFailedException(
          'Sólo se pueden autorizar especialidades que el profesional pidió',
          { invalidas: invalid },
        );
      }
      if (authorized.length === 0) {
        throw new PreconditionFailedException(
          'Aceptar exige autorizar al menos una especialidad; si no autoriza ninguna, rechace la solicitud',
          {},
        );
      }

      const meses = dto.validityMonths ?? DEFAULT_VALIDITY_MONTHS;
      const validTo = new Date(now);
      validTo.setMonth(validTo.getMonth() + meses);

      consent.statusConceptId = CONS.CONSENT_ACTIVE;
      consent.grantedByUserId = actor.id;
      consent.validFrom = now;
      consent.validTo = validTo;
      touch(consent, actor.id, now);

      const authorizedSet = new Set(authorized);
      for (const provision of requested) {
        provision.actionConceptId = authorizedSet.has(
          provision.dataClassConceptId ?? '',
        )
          ? CONS.ACTION_PERMIT
          : CONS.ACTION_DENY;
        touch(provision, actor.id, now);
      }

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        subjectId: id,
        eventTypeConceptId: CONS.EVENT_GRANTED,
        previousStatusConceptId: CONS.ACCESS_REQUEST_PENDING,
        newStatusConceptId: CONS.CONSENT_ACTIVE,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // El grant clínico es lo que `assertPuedeLeerHistoria` (clinical-read)
      // consulta de verdad — el consent es la evidencia, el grant es la
      // puerta. Purpose TREATMENT: es un vínculo de atención continuada, no
      // un trámite administrativo (payment/operations).
      const existing = await this.clinicalGrantsRepo.findActive(
        tx,
        consent.patientProfileId,
        practitionerUserId,
      );
      if (!existing) {
        this.clinicalGrantsRepo.create(tx, {
          patientProfileId: consent.patientProfileId,
          grantedUserId: practitionerUserId,
          tenantId: consent.tenantId ?? SEED.tenantId,
          consentId: consent.id,
          reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
          accessLevelConceptId: AUTHZ.ACCESS_LEVEL_READ,
          validFrom: now,
          validTo,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      await this.auditTrail.record(tx, actor, {
        action: 'PRACTITIONER_ACCESS_GRANTED',
        entity: 'consent',
        entityId: id,
      });

      await this.notices.emit({
        kind: 'ACCESS_ACCEPTED',
        recipientUserId: practitionerUserId,
        subject: 'El paciente autorizó el acceso',
        bodyText: `El paciente autorizó su acceso para ${authorized.length} de ${requestedSpecialties.size} área(s) pedida(s).`,
        requestId: id,
      });

      return this.toResponse(consent, [...requestedSpecialties], authorized);
    });
  }

  /** El `userId` de la cuenta dueña de este perfil de paciente, si existe. */
  private async resolveUserIdForPatient(
    patientProfileId: string,
  ): Promise<string | undefined> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByPerson(
      em,
      patientProfileId,
    );
    return link?.userId;
  }

  private toResponse(
    consent: Consents,
    requested: readonly string[],
    authorized: readonly string[],
  ): PractitionerAccessRequestResponseDto {
    return {
      id: consent.id,
      patientProfileId: consent.patientProfileId,
      requestedByUserId: consent.createdByUserId ?? '',
      status: consent.statusConceptId,
      requestedSpecialtyConceptIds: [...requested],
      authorizedSpecialtyConceptIds: [...authorized],
      reasonText: null,
      requestedAt: consent.createdAt,
    };
  }
}
