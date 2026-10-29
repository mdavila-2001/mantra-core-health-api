import { HttpStatus } from '@nestjs/common';
import { FloorPlanReason } from './floor-plan.error-reasons';
import {
  planDbException,
  readPlanDbViolation,
  translatePlanDbError,
} from './plan-constraint-reasons';

const CHILD = '11111111-1111-4111-8111-111111111111';
const PARENT = '22222222-2222-4222-8222-222222222222';

const pgError = (
  code: string,
  message: string,
  constraint?: string,
): Error & { code: string; constraint?: string } =>
  Object.assign(new Error(message), { code, constraint });

describe('readPlanDbViolation', () => {
  it('lee el SQLSTATE aunque el ORM lo envuelva', () => {
    const inner = pgError('23P01', 'x', 'ex_space_placements_no_overlap');
    const wrapped = Object.assign(new Error('wrapped'), { cause: inner });
    expect(readPlanDbViolation(wrapped)).toMatchObject({
      sqlstate: '23P01',
      constraint: 'ex_space_placements_no_overlap',
    });
    expect(
      readPlanDbViolation(Object.assign(new Error('w'), { driverError: inner })),
    ).toMatchObject({ sqlstate: '23P01' });
  });

  it('un error cualquiera no es una violación', () => {
    expect(readPlanDbViolation(new Error('boom'))).toBeNull();
    expect(readPlanDbViolation(null)).toBeNull();
  });
});

describe('translatePlanDbError', () => {
  it('23P01 del solape de hermanos → PLAN_SIBLING_OVERLAP 422', () => {
    expect(
      translatePlanDbError(
        pgError('23P01', 'conflicting key', 'ex_space_placements_no_overlap'),
      ),
    ).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      reason: FloorPlanReason.PLAN_SIBLING_OVERLAP,
    });
  });

  it('reconoce la restricción por el texto si el driver no trae el nombre', () => {
    expect(
      translatePlanDbError(
        pgError(
          '23P01',
          'conflicting key value violates exclusion constraint "ex_space_placements_no_overlap"',
        ),
      )?.reason,
    ).toBe(FloorPlanReason.PLAN_SIBLING_OVERLAP);
  });

  it.each([
    ['ux_space_placements_care_space', FloorPlanReason.PLAN_SPACE_ALREADY_PLACED],
    ['ux_floor_plans_anchor_current', FloorPlanReason.PLAN_ANCHOR_TAKEN],
    ['ux_floor_plans_site_campus_current', FloorPlanReason.PLAN_CAMPUS_EXISTS],
    ['ux_floor_plans_site_code', FloorPlanReason.PLAN_CODE_TAKEN],
  ])('23505 %s → 409 %s', (constraint, reason) => {
    expect(
      translatePlanDbError(pgError('23505', 'dup', constraint)),
    ).toMatchObject({ status: HttpStatus.CONFLICT, reason });
  });

  it('23503 de una FK compuesta por tenant (incluido el fondo) → 404 sin revelar nada', () => {
    const result = translatePlanDbError(
      pgError('23503', 'insert violates', 'fk_floor_plans_tenant_background'),
    );
    expect(result?.status).toBe(HttpStatus.NOT_FOUND);
    expect(JSON.stringify(result)).not.toContain('background');
  });

  it('mensajes PLAN_* de los triggers, con el sujeto sacado del texto', () => {
    expect(
      translatePlanDbError(
        pgError(
          '23514',
          `PLAN_CHILD_OUTSIDE_PARENT: el espacio ${CHILD} no cabe dentro de su padre ${PARENT}`,
        ),
      ),
    ).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      reason: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
      subjectId: CHILD,
    });
    expect(
      translatePlanDbError(
        pgError(
          '23514',
          `PLAN_PARENT_NOT_PLACED: el padre ${PARENT} del espacio ${CHILD} no está ubicado`,
        ),
      ),
    ).toMatchObject({ subjectId: CHILD });
    expect(
      translatePlanDbError(
        pgError(
          '23001',
          `PLAN_HAS_PLACED_CHILDREN: el espacio ${PARENT} tiene hijos ubicados`,
        ),
      ),
    ).toMatchObject({
      status: HttpStatus.CONFLICT,
      reason: FloorPlanReason.PLAN_HAS_PLACED_CHILDREN,
      subjectId: PARENT,
    });
    expect(
      translatePlanDbError(
        pgError('23514', 'PLAN_BOUNDS_EXCLUDE_CONTENT: el lienzo achicado'),
      ),
    ).toMatchObject({ status: HttpStatus.CONFLICT });
    expect(
      translatePlanDbError(pgError('23514', 'PLAN_ANCHOR_IMMUTABLE: la sede')),
    ).toMatchObject({ status: HttpStatus.UNPROCESSABLE_ENTITY });
  });

  it('CHECK de las tablas del plano → reasons genéricos 422', () => {
    expect(
      translatePlanDbError(
        pgError('23514', 'violates check', 'ck_space_placements_rect_size'),
      )?.reason,
    ).toBe(FloorPlanReason.PLAN_GEOMETRY_INVALID);
    expect(
      translatePlanDbError(
        pgError('23514', 'violates check', 'ck_plan_elements_dimensions'),
      )?.reason,
    ).toBe(FloorPlanReason.PLAN_ELEMENT_INVALID);
    expect(
      translatePlanDbError(pgError('23514', 'violates', 'ck_floor_plans_size'))
        ?.reason,
    ).toBe(FloorPlanReason.PLAN_CANVAS_INVALID);
  });

  it('lo que no es del plano no se traduce', () => {
    expect(
      translatePlanDbError(pgError('23505', 'dup', 'ux_otra_cosa')),
    ).toBeNull();
    expect(translatePlanDbError(pgError('40001', 'serialization'))).toBeNull();
  });
});

describe('planDbException', () => {
  it('un rechazo de dibujo sale como PLAN_LAYOUT_INVALID con el error por elemento, sin el texto del servidor', () => {
    const translation = translatePlanDbError(
      pgError(
        '23514',
        `PLAN_CHILD_OUTSIDE_PARENT: el espacio ${CHILD} no cabe dentro de su padre ${PARENT}`,
      ),
    );
    const exception = planDbException(translation!, 'plan-1', 'req-9');
    expect(exception.getStatus()).toBe(422);
    expect(exception.reason).toBe(FloorPlanReason.PLAN_LAYOUT_INVALID);
    expect(exception.details).toMatchObject({
      requestId: 'req-9',
      errors: [
        {
          kind: 'SPACE',
          id: CHILD,
          code: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
        },
      ],
    });
    expect(JSON.stringify(exception.details)).not.toContain(PARENT);
  });

  it('el 404 por tenant no lleva ids', () => {
    const exception = planDbException(
      translatePlanDbError(pgError('23503', 'x', 'fk_plan_elements_tenant_host'))!,
      'plan-1',
    );
    expect(exception.getStatus()).toBe(404);
    expect(exception.details).toBeUndefined();
  });

  it('un conflicto de unicidad sale 409 con su reason', () => {
    const exception = planDbException(
      translatePlanDbError(pgError('23505', 'x', 'ux_floor_plans_site_code'))!,
      'plan-1',
    );
    expect(exception.getStatus()).toBe(409);
    expect(exception.reason).toBe(FloorPlanReason.PLAN_CODE_TAKEN);
  });
});
