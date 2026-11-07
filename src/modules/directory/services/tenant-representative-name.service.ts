import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { composePersonDisplayName } from '../../../common/text/person-name';
import {
  LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
  REPRESENTATIVE_ROLE_CODE,
  type RepresentativeRole,
} from '../legal-representatives';
import type {
  RepresentativeNameResponseDto,
  UpdateRepresentativeNameDto,
} from '../dto/update-representative-name.dto';
import { DirectoryTenantLegalRepository } from '../repositories';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';
import { TenantAdministrationService } from './tenant-administration.service';

/** Trimmed value, or `null` so an emptied optional part is cleared in the DB. */
const clearable = (value: string | undefined): string | undefined =>
  (value?.trim() || null) as string | undefined;

/**
 * Edits the name of the person that represents an organization (legal
 * representative or one of its managers).
 *
 * Until now `directory.tenant_legal_representatives` had a single writer, the
 * sign-up, so a name typed wrong could not be corrected. This updates the
 * linked `profiles.persons` row with the same four parts the sign-up collects
 * and recomposes `display_name`, which is what `GET /tenants/me` reads back.
 */
@Injectable()
export class TenantRepresentativeNameService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly concepts: AffiliationDocumentConceptsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantRepresentativeNameService.name);
  }

  /**
   * @param tenantId - The organization.
   * @param role - Which representative to rename.
   * @param dto - The four name parts.
   * @param actor - Must be OWNER/ADMIN of the tenant, or the platform.
   * @throws ResourceNotFoundException when the organization has no such link.
   */
  async update(
    tenantId: string,
    role: RepresentativeRole,
    dto: UpdateRepresentativeNameDto,
    actor: AuthenticatedUser,
  ): Promise<RepresentativeNameResponseDto> {
    // Only identifiers are logged: the name itself is personal data.
    this.logger.info(
      { operation: 'directory.representative.rename', tenantId, role },
      'Renaming organization representative',
    );
    return this.em.transactional(async (tx) => {
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);

      const resolved = await this.concepts.resolve(tx);
      const roleConceptId = this.concepts.conceptIdOf(
        resolved.representativeRole,
        LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
        REPRESENTATIVE_ROLE_CODE[role],
        'roles de representación',
      );
      const links = (
        await this.legalRepo.listLegalRepsByTenant(tx, tenantId)
      ).filter((l) => l.representativeRoleConceptId === roleConceptId);
      // Same tie-break as the read side: the primary link wins, else the first.
      const link = links.find((l) => l.isPrimary === true) ?? links[0];
      const person = link
        ? (await this.legalRepo.findPersonsByIds(tx, [link.personId])).get(
            link.personId,
          )
        : undefined;
      if (!person) {
        throw new ResourceNotFoundException(
          'La organización no tiene registrado a ese representante',
          { tenantId, role },
        );
      }

      person.name = dto.name.trim();
      person.lastName = dto.lastName.trim();
      person.middleName = clearable(dto.middleName);
      person.motherLastName = clearable(dto.motherLastName);
      person.displayName = composePersonDisplayName({
        name: person.name,
        middleName: person.middleName ?? undefined,
        lastName: person.lastName,
        motherLastName: person.motherLastName ?? undefined,
      });
      touch(person, actor.id);
      await tx.flush();

      return {
        role,
        fullName: person.displayName ?? '',
        name: person.name,
        ...(person.middleName ? { middleName: person.middleName } : {}),
        lastName: person.lastName,
        ...(person.motherLastName
          ? { motherLastName: person.motherLastName }
          : {}),
      };
    });
  }
}
