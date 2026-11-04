import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CredentialsRepository } from '../../infrastructure/repositories';
import {
  DIRECTORY_REGISTRATION_PORT,
  type DirectoryRegistrationPort,
} from '../ports/directory-registration.port';
import { enterAuthBoundaryContext } from '../services/auth-boundary-context';
import type {
  IdentifierExistsResponseDto,
  IdentifierKind,
} from '../../presentation/dto/identifier-exists.dto';

/**
 * Pre-registration check: does an account already use this national id, email
 * or organization name? It applies the same lookups the register flows use to
 * reject a duplicate, so the hint and the later 409 never disagree:
 * - NATIONAL_ID: live password credential with that exact subject (patient /
 *   support-staff registration).
 * - EMAIL: live password credential, case-insensitive (organization and
 *   practitioner registration).
 * - ORG_NAME: a tenant whose legal or trade name matches, case-insensitive.
 *
 * Deliberately logs nothing: the value is personal data and the answer is the
 * enumeration signal itself. Rate limiting lives on the route.
 */
@Injectable()
export class IdentifierExistsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly credentialsRepo: CredentialsRepository,
    @Inject(DIRECTORY_REGISTRATION_PORT)
    private readonly directory: DirectoryRegistrationPort,
  ) {}

  async execute(
    kind: IdentifierKind,
    rawValue: string,
  ): Promise<IdentifierExistsResponseDto> {
    const value = rawValue.trim();
    if (value === '') return { exists: false };
    const exists = await this.em.fork().transactional(async (tx) => {
      // No tenant is selected before login: same RLS escape as registration.
      await enterAuthBoundaryContext(tx);
      if (kind === 'NATIONAL_ID') {
        return !!(await this.credentialsRepo.findLivePasswordBySubject(
          tx,
          value,
        ));
      }
      if (kind === 'EMAIL') {
        return !!(await this.credentialsRepo.findLivePasswordByEmail(
          tx,
          value,
        ));
      }
      return this.directory.tenantNameExists(tx, value);
    });
    return { exists };
  }
}
