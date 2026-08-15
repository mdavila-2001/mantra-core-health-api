import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  AddDocumentVersionDto,
  CreateRegulatoryDocumentDto,
  CreatedResourceDto,
  InvalidateDocumentDto,
  TransitionResultDto,
} from '../dto';
import type {
  RegulatoryDocumentAccessLog,
  RegulatoryDocumentVersions,
  RegulatoryDocuments,
} from '../entities';
import { RegulatoryRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';
import { PharmaLabOrganizationService } from './pharma-lab-organization.service';

/**
 * UC-17-31 a UC-17-33: repositorio documental legal y regulatorio
 * (spec 5600-5629).
 *
 * Tres reglas dan forma al servicio: no hay borrado definitivo de un documento
 * usado como respaldo (5628), toda consulta y descarga queda registrada (5629) y
 * el vencimiento avisa antes de ocurrir (5626). La primera es la razón de que no
 * exista ningún método `delete`; la segunda, de que las lecturas también
 * escriban.
 */
@Injectable()
export class RegulatoryDocumentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio documental.
   * @param access - Comprobaciones de vinculación y estado.
   * @param organization - Personal del laboratorio, destinatario de los avisos.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: RegulatoryRepository,
    private readonly access: PharmaLabAccessService,
    private readonly organization: PharmaLabOrganizationService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
  ) {}

  /**
   * UC-17-31: registra un documento con su primera versión.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del documento creado.
   */
  async createDocument(
    pharmaLabId: string,
    dto: CreateRegulatoryDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      const document = this.repo.createDocument(tx, {
        pharmaLabId,
        pharmaProductId: dto.pharmaProductId,
        medicalVisitorId: dto.medicalVisitorId,
        name: dto.name,
        documentTypeConceptId: dto.documentTypeConceptId,
        code: dto.code,
        currentVersion: dto.version,
        issuerName: dto.issuerName,
        issuedOn: dto.issuedOn,
        expiresOn: dto.expiresOn,
        statusConceptId: PHL.DOC_VALID,
        ownerStaffId: dto.ownerStaffId,
        disclosureLevelConceptId: dto.disclosureLevelConceptId,
        expiryAlertDays: dto.expiryAlertDays ?? 30,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.repo.createVersion(tx, {
        regulatoryDocumentId: document.id,
        version: dto.version,
        storageKey: dto.storageKey,
        fileName: dto.fileName,
        contentType: dto.contentType,
        issuedOn: dto.issuedOn,
        expiresOn: dto.expiresOn,
        statusConceptId: PHL.DOC_VALID,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'REGULATORY_DOCUMENT_CREATED',
        entity: 'regulatory_documents',
        entityId: document.id,
        tenantId: lab.tenantId,
      });
      return { id: document.id };
    });
  }

  /**
   * UC-17-32: sustituye el documento por una versión nueva.
   *
   * La versión anterior queda como `sustituida`, con su archivo intacto: es lo
   * que permite responder «qué decía la licencia el día de la inspección».
   *
   * @param pharmaLabId - Laboratorio.
   * @param documentId - Documento.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si el documento está invalidado.
   */
  async addVersion(
    pharmaLabId: string,
    documentId: string,
    dto: AddDocumentVersionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const document = await this.requireDocument(tx, pharmaLabId, documentId);
      if (document.statusConceptId === PHL.DOC_INVALIDATED) {
        throw new ConflictException(
          'Un documento invalidado no admite versiones nuevas',
          { documentId },
        );
      }

      const current = await this.repo.findCurrentVersion(tx, document.id);
      if (current) {
        current.statusConceptId = PHL.DOC_SUPERSEDED;
        current.changeReason = dto.changeReason;
        touch(current, actor.id);
      }

      this.repo.createVersion(tx, {
        regulatoryDocumentId: document.id,
        version: dto.version,
        storageKey: dto.storageKey,
        fileName: dto.fileName,
        contentType: dto.contentType,
        issuedOn: dto.issuedOn,
        expiresOn: dto.expiresOn,
        statusConceptId: PHL.DOC_VALID,
        changeReason: dto.changeReason,
        actorUserId: actor.id,
      });

      document.currentVersion = dto.version;
      document.issuedOn = dto.issuedOn ?? document.issuedOn;
      document.expiresOn = dto.expiresOn ?? document.expiresOn;
      document.statusConceptId = PHL.DOC_VALID;
      touch(document, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'REGULATORY_DOCUMENT_SUPERSEDED',
        entity: 'regulatory_documents',
        entityId: document.id,
        tenantId: lab.tenantId,
      });
      return { id: document.id, statusConceptId: document.statusConceptId };
    });
  }

  /**
   * UC-17-33: invalida un documento sin borrarlo.
   *
   * @param pharmaLabId - Laboratorio.
   * @param documentId - Documento.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   */
  async invalidateDocument(
    pharmaLabId: string,
    documentId: string,
    dto: InvalidateDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const document = await this.requireDocument(tx, pharmaLabId, documentId);
      if (document.statusConceptId === PHL.DOC_INVALIDATED) {
        throw new ConflictException('El documento ya está invalidado', {
          documentId,
        });
      }
      document.statusConceptId = PHL.DOC_INVALIDATED;
      touch(document, actor.id);

      const current = await this.repo.findCurrentVersion(tx, document.id);
      if (current) {
        current.statusConceptId = PHL.DOC_INVALIDATED;
        current.changeReason = dto.reason;
        touch(current, actor.id);
      }
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'REGULATORY_DOCUMENT_INVALIDATED',
        entity: 'regulatory_documents',
        entityId: document.id,
        tenantId: lab.tenantId,
      });
      return { id: document.id, statusConceptId: document.statusConceptId };
    });
  }

  /**
   * Lista los documentos del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Documentos ordenados por nombre.
   */
  async listDocuments(pharmaLabId: string): Promise<RegulatoryDocuments[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listDocuments(this.em, pharmaLabId);
  }

  /**
   * Lee un documento y **registra la consulta**.
   *
   * @param pharmaLabId - Laboratorio.
   * @param documentId - Documento.
   * @param actor - Usuario autenticado que consulta.
   * @returns El documento y sus versiones.
   */
  async getDocument(
    pharmaLabId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ): Promise<{
    /** El documento. */
    document: RegulatoryDocuments;
    /** Versiones, de la más reciente a la más antigua. */
    versions: RegulatoryDocumentVersions[];
  }> {
    return this.em.transactional(async (tx) => {
      await this.access.requireLab(tx, pharmaLabId);
      const document = await this.requireDocument(tx, pharmaLabId, documentId);
      const versions = await this.repo.listVersions(tx, document.id);
      this.repo.appendAccess(tx, {
        regulatoryDocumentId: document.id,
        accessKind: 'VIEW',
        actorUserId: actor.id,
      });
      await tx.flush();
      return { document, versions };
    });
  }

  /**
   * Registra la descarga de una versión y devuelve su referencia de archivo.
   *
   * @param pharmaLabId - Laboratorio.
   * @param documentId - Documento.
   * @param versionId - Versión descargada.
   * @param actor - Usuario autenticado que descarga.
   * @returns La versión descargada.
   * @throws ResourceNotFoundException si la versión no es del documento.
   */
  async registerDownload(
    pharmaLabId: string,
    documentId: string,
    versionId: string,
    actor: AuthenticatedUser,
  ): Promise<RegulatoryDocumentVersions> {
    return this.em.transactional(async (tx) => {
      await this.access.requireLab(tx, pharmaLabId);
      const document = await this.requireDocument(tx, pharmaLabId, documentId);
      const versions = await this.repo.listVersions(tx, document.id);
      const version = versions.find((candidate) => candidate.id === versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          documentId,
          versionId,
        });
      }
      this.repo.appendAccess(tx, {
        regulatoryDocumentId: document.id,
        regulatoryDocumentVersionId: version.id,
        accessKind: 'DOWNLOAD',
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'REGULATORY_DOCUMENT_DOWNLOADED',
        entity: 'regulatory_documents',
        entityId: document.id,
      });
      return version;
    });
  }

  /**
   * Lista los accesos registrados sobre un documento.
   *
   * @param pharmaLabId - Laboratorio.
   * @param documentId - Documento.
   * @returns Accesos del más reciente al más antiguo.
   */
  async listAccessLog(
    pharmaLabId: string,
    documentId: string,
  ): Promise<RegulatoryDocumentAccessLog[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    await this.requireDocument(this.em, pharmaLabId, documentId);
    return this.repo.listAccesses(this.em, documentId);
  }

  /**
   * Marca los documentos próximos a vencer y avisa al personal (spec 5626).
   *
   * Es idempotente: reejecutarla el mismo día no duplica el aviso porque solo
   * avisa cuando el documento **cambia** de vigente a próximo a vencer.
   *
   * @param pharmaLabId - Laboratorio.
   * @param actor - Usuario autenticado que ejecuta la revisión.
   * @returns Cuántos documentos pasaron a próximos a vencer y cuántos vencieron.
   */
  async reviewExpirations(
    pharmaLabId: string,
    actor: AuthenticatedUser,
  ): Promise<{
    /** Documentos que pasaron a «próximo a vencer». */
    expiring: number;
    /** Documentos que pasaron a «vencido». */
    expired: number;
  }> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const today = new Date();
      const horizon = new Date(today.getTime() + 365 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const documents = await this.repo.listExpiringDocuments(
        tx,
        pharmaLabId,
        horizon,
      );
      const staffUserIds = await this.organization.listActiveStaffUserIds(
        tx,
        pharmaLabId,
      );
      const todayIso = today.toISOString().slice(0, 10);

      let expiring = 0;
      let expired = 0;
      for (const document of documents) {
        if (!document.expiresOn) continue;
        const alertFrom = new Date(
          new Date(`${document.expiresOn}T00:00:00Z`).getTime() -
            document.expiryAlertDays * 86_400_000,
        )
          .toISOString()
          .slice(0, 10);

        if (document.expiresOn < todayIso) {
          if (document.statusConceptId !== PHL.DOC_EXPIRED) {
            document.statusConceptId = PHL.DOC_EXPIRED;
            touch(document, actor.id);
            expired += 1;
            this.notifications.notifyAll(
              tx,
              staffUserIds,
              {
                templateCode: 'PHARMA_LAB_DOCUMENT_EXPIRED',
                subject: `Documento vencido: ${document.name}`,
                bodyText: `Venció el ${document.expiresOn}.`,
                relatedResourceType: 'regulatory_document',
                relatedResourceId: document.id,
                tenantId: lab.tenantId,
              },
              actor.id,
            );
          }
        } else if (
          todayIso >= alertFrom &&
          document.statusConceptId === PHL.DOC_VALID
        ) {
          document.statusConceptId = PHL.DOC_EXPIRING;
          touch(document, actor.id);
          expiring += 1;
          this.notifications.notifyAll(
            tx,
            staffUserIds,
            {
              templateCode: 'PHARMA_LAB_DOCUMENT_EXPIRING',
              subject: `Documento próximo a vencer: ${document.name}`,
              bodyText: `Vence el ${document.expiresOn}.`,
              relatedResourceType: 'regulatory_document',
              relatedResourceId: document.id,
              tenantId: lab.tenantId,
            },
            actor.id,
          );
        }
      }
      await tx.flush();
      return { expiring, expired };
    });
  }

  private async requireDocument(
    tx: EntityManager,
    pharmaLabId: string,
    documentId: string,
  ): Promise<RegulatoryDocuments> {
    const document = await this.repo.findDocument(tx, documentId);
    if (!document || document.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Documento no encontrado en el laboratorio',
        { pharmaLabId, documentId },
      );
    }
    return document;
  }
}
