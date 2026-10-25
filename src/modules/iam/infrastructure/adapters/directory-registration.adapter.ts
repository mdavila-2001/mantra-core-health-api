import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  BranchesRepository,
  TenantMembershipsRepository,
  TenantsRepository,
} from '../../../directory/repositories';
import {
  TenantAffiliationDocumentsService,
  TenantLegalRepresentativesService,
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
