import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { IAM_PDP_ROLE_BINDINGS } from '../authz.global-role-bindings';
import type { IamGlobalRolesPort } from '../ports/iam-global-roles.port';

@Injectable()
export class IamGlobalRolesAdapter implements IamGlobalRolesPort {
  async codesForUser(em: EntityManager, userId: string): Promise<string[]> {
    const rows = await em
      .getConnection()
      .execute<Array<{ role_concept_id: string }>>(
        'select g.role_concept_id from iam.user_global_roles g join iam.users u on u.id=g.user_id where g.user_id=?::uuid and g.state_concept_id=?::uuid and u.status_concept_id=?::uuid',
        [userId, CONCEPTS.STATE_ACTIVE, CONCEPTS.USER_ACTIVE],
        'all',
        em.getTransactionContext(),
      );
    const granted = new Set(rows.map((r) => r.role_concept_id));
    return Object.entries(IAM_PDP_ROLE_BINDINGS)
      .filter(([, id]) => granted.has(id))
      .map(([code]) => code);
  }
}
