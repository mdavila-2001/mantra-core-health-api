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
import {
  AffiliationDocumentConceptsService,
  type AffiliationDocumentConcepts,
} from './affiliation-document-concepts.service';

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
  Record<Exclude<RegistrationDocumentRole, 'CONSTITUTION_DOC'>, string> & {
    /** Una unipersonal no tiene escritura de constitución: la regla la decide el llamador. */
    CONSTITUTION_DOC?: string;
  }
>;

/** Datos para vincular los documentos legales de un alta recién creada. */
export interface RegistrationDocumentsInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  /** Tipo societario declarado, para derivar el país y así la autoridad emisora. */
  readonly legalEntityType?: string;
  /** The NIT the form captured; copied to `document_number` of the tax document. */
  readonly taxIdentifier?: string;
  /** Its `common.identifiers` row (`TenantTaxIdentifierService`), linked from that document. */
  readonly taxIdentifierId?: string;
  readonly documents: RegistrationDocumentFiles;
}

/** Datos para vincular el poder notariado del representante legal (subtarea 1.4). */
export interface PowerOfAttorneyInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  /** Tipo societario declarado, para derivar el país y así la autoridad emisora. */
  readonly legalEntityType?: string;
  /** El PDF del poder, ya pre-cargado sin sesión. */
  readonly fileId: string;
  /** La persona a la que el poder acredita. */
  readonly relatedPersonId: string;
  /** Los archivos que los documentos de la empresa ya declararon en esta alta. */
  readonly alreadyDeclaredFileIds: readonly string[];
}

/** Lo que `attachOne` necesita y no viaja en el rol ni en el archivo. */
interface AttachContext {
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly countryIso: ReturnType<typeof countryIsoForLegalEntityType>;
  readonly concepts: AffiliationDocumentConcepts;
  readonly today: Date;
  readonly documentNumber?: string;
  readonly identifierId?: string;
  readonly relatedPersonId?: string;
}

