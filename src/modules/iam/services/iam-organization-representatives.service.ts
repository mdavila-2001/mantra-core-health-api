import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import {
  EXECUTIVE_DTO_KEYS,
  EXECUTIVE_ROLE_BY_DTO_KEY,
} from '../../directory/legal-representatives';
import {
  TenantLegalRepresentativesService,
  type RegistrationExecutive,
} from '../../directory/services';
import { PersonsRepository } from '../../profiles/repositories';
import { createContactPerson } from '../../profiles/services';
import type {
  RegisterOrganizationExecutivesDto,
  RegisterOrganizationLegalRepresentativeDto,
} from '../dto';

/** Lo que el alta declara sobre quiénes representan a la organización. */
export interface OrganizationRepresentativesInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  /** Tipo societario declarado, para derivar la autoridad emisora del poder. */
  readonly legalEntityType?: string;
  /** Los archivos que los cinco documentos de la empresa ya declararon. */
  readonly legalDocumentFileIds: readonly string[];
  readonly legalRepresentative?: RegisterOrganizationLegalRepresentativeDto;
  readonly executives?: RegisterOrganizationExecutivesDto;
}

/**
 * Crea las personas de contacto de una organización recién registrada y las
 * vincula con su rol (subtarea 1.4).
 *
 * ## Por qué vive en `iam` y no en `directory`
 *
 * Porque escribe `profiles.persons`, y `PersonsRepository` es «el único punto
 * de inserción de `persons` en toda la API». `ProfilesModule` importa
 * `DirectoryModule` (para la bandeja de vínculos y las membresías), así que el
 * camino inverso cerraría un ciclo — y este repo no usa `forwardRef` en ningún
 * módulo. `IamModule` ya importa los tres módulos que hacen falta, y el alta de
 * organización ya vive acá.
 *
 * ## Por qué es un colaborador aparte y no cuatro parámetros más
 *
 * `IamOrganizationSelfRegistrationService` ya recibe catorce dependencias.
 * Sumarle los tres repositorios de personas/identificadores/contactos más el
 * servicio de vínculos lo llevaría a dieciocho, para un paso que es una sola
 * decisión: «registrar a quienes representan a esta organización».
 */
@Injectable()
export class IamOrganizationRepresentativesService {
  constructor(
    private readonly personsRepo: PersonsRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly representatives: TenantLegalRepresentativesService,
  ) {}

  /**
   * Registra al representante legal y a las gerencias declaradas.
   *
   * Todas las personas se construyen primero y se persisten con un solo
   * `flush`: `tenant_legal_representatives.person_id` es una FK inmediata, así
   * que las filas de `profiles.persons` tienen que existir en la base antes de
   * que los vínculos las nombren.
   *
   * @param tx - Transacción activa del alta.
   * @param input - Tenant y owner recién creados, y lo que declaró el cliente.
   * @returns Cuántos vínculos quedaron registrados.
   */
  async register(
    tx: EntityManager,
    input: OrganizationRepresentativesInput,
  ): Promise<{ representativesRegistered: number }> {
    const { legalRepresentative, executives } = input;
    if (!legalRepresentative && !executives) {
      return { representativesRegistered: 0 };
    }

    const repos = {
      persons: this.personsRepo,
      identifiers: this.identifiersRepo,
      contactPoints: this.contactPointsRepo,
    };

    const representanteCreado = legalRepresentative
      ? createContactPerson(repos, tx, {
          displayName: legalRepresentative.fullName,
          email: legalRepresentative.email,
          phone: legalRepresentative.phone,
          nationalId: legalRepresentative.idNumber,
          actorUserId: input.ownerUserId,
        })
      : undefined;

    const gerenciasCreadas: RegistrationExecutive[] = [];
    if (executives) {
      for (const key of EXECUTIVE_DTO_KEYS) {
        const contacto = executives[key];
        const { personId } = createContactPerson(repos, tx, {
          displayName: contacto.fullName,
          email: contacto.email,
          mobile: contacto.phone,
          actorUserId: input.ownerUserId,
        });
        gerenciasCreadas.push({
          role: EXECUTIVE_ROLE_BY_DTO_KEY[key],
          personId,
        });
      }
    }

    // Las personas antes que los vínculos: `person_id` es FK inmediata y
    // MikroORM no ordena inserts entre columnas uuid planas.
    await tx.flush();

    const { count } =
      await this.representatives.attachRegistrationRepresentatives(tx, {
        tenantId: input.tenantId,
        ownerUserId: input.ownerUserId,
        legalEntityType: input.legalEntityType,
        alreadyDeclaredFileIds: input.legalDocumentFileIds,
        legalRepresentative:
          legalRepresentative && representanteCreado
            ? {
                personId: representanteCreado.personId,
                ciIdentifierId: representanteCreado.identifierId,
                powerOfAttorneyFileId:
                  legalRepresentative.powerOfAttorneyFileId,
              }
            : undefined,
        executives: gerenciasCreadas.length > 0 ? gerenciasCreadas : undefined,
      });

    return { representativesRegistered: count };
  }
}
