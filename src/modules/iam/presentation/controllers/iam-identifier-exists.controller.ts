import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../../common';
import { IdentifierExistsUseCase } from '../../application/use-cases/identifier-exists.use-case';
import {
  IdentifierExistsQueryDto,
  IdentifierExistsResponseDto,
} from '../dto/identifier-exists.dto';

/**
 * Public pre-registration hint under `/iam/auth`. It is an account-enumeration
 * surface, so it answers only `{ exists }` and carries the same strict per-IP
 * limit as `login`; the register endpoints still answer 409 on a duplicate.
 */
@ApiTags('iam-auth')
@Controller('iam/auth')
export class IamIdentifierExistsController {
  constructor(private readonly identifierExists: IdentifierExistsUseCase) {}

  @Get('identifier-exists')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Whether a national id, email or organization name has an account',
  })
  @ApiOkResponse({ type: IdentifierExistsResponseDto })
  check(
    @Query() query: IdentifierExistsQueryDto,
  ): Promise<IdentifierExistsResponseDto> {
    return this.identifierExists.execute(query.kind, query.value);
  }
}
