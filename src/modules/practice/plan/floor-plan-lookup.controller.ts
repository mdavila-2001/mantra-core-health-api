import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  PlanFocusQueryDto,
  PlanSearchQueryDto,
  StateQueryDto,
} from './floor-plan.dto';
import type { PlanCardResponse } from './floor-plan.types';
import {
  FloorPlansService,
  type PlanFocusEntry,
  type PlanLocation,
  type PlanSearchHit,
} from './floor-plans.service';
import { FloorPlanStateService } from './floor-plan-state.service';

/**
 * Estado superpuesto, tarjeta del paciente y localización por área o zona
 * (CONTRATO-PLANO §3.5–§3.7). Todas son lecturas: la autorización es la misma de
 * la estructura (tenant y sucursal → 404) más los roles operativos.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller()
export class FloorPlanLookupController {
  /**
   * @param plans - Localización, búsqueda y foco.
   * @param state - Estado operativo y tarjeta.
   */
  constructor(
    private readonly plans: FloorPlansService,
    private readonly state: FloorPlanStateService,
  ) {}

  /** Estado operativo por espacio (sin geometría; el cliente lo une por `spaceId`). */
  @Get('floor-plans/:id/state')
  @ApiOperation({
    summary: 'Estado operativo del lienzo (ETag, 304, S7 con asOf)',
  })
  async planState(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StateQueryDto,
    @Req() req: Request,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const result = await this.state.state(
      id,
      query,
      req.headers['if-none-match'],
      actor,
    );
    res.setHeader('ETag', result.etag);
    res.setHeader('Cache-Control', 'private, no-cache');
    if (result.status === 304) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }
    return result.body;
  }

  /**
   * Tarjeta bajo demanda: bloqueos, orden de limpieza y, sólo para Enfermería con
   * alcance y Admisión, el paciente. Nunca se guarda en caché.
   */
  @Get('care-spaces/:id/plan-card')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Tarjeta del espacio con el ocupante (solo roles autorizados)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Sin la clave `patient` para Limpieza, Mantenimiento y los demás roles (ausente ≠ nulo)',
  })
  card(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlanCardResponse> {
    return this.state.card(id, actor);
  }

  /** Dónde está dibujado un espacio (abre el plano desde el árbol, el tablero o el ADT). */
  @Get('care-spaces/:id/plan-location')
  @Header('Cache-Control', 'private, no-cache')
  @ApiOperation({ summary: 'Localizar un espacio en el plano' })
  location(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlanLocation> {
    return this.plans.location(id, actor);
  }

  /** Búsqueda por código o nombre, sin acentos, dentro del alcance del actor. */
  @Get('sites/:siteId/plan-search')
  @Header('Cache-Control', 'private, no-cache')
  @ApiOperation({ summary: 'Buscar espacios para centrarlos en el plano' })
  search(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: PlanSearchQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlanSearchHit[]> {
    return this.plans.search(siteId, query.q, query.limit ?? 10, actor);
  }

  /** Foco por área o zona: una entrada por lienzo (una unidad que cruza pisos devuelve varias). */
  @Get('sites/:siteId/plan-focus')
  @Header('Cache-Control', 'private, no-cache')
  @ApiOperation({
    summary: 'Lienzos donde está dibujado un espacio o una unidad',
  })
  @ApiResponse({ status: 422, description: 'PLAN_FOCUS_PARAM_INVALID' })
  focus(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: PlanFocusQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlanFocusEntry[]> {
    return this.plans.focus(siteId, query.spaceId, query.unitId, actor);
  }
}
