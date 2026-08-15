import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfiles, SocialPosts } from '../../community/entities';
import { COMM } from '../../community/community.concepts';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  CreatedResourceDto,
  DecideVisitorPostDto,
  SubmitVisitorPostDto,
  TransitionResultDto,
} from '../dto';
import type { VisitorPostSubmissions } from '../entities';
import { AnalyticsRepository, CatalogRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';

/**
 * UC-17-35 y UC-17-36: publicaciones individuales de visitadores sujetas a
 * aprobación previa (spec 5565-5566, 5573).
 *
 * La red social **es la del sistema** (`community`): acá no se construye un muro
 * paralelo. Lo único propio del carril es el trámite de autorización, porque un
 * visitador publicando sin control es exactamente lo que la spec prohíbe al
 * enumerar publicidad engañosa, promesas no verificadas y promoción de usos no
 * autorizados (5567-5572).
 *
 * Mientras el trámite está pendiente o rechazado, **la publicación no existe**.
 * No es una publicación oculta que un fallo de filtrado pueda revelar.
 */
@Injectable()
export class PharmaSocialService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de propuestas de publicación.
   * @param catalog - Repositorio del catálogo, para validar el material adjunto.
   * @param access - Comprobaciones de vinculación y estado.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AnalyticsRepository,
    private readonly catalog: CatalogRepository,
    private readonly access: PharmaLabAccessService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
  ) {}

  /**
   * UC-17-35: el visitador propone una publicación.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Visitador autenticado.
   * @returns Identificador de la propuesta.
   * @throws PreconditionFailedException si el material adjunto no está aprobado.
   */
  async submit(
    dto: SubmitVisitorPostDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { visitor, lab } = await this.access.requireOperatingVisitor(
        tx,
        actor,
      );
      if (dto.informationalMaterialId) {
        const material = await this.catalog.findMaterial(
          tx,
          dto.informationalMaterialId,
        );
        if (!material || material.pharmaLabId !== lab.id) {
          throw new ResourceNotFoundException(
            'Material informativo no encontrado en el laboratorio',
            { informationalMaterialId: dto.informationalMaterialId },
          );
        }
        if (material.statusConceptId !== PHL.MATERIAL_APPROVED) {
          throw new PreconditionFailedException(
            'Solo se puede adjuntar material científico aprobado',
            { informationalMaterialId: material.id },
          );
        }
      }

      const submission = this.repo.createPostSubmission(tx, {
        pharmaLabId: lab.id,
        medicalVisitorId: visitor.id,
        body: dto.body,
        informationalMaterialId: dto.informationalMaterialId,
        statusConceptId: PHL.POST_SUBMISSION_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISITOR_POST_SUBMITTED',
        entity: 'visitor_post_submissions',
        entityId: submission.id,
        tenantId: lab.tenantId,
      });
      return { id: submission.id };
    });
  }

  /**
   * UC-17-36: la organización aprueba o rechaza la publicación propuesta.
   *
   * Al aprobar, y solo entonces, se crea la publicación real en la red social.
   *
   * @param pharmaLabId - Laboratorio.
   * @param submissionId - Propuesta.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que decide.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si la propuesta ya fue resuelta.
   */
  async decide(
    pharmaLabId: string,
    submissionId: string,
    dto: DecideVisitorPostDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const submission = await this.repo.findPostSubmission(tx, submissionId);
      if (!submission || submission.pharmaLabId !== pharmaLabId) {
        throw new ResourceNotFoundException('Propuesta no encontrada', {
          pharmaLabId,
          submissionId,
        });
      }
      if (submission.statusConceptId !== PHL.POST_SUBMISSION_PENDING) {
        throw new ConflictException('La propuesta ya fue resuelta', {
          submissionId,
        });
      }
      if (
        dto.statusConceptId !== PHL.POST_SUBMISSION_APPROVED &&
        dto.statusConceptId !== PHL.POST_SUBMISSION_REJECTED
      ) {
        throw new PreconditionFailedException(
          'La decisión debe ser aprobar o rechazar',
          { submissionId },
        );
      }

      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        submission.medicalVisitorId,
      );

      submission.statusConceptId = dto.statusConceptId;
      submission.decisionRationale = dto.rationale;
      submission.decidedByUserId = actor.id;
      submission.decidedAt = new Date();
      touch(submission, actor.id);

      if (dto.statusConceptId === PHL.POST_SUBMISSION_APPROVED) {
        const profile = await this.ensurePublicProfile(
          tx,
          lab.tenantId,
          visitor.userId,
          visitor.fullName,
          actor,
        );
        const post = tx.create(
          SocialPosts,
          {
            authorPublicProfileId: profile.id,
            postTypeConceptId: COMM.POST_TYPE_TEXT,
            bodyText: submission.body,
            visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
            commentsEnabled: true,
            moderationStatusConceptId: COMM.MODERATION_APPROVED,
            publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
            publishedAt: new Date(),
            ...createdBy(actor.id),
          },
          { partial: true },
        );
        await tx.flush();
        submission.socialPostId = post.id;
      }

      this.notifications.notify(
        tx,
        {
          recipientUserId: visitor.userId,
          templateCode:
            dto.statusConceptId === PHL.POST_SUBMISSION_APPROVED
              ? 'PHARMA_LAB_POST_APPROVED'
              : 'PHARMA_LAB_POST_REJECTED',
          subject:
            dto.statusConceptId === PHL.POST_SUBMISSION_APPROVED
              ? 'Tu publicación fue aprobada'
              : 'Tu publicación fue rechazada',
          bodyText: dto.rationale,
          relatedResourceType: 'visitor_post_submission',
          relatedResourceId: submission.id,
          tenantId: lab.tenantId,
        },
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action:
          dto.statusConceptId === PHL.POST_SUBMISSION_APPROVED
            ? 'VISITOR_POST_APPROVED'
            : 'VISITOR_POST_REJECTED',
        entity: 'visitor_post_submissions',
        entityId: submission.id,
        tenantId: lab.tenantId,
      });
      return {
        id: submission.id,
        statusConceptId: submission.statusConceptId,
      };
    });
  }

  /**
   * Lista las propuestas de publicación del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Propuestas de la más reciente a la más antigua.
   */
  async listSubmissions(
    pharmaLabId: string,
  ): Promise<VisitorPostSubmissions[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listPostSubmissions(this.em, pharmaLabId);
  }

  /**
   * Resuelve el perfil público del visitador, creándolo si el laboratorio nunca
   * le habilitó uno.
   */
  private async ensurePublicProfile(
    tx: EntityManager,
    tenantId: string,
    userId: string,
    displayName: string,
    actor: AuthenticatedUser,
  ): Promise<PublicProfiles> {
    const existing = await tx.findOne(PublicProfiles, {
      tenantId,
      targetTypeConceptId: COMM.PROFILE_TARGET_USER,
      targetId: userId,
    });
    if (existing) return existing;

    const profile = tx.create(
      PublicProfiles,
      {
        tenantId,
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
        targetId: userId,
        displayName,
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        commentsDefaultEnabled: true,
        ...createdBy(actor.id),
      },
      { partial: true },
    );
    await tx.flush();
    return profile;
  }
}
