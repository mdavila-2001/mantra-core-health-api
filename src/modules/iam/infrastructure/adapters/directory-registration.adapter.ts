import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Tenants } from '../../../directory/entities';
import type { OpeningHoursShiftDto } from '../../../../common/dto/opening-hours.dto';
import {
  TenantMembershipsRepository,
  TenantsRepository,
} from '../../../directory/repositories';
import {
  DeclaredBranchesService,
  TenantAffiliationDocumentsService,
  TenantLegalRepresentativesService,
  TenantTypeProfileService,
  type DeclaredBranchesInput,
  type OpeningHoursSite,
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
    private readonly declaredBranches: DeclaredBranchesService,
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

  registerDeclaredBranches(tx: EntityManager, input: DeclaredBranchesInput) {
    return this.declaredBranches.register(tx, input);
  }

  recordOpeningHours(
    tx: EntityManager,
    site: OpeningHoursSite,
    shifts?: readonly OpeningHoursShiftDto[],
  ) {
    this.declaredBranches.recordShifts(tx, site, shifts);
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
