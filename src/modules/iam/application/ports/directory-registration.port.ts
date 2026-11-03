import type { EntityManager } from '@mikro-orm/postgresql';
import type { ExecutiveRole } from '../../../../common/constants/legal-representatives';
import type { RegisterOrganizationDetailsDto } from '../../presentation/dto';

/** Un ejecutivo de la organización, con el rol canónico que declara el alta. */
export interface RegistrationExecutiveInput {
  readonly role: ExecutiveRole;
  readonly personId: string;
}

/** Lo que el alta aporta para vincular a quienes representan a la organización. */
export interface RegistrationRepresentativesInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly legalEntityType?: string;
  readonly alreadyDeclaredFileIds: readonly string[];
  readonly legalRepresentative?: {
    readonly personId: string;
    readonly ciIdentifierId?: string;
    readonly powerOfAttorneyFileId?: string;
  };
  readonly executives?: readonly RegistrationExecutiveInput[];
}

/** Lo que el alta aporta para vincular los documentos legales de afiliación. */
export interface RegistrationDocumentsInput {
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly legalEntityType?: string;
  readonly taxIdentifier?: string;
  /** Rol canónico del documento → `fileId` ya subido. */
  readonly documents: Readonly<Record<string, string | undefined>>;
}

/**
 * Registros de `directory` que las altas escriben junto a la cuenta: membresía
 * de tenant y, para una organización, el tenant, sus sucursales, el perfil
 * según su tipo, los documentos legales y los representantes.
 *
 * Las cargas de `create*` son las de los repositorios de `directory`.
 */
export interface DirectoryRegistrationPort {
  createTenantMembership(tx: EntityManager, data: object): { id: string };

  findTenantByCode(tx: EntityManager, code: string): Promise<unknown>;
  createTenant(
    tx: EntityManager,
    data: object,
  ): { id: string; code: string; statusConceptId: string };
  createBranch(tx: EntityManager, data: object): unknown;

  assertProfileMatchesType(organization: RegisterOrganizationDetailsDto): void;
  declaredConcepts(
    organization: RegisterOrganizationDetailsDto,
  ): Record<string, string | undefined>;
  assertConceptsExist(
    tx: EntityManager,
    concepts: Record<string, string | undefined>,
  ): Promise<void>;
  materializeProfile(
    tx: EntityManager,
    tenantId: string,
    organization: RegisterOrganizationDetailsDto,
    actorUserId: string,
  ): Promise<string | undefined>;

  attachRegistrationDocuments(
    tx: EntityManager,
    input: RegistrationDocumentsInput,
  ): Promise<string[]>;
  attachRegistrationRepresentatives(
    tx: EntityManager,
    input: RegistrationRepresentativesInput,
  ): Promise<{ count: number }>;
}

export const DIRECTORY_REGISTRATION_PORT = Symbol(
  'IAM_DIRECTORY_REGISTRATION_PORT',
);
