import { OmitType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common';

/**
 * Page and page size of the management listings (same bounds as every
 * listing of the API). The ordering is fixed by each listing, so the generic
 * `sortBy`/`order` are left out.
 */
export class InventoryPageQueryDto extends OmitType(PaginationQueryDto, [
  'sortBy',
  'order',
  'offset',
] as const) {}
