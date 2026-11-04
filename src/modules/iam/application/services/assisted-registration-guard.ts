import type { EntityManager } from '@mikro-orm/postgresql';
import type { PinoLogger } from 'nestjs-pino';
import { ConflictException } from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import type { CredentialsRepository } from '../../infrastructure/repositories';
import type { AssistedRegistrationDto } from '../../presentation/dto';
import type { ProfileRegistrationPort } from '../ports/profile-registration.port';

/**
 * C-18 duplicate guards, run inside the registration transaction:
 * - the email already has a live credential → 409, invite instead (#1000: the
 *   email lock queues two simultaneous registrations of the same mailbox);
 * - a live patient already has this name → 409 `POSSIBLE_DUPLICATE_PATIENT`,
 *   unless the operator confirmed a homonym with `allowHomonym`.
 */
export async function assertAssistedRegistrationIsNew(
  tx: EntityManager,
  deps: {
    readonly credentialsRepo: CredentialsRepository;
    readonly profiles: ProfileRegistrationPort;
    readonly logger: PinoLogger;
  },
  dto: AssistedRegistrationDto,
  displayName: string,
): Promise<void> {
  await deps.credentialsRepo.lockEmailForRegistration(tx, dto.email);
  const existing = await deps.credentialsRepo.findLivePasswordByEmail(
    tx,
    dto.email,
  );
  if (existing) {
    deps.logger.warn(
      {
        operation: 'iam.user.assisted-registration',
        reason: 'identifier-in-use',
      },
      'Rejected assisted registration: identifier already exists (prefer invitation)',
    );
    throw new ConflictException(
      'Ya existe una cuenta con ese identificador; prefiera invitar en lugar de crear un duplicado',
      { email: dto.email, suggestion: 'invitation' },
      IamErrorReason.IDENTIFIER_ALREADY_REGISTERED_PREFER_INVITATION,
    );
  }
  await deps.profiles.assertNoHomonymPatient(tx, {
    displayName,
    allowHomonym: dto.allowHomonym,
  });
}