/**
 * Links the affiliation documents (subtask 1.2) to the tenant the public
 * sign-up just created. Each `fileId` is an anonymous pre-upload
 * (`POST /iam/auth/upload-registration-document`). Within the SAME sign-up
 * transaction it (1) refuses two documents sharing a file, (2) claims each file
 * for the new tenant and owner (`AttachableFileService.claimAnonymousUpload`),
 * and (3) creates its `tenant_affiliation_documents` row, required and pending.
 *
 * An unclaimable file, a file linked to another organization, or an unseeded
 * catalog code fails the WHOLE block and the sign-up: no file can stay claimed
 * by a tenant that never came to exist.
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
      // Only optional when the caller checked the legal entity type allows it.
      if (fileId === undefined) continue;
      const created = await this.attachOne(tx, role, fileId, {
        tenantId: input.tenantId,
        ownerUserId: input.ownerUserId,
        countryIso,
        concepts,
        today,
        // Only the tax document carries the NIT, and points at its identifier.
        ...(role === 'TAX_IDENTIFIER_DOC'
          ? {
              documentNumber: input.taxIdentifier,
              identifierId: input.taxIdentifierId,
            }
          : {}),
      });
      createdIds.push(created);
    }

    return createdIds;
  }

  /**
   * Vincula el poder notariado del representante legal (subtarea 1.4).
   *
   * Va por separado de {@link attachRegistrationDocuments} porque no es uno de
   * los cinco documentos de la empresa: acredita a UNA persona, y su fila
   * apunta a ella con `related_person_id`. Lo demás es idéntico —misma
   * pre-carga anónima, mismo reclamo dentro de la transacción del alta, misma
   * autoridad emisora derivada del país (en Bolivia, la notaría)—.
   *
   * @param tx - Transacción activa del alta.
   * @param input - Tenant, owner, tipo societario, archivo del poder, la
   *   persona acreditada y los archivos que los documentos de la empresa ya
   *   declararon en esta misma alta.
   * @returns Id de la fila creada.
   * @throws PreconditionFailedException si el archivo ya lo usó otro documento
   *   de esta alta, si no es una pre-carga anónima válida, si ya está
   *   vinculado a otra organización, o si el catálogo no tiene el código.
   */
  async attachPowerOfAttorney(
    tx: EntityManager,
    input: PowerOfAttorneyInput,
  ): Promise<string> {
    // Antes de tocar la base: el reclamo del segundo uso fallaría igual —el
    // archivo ya tendría dueño— pero con un mensaje que no diría por qué.
    if (input.alreadyDeclaredFileIds.includes(input.fileId)) {
      throw new PreconditionFailedException(
        'Un mismo archivo no puede respaldar dos documentos distintos',
        { fileId: input.fileId, roles: ['POWER_OF_ATTORNEY_DOC'] },
      );
    }

    const concepts = await this.concepts.resolve(tx);
    return this.attachOne(tx, 'POWER_OF_ATTORNEY_DOC', input.fileId, {
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      countryIso: countryIsoForLegalEntityType(input.legalEntityType),
      concepts,
      today: new Date(),
      relatedPersonId: input.relatedPersonId,
    });
  }

  /**
   * Vincula **un** documento de la empresa a un tenant ya existente (P50).
   *
   * Es la puerta para completar después del alta los papeles que el alta
   * pública dejó opcionales (`POST /tenants/{id}/affiliation-documents`). Usa
   * el mismo reclamo y la misma fila que el autorregistro; quién puede
   * llamarla y si el tipo ya estaba presentado lo decide el llamador.
   *
   * @param tx - Transacción activa.
   * @param role - Rol del documento (no el poder: ese va con su persona).
   * @param input - Tenant, quien sube, tipo societario y archivo.
   * @returns El id de la fila creada.
   */
  async attachDocument(
    tx: EntityManager,
    role: RegistrationDocumentRole,
    input: {
      readonly tenantId: string;
      readonly ownerUserId: string;
      readonly legalEntityType?: string;
      readonly fileId: string;
      readonly documentNumber?: string;
      readonly identifierId?: string;
    },
  ): Promise<string> {
    const concepts = await this.concepts.resolve(tx);
    return this.attachOne(tx, role, input.fileId, {
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      countryIso: countryIsoForLegalEntityType(input.legalEntityType),
      concepts,
      today: new Date(),
      documentNumber: input.documentNumber,
      identifierId: input.identifierId,
    });
  }

  /**
   * Reclama un archivo y crea la fila que lo envuelve.
   *
   * Es el cuerpo que compartían los cinco documentos del autorregistro y que
   * el poder notariado necesitaba igual; extraerlo evitó una segunda copia que
   * se iba a separar de ésta en el primer cambio.
   */
  private async attachOne(
    tx: EntityManager,
    role: AffiliationDocumentRole,
    fileId: string,
    ctx: AttachContext,
  ): Promise<string> {
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
      { tenantId: ctx.tenantId, ownerUserId: ctx.ownerUserId },
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
      ctx.concepts.documentType,
      AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
      DOCUMENT_TYPE_CODE_BY_ROLE[role],
    );
    const issuingAuthorityConceptId = this.concepts.conceptIdOf(
      ctx.concepts.issuingAuthority,
      AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
      issuingAuthorityCodeFor(role, ctx.countryIso),
    );
    const verificationStatusConceptId = this.concepts.conceptIdOf(
      ctx.concepts.verificationStatus,
      AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
      DOCUMENT_VERIFICATION_PENDING,
    );

    const created = this.legalRepo.createAffiliationDocument(tx, {
      tenantId: ctx.tenantId,
      documentTypeConceptId,
      issuingAuthorityConceptId,
      fileId,
      documentNumber: ctx.documentNumber,
      identifierId: ctx.identifierId,
      registeredAt: ctx.today,
      relatedPersonId: ctx.relatedPersonId,
      verificationStatusConceptId,
      isRequiredForAffiliation: true,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: ctx.ownerUserId,
    });
    return created.id;
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
      if (fileId === undefined) continue;
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
