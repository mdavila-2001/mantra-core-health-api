import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { AttachableFileService } from '../../common/services';
import {
  AFFILIATION_DOCUMENT_VALUE_SETS,
  DOCUMENT_TYPE_CODE_BY_ROLE,
  DOCUMENT_VERIFICATION_PENDING,
  REGISTRATION_DOCUMENT_ROLES,
  countryIsoForLegalEntityType,
  issuingAuthorityCodeFor,
  type AffiliationDocumentRole,
  type RegistrationDocumentRole,
} from '../affiliation-documents';
import { DirectoryTenantLegalRepository } from '../repositories';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';

/** Rótulo en castellano de cada rol, para los mensajes de rechazo. */
const ROLE_LABEL_ES: Readonly<Record<AffiliationDocumentRole, string>> = {
  CONSTITUTION_DOC: 'la escritura de constitución',
  TAX_IDENTIFIER_DOC: 'el NIT',
  COMMERCE_REGISTRY_DOC: 'la matrícula de comercio (SEPREC)',
  OPERATING_LICENSE_DOC: 'la licencia de funcionamiento',
  HEALTH_AUTHORITY_CERT_DOC: 'el certificado del SEDES',
  POWER_OF_ATTORNEY_DOC: 'el poder del representante legal',
};

/** Los cinco archivos que el autorregistro público exige, por rol canónico. */
export type RegistrationDocumentFiles = Readonly<
  Record<RegistrationDocumentRole, string>
>;

/** Datos para vincular los documentos legales de un alta recién creada. */
export interface RegistrationDocumentsInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  /** Tipo societario declarado, para derivar el país y así la autoridad emisora. */
  readonly legalEntityType?: string;
  /** El NIT ya capturado por el formulario (`payer.regulatorIdentifier`); se copia a `document_number`. */
  readonly taxIdentifier?: string;
  readonly documents: RegistrationDocumentFiles;
}

/**
 * Vincula los documentos legales de afiliación (subtarea 1.2) al tenant que
 * el autorregistro público acaba de crear.
 *
 * Cada uno de los cinco `fileId` declarados llegó por
 * `POST /iam/auth/upload-registration-document` (pre-carga anónima, sin
 * dueño todavía). Este servicio, dentro de la MISMA transacción del alta:
 * (1) rechaza que dos documentos compartan archivo, (2) reclama cada archivo
 * para el tenant y el owner recién creados
 * (`AttachableFileService.claimAnonymousUpload`), y (3) crea la fila que lo
 * envuelve en `tenant_affiliation_documents`, con
 * `is_required_for_affiliation = true` y `verification_status = pendiente`.
 *
 * Un archivo no reclamable, ya vinculado a otra organización, o un código de
 * catálogo sin sembrar hacen fallar TODO el bloque (y con él la transacción
 * completa del alta): un archivo no puede quedar reclamado por un tenant que
 * termina no existiendo.
 */
@Injectable()
export class TenantAffiliationDocumentsService {
  constructor(
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly concepts: AffiliationDocumentConceptsService,
    private readonly attachable: AttachableFileService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantAffiliationDocumentsService.name);
  }

  /**
   * @param tx - Transacción activa del alta (nunca un `em.fork()` propio: el
   *   reclamo tiene que confirmarse o deshacerse junto con el tenant).
   * @param input - Tenant, owner, tipo societario y los cinco archivos.
   * @returns Los ids de las filas creadas, en el orden de
   *   {@link REGISTRATION_DOCUMENT_ROLES}.
   * @throws PreconditionFailedException si un archivo se repite entre roles,
   *   no es una pre-carga anónima válida, ya está vinculado a otra
   *   organización, o el catálogo de documentos de afiliación no tiene
   *   sembrado alguno de los códigos que hacen falta.
   */
  async attachRegistrationDocuments(
    tx: EntityManager,
    input: RegistrationDocumentsInput,
  ): Promise<string[]> {
    this.assertNoRepeatedFile(input.documents);

    const concepts = await this.concepts.resolve(tx);
    const countryIso = countryIsoForLegalEntityType(input.legalEntityType);
    const today = new Date();

    const createdIds: string[] = [];
    for (const role of REGISTRATION_DOCUMENT_ROLES) {
      const fileId = input.documents[role];
      const label = ROLE_LABEL_ES[role];

      const alreadyLinked = await this.legalRepo.findAffiliationDocumentByFile(
        tx,
        fileId,
      );
      if (alreadyLinked) {
        this.logger.warn(
          { operation: 'directory.affiliation-document.attach', role, fileId },
          'Refused to attach a file already linked to an affiliation document',
        );
        throw new PreconditionFailedException(
          `El documento ${label} ya está vinculado a una organización`,
          { role, fileId },
        );
      }

      await this.attachable.claimAnonymousUpload(
        tx,
        fileId,
        { tenantId: input.tenantId, ownerUserId: input.ownerUserId },
        {
          allowedMimeTypes: ['application/pdf'],
          allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
          operation: 'directory.affiliation-document.claim',
        },
        {
          subject: `El documento ${label}`,
          notFound: `El documento ${label} no fue encontrado`,
        },
      );

      const documentTypeConceptId = this.concepts.conceptIdOf(
        concepts.documentType,
        AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
        DOCUMENT_TYPE_CODE_BY_ROLE[role],
      );
      const issuingAuthorityConceptId = this.concepts.conceptIdOf(
        concepts.issuingAuthority,
        AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
        issuingAuthorityCodeFor(role, countryIso),
      );
      const verificationStatusConceptId = this.concepts.conceptIdOf(
        concepts.verificationStatus,
        AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
        DOCUMENT_VERIFICATION_PENDING,
      );

      const created = this.legalRepo.createAffiliationDocument(tx, {
        tenantId: input.tenantId,
        documentTypeConceptId,
        issuingAuthorityConceptId,
        fileId,
        // Sólo el NIT lleva número: es el único dato que el formulario ya
        // capturó por separado. El resto queda sin `documentNumber`, no
        // porque falte, sino porque nadie lo pidió todavía.
        documentNumber:
          role === 'TAX_IDENTIFIER_DOC' ? input.taxIdentifier : undefined,
        registeredAt: today,
        verificationStatusConceptId,
        isRequiredForAffiliation: true,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: input.ownerUserId,
      });
      createdIds.push(created.id);
    }

    return createdIds;
  }

  /**
   * Un mismo PDF respaldando dos documentos distintos no tiene sentido de
   * negocio y, además, el reclamo del segundo fallaría solo (el archivo ya
   * tendría dueño) con un mensaje que no diría por qué. Se corta antes.
   */
  private assertNoRepeatedFile(documents: RegistrationDocumentFiles): void {
    const seen = new Map<string, AffiliationDocumentRole[]>();
    for (const role of REGISTRATION_DOCUMENT_ROLES) {
      const fileId = documents[role];
      const roles = seen.get(fileId) ?? [];
      roles.push(role);
      seen.set(fileId, roles);
    }
    for (const [fileId, roles] of seen) {
      if (roles.length > 1) {
        throw new PreconditionFailedException(
          'Un mismo archivo no puede respaldar dos documentos distintos',
          { fileId, roles },
        );
      }
    }
  }
}
