import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import {
  LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
  REPRESENTATIVE_ROLE_CODE,
  type ExecutiveRole,
} from '../legal-representatives';
import { DirectoryTenantLegalRepository } from '../repositories';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';
import { TenantAffiliationDocumentsService } from './tenant-affiliation-documents.service';

/** El representante legal declarado por el alta, con su persona ya creada. */
export interface RegistrationLegalRepresentative {
  /** La persona que ya se creó para él (`profiles.persons`). */
  readonly personId: string;
  /** Su CI, si el alta lo declaró (`common.identifiers`). */
  readonly ciIdentifierId?: string;
  /** El PDF del poder, pre-cargado sin sesión. Ausente sólo en una unipersonal. */
  readonly powerOfAttorneyFileId?: string;
}

/** Una gerencia de contacto declarada por el alta, con su persona ya creada. */
export interface RegistrationExecutive {
  readonly role: ExecutiveRole;
  readonly personId: string;
}

/** Lo que el autorregistro aporta para materializar los vínculos. */
export interface RegistrationRepresentativesInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  /** Tipo societario declarado, para derivar la autoridad emisora del poder. */
  readonly legalEntityType?: string;
  /** Los archivos que los cinco documentos de la empresa ya declararon. */
  readonly alreadyDeclaredFileIds: readonly string[];
  readonly legalRepresentative?: RegistrationLegalRepresentative;
  readonly executives?: readonly RegistrationExecutive[];
}

/** Lo que quedó registrado. */
export interface RegisteredRepresentatives {
  /** Id del vínculo del representante legal, si se declaró. */
  readonly legalRepresentativeId?: string;
  /** Cuántos vínculos se crearon en total (representante + gerencias). */
  readonly count: number;
}

/**
 * Registra quién representa a la organización y quiénes son sus gerencias de
 * contacto (subtarea 1.4).
 *
 * ## Qué resuelve
 *
 * `directory.tenant_legal_representatives` está materializada desde v4.0.4 en
 * las cuatro capas y **no tenía un solo escritor**: el registro de procesos la
 * pedía («Nombre Representante Legal — FALTA: solo existe la tabla») y el alta
 * no la tocaba. Este servicio es ese escritor.
 *
 * ## Por qué las gerencias son filas de esta tabla y no membresías
 *
 * `directory.tenant_memberships` exige `user_id`: un gerente comercial del que
 * el registro sólo pide nombre, celular y correo **no tiene cuenta**, y
 * forzarlo obligaría a crear tres usuarios fantasma por aseguradora. Tampoco
 * tendría dónde guardar el celular. Esta tabla, en cambio, nombra a una
 * persona con un rol dentro de una organización, que es exactamente lo que
 * son. El día que un gerente tenga cuenta, la membresía se suma: no reemplaza
 * a esta fila.
 *
 * ## Por qué `is_primary` sólo lo lleva el representante
 *
 * `uk_tenant_legal_representatives_primary` es UNIQUE sobre
 * `(tenant_id, is_primary)` y **no es parcial**: con `false` tampoco cabría
 * más de una fila por tenant. Ver `legal-representatives.ts`.
 *
 * ## Por qué no se declaran fechas
 *
 * `appointed_at`, `valid_from` y `valid_to` quedan nulas porque nadie las
 * pide: el formulario no pregunta desde cuándo ejerce el representante, y
 * poner la fecha del alta afirmaría un hecho que nadie declaró.
 */
@Injectable()
export class TenantLegalRepresentativesService {
  constructor(
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly concepts: AffiliationDocumentConceptsService,
    private readonly documents: TenantAffiliationDocumentsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantLegalRepresentativesService.name);
  }

  /**
   * Materializa los vínculos dentro de la transacción del alta.
   *
   * El poder del representante se vincula primero y se **flushea** antes de
   * crear su fila: `power_of_attorney_document_id` es una FK inmediata (no hay
   * una sola constraint `DEFERRABLE` en el modelo) y MikroORM no ordena
   * inserts entre columnas uuid planas.
   *
   * @param tx - Transacción activa del alta (nunca un `em.fork()` propio).
   * @param input - Tenant, owner, tipo societario y las personas ya creadas.
   * @returns El id del vínculo del representante y cuántos se crearon.
   * @throws PreconditionFailedException si el catálogo de roles no tiene
   *   sembrado alguno de los códigos, o si el archivo del poder no se puede
   *   reclamar.
   */
  async attachRegistrationRepresentatives(
    tx: EntityManager,
    input: RegistrationRepresentativesInput,
  ): Promise<RegisteredRepresentatives> {
    const { legalRepresentative, executives = [] } = input;
    if (!legalRepresentative && executives.length === 0) {
      return { count: 0 };
    }

    const concepts = await this.concepts.resolve(tx);
    const conceptIdOfRole = (role: keyof typeof REPRESENTATIVE_ROLE_CODE) =>
      this.concepts.conceptIdOf(
        concepts.representativeRole,
        LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
        REPRESENTATIVE_ROLE_CODE[role],
        'roles de representante legal',
      );

    let legalRepresentativeId: string | undefined;
    let count = 0;

    if (legalRepresentative) {
      const powerOfAttorneyDocumentId =
        legalRepresentative.powerOfAttorneyFileId === undefined
          ? undefined
          : await this.documents.attachPowerOfAttorney(tx, {
              tenantId: input.tenantId,
              ownerUserId: input.ownerUserId,
              legalEntityType: input.legalEntityType,
              fileId: legalRepresentative.powerOfAttorneyFileId,
              relatedPersonId: legalRepresentative.personId,
              alreadyDeclaredFileIds: input.alreadyDeclaredFileIds,
            });
      // El documento tiene que existir en la base antes de que la fila del
      // representante lo nombre: la FK es inmediata.
      await tx.flush();

      const creado = this.legalRepo.createLegalRepresentative(tx, {
        tenantId: input.tenantId,
        personId: legalRepresentative.personId,
        representativeRoleConceptId: conceptIdOfRole('LEGAL_REPRESENTATIVE'),
        ciIdentifierId: legalRepresentative.ciIdentifierId,
        powerOfAttorneyDocumentId,
        isPrimary: true,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: input.ownerUserId,
      });
      legalRepresentativeId = creado.id;
      count += 1;
    }

    for (const executive of executives) {
      this.legalRepo.createLegalRepresentative(tx, {
        tenantId: input.tenantId,
        personId: executive.personId,
        representativeRoleConceptId: conceptIdOfRole(executive.role),
        // Sin `isPrimary`: la clave única no es parcial y un `false` repetido
        // la violaría igual que un `true` repetido.
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: input.ownerUserId,
      });
      count += 1;
    }

    this.logger.info(
      {
        operation: 'directory.legal-representatives.attach',
        tenantId: input.tenantId,
        count,
      },
      'Legal representative and executive contacts registered',
    );

    return { legalRepresentativeId, count };
  }
}
