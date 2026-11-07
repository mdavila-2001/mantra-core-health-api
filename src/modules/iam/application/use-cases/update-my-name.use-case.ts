import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { composePersonDisplayName } from '../../../../common/text/person-name';
import { UsersRepository } from '../../infrastructure/repositories';
import type {
  MyNameResponseDto,
  UpdateMyNameDto,
} from '../../presentation/dto/update-my-name.dto';

/**
 * Corrects the name of the signed-in account (`iam.users.display_name`). Only the caller's own
 * account: the id comes from the session, never from the request, so nobody renames anybody else.
 * A professional's or a patient's name is tied to their verified person record, so it is edited
 * there ("Mi perfil"), not here: this route is for organization accounts. An account that is not
 * active cannot be renamed. The name is personal data and is never logged. The session token carries it as `name`, so the
 * new one shows up when the client renews its token.
 */
@Injectable()
export class UpdateMyNameUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    dto: UpdateMyNameDto,
  ): Promise<MyNameResponseDto> {
    if (
      actor.practitionerProfileId !== undefined ||
      actor.patientProfileId !== undefined
    ) {
      throw new ForbiddenException(
        'Su nombre sale de su perfil verificado: corríjalo en «Mi perfil»',
      );
    }
    const displayName = composePersonDisplayName({
      name: dto.name,
      middleName: dto.middleName,
      lastName: dto.lastName,
      motherLastName: dto.motherLastName,
    });
    if (displayName === undefined) {
      throw new ResourceNotFoundException('Cuenta no encontrada', {
        userId: actor.id,
      });
    }
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, actor.id);
      if (!user)
        throw new ResourceNotFoundException('Cuenta no encontrada', {
          userId: actor.id,
        });
      if (user.statusConceptId !== CONCEPTS.USER_ACTIVE) {
        throw new ForbiddenException('La cuenta no está activa');
      }
      user.displayName = displayName;
      touch(user, actor.id);
      await tx.flush();
      return { displayName };
    });
  }
}
