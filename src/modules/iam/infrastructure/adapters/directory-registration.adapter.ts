import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Tenants } from '../../../directory/entities';
import {
  BranchesRepository,
  TenantMembershipsRepository,
  TenantsRepository,
} from '../../../directory/repositories';
import {
  TenantAffiliationDocumentsService,
  TenantLegalRepresentativesService,
  TenantTaxIdentifierService,
  TenantTypeProfileService,
  type RegistrationDocumentsInput as DirectoryDocumentsInput,
} from '../../../directory/services';
import type {
  DirectoryRegistrationPort,
  RegistrationDocumentsInput,
  RegistrationRepresentativesInput,
} from '../../application/ports/directory-registration.port';
import type { RegisterOrganizationDetailsDto } from '../../presentation/dto';

/**
 * Los registros de `directory` que las altas escriben junto a la cuenta:
 * membresías, tenant, sucursales, perfil por tipo, documentos legales y
 * representantes.
 */
@Injectable()
export class DirectoryRegistrationAdapter implements DirectoryRegistrationPort {
  constructor(
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly branchesRepo: BranchesRepository,
    private readonly typeProfile: TenantTypeProfileService,
    private readonly affiliationDocuments: TenantAffiliationDocumentsService,
    private readonly representatives: TenantLegalRepresentativesService,
    private readonly taxIdentifiers: TenantTaxIdentifierService,
  ) {}

  createTenantMembership(tx: EntityManager, data: object) {
    return this.membershipsRepo.create(
      tx,
      data as Parameters<TenantMembershipsRepository['create']>[1],
    );
  }

  findTenantByCode(tx: EntityManager, code: string) {
    return this.tenantsRepo.findByCode(tx, code);
  }

  async tenantNameExists(tx: EntityManager, name: string): Promise<boolean> {
    // `%`, `_` and `\` are matched literally, not as ILIKE wildcards.
    const exact = { $ilike: name.trim().replace(/[\\%_]/g, '\\$&') };
    const found = await tx.findOne(Tenants, {
      $or: [{ legalName: exact }, { tradeName: exact }],
    });
    return found !== null;
  }

  createTenant(tx: EntityManager, data: object) {
    return this.tenantsRepo.create(
      tx,
      data as Parameters<TenantsRepository['create']>[1],
    );
  }

  createBranch(tx: EntityManager, data: object) {
    return this.branchesRepo.create(
      tx,
      data as Parameters<BranchesRepository['create']>[1],
    );
  }

  registerTaxIdentifier(
    tx: EntityManager,
    input: Parameters<TenantTaxIdentifierService['register']>[1],
  ) {
    return this.taxIdentifiers.register(tx, input);
  }

  assertProfileMatchesType(organization: RegisterOrganizationDetailsDto) {
    this.typeProfile.assertProfileMatchesType(organization);
  }

  declaredConcepts(organization: RegisterOrganizationDetailsDto) {
    return this.typeProfile.declaredConcepts(organization);
  }

  assertConceptsExist(
    tx: EntityManager,
    concepts: Record<string, string | undefined>,
  ) {
    return this.typeProfile.assertConceptsExist(tx, concepts);
  }

  materializeProfile(
    tx: EntityManager,
    tenantId: string,
    organization: RegisterOrganizationDetailsDto,
    actorUserId: string,
  ) {
    return this.typeProfile.materializeProfile(
      tx,
      tenantId,
      organization,
      actorUserId,
    );
  }

  attachRegistrationDocuments(
    tx: EntityManager,
    input: RegistrationDocumentsInput,
  ) {
    return this.affiliationDocuments.attachRegistrationDocuments(tx, {
      ...input,
      documents: input.documents as DirectoryDocumentsInput['documents'],
    });
  }

  attachRegistrationRepresentatives(
    tx: EntityManager,
    input: RegistrationRepresentativesInput,
  ) {
    return this.representatives.attachRegistrationRepresentatives(tx, input);
  }
}
