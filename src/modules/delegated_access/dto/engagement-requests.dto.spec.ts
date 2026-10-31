import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateEngagementRequestDto,
  DecideEngagementRequestDto,
} from './engagement-requests.dto';
import { MoveGrantDto } from './support-lifecycle.dto';

const TENANT = '8f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const PRA = '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';

const check = async <T extends object>(cls: new () => T, plain: object) =>
  validate(plainToInstance(cls, plain), { whitelist: true });

const errorsOf = (errors: Awaited<ReturnType<typeof validate>>): string[] =>
  errors.flatMap((e) => [
    e.property,
    ...(e.children ?? []).flatMap((c) => [
      c.property,
      ...(c.children ?? []).map((g) => g.property),
    ]),
  ]);

describe('DTO de solicitudes de vínculo: átomos y condiciones (pendiente 27)', () => {
  const request = (actions: string[]) => ({
    tenantId: TENANT,
    roleTemplateCode: 'SECRETARY',
    items: [
      {
        targetKind: 'PRACTITIONER',
        practitionerRoleAssignmentId: PRA,
        actions,
      },
    ],
  });

  it('la solicitud acepta átomos (y los 15 alias de siempre)', async () => {
    expect(
      await check(
        CreateEngagementRequestDto,
        request(['agenda.appointment.view', 'agenda.appointment.cancel']),
      ),
    ).toHaveLength(0);
    expect(
      await check(
        CreateEngagementRequestDto,
        request(['schedule.view', 'agenda.appointment.view']),
      ),
    ).toHaveLength(0);
  });

  it('un código que no es átomo ni alias se rechaza', async () => {
    const errors = await check(
      CreateEngagementRequestDto,
      request(['agenda.appointment.inventado']),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('quien decide puede conceder átomos con una condición de objeto; una condición que no es objeto se rechaza', async () => {
    const ok = {
      items: [
        {
          itemId: PRA,
          decision: 'APPROVED',
          actions: ['agenda.appointment.view'],
          condition: { schemaVersion: 1 },
        },
      ],
    };
    expect(await check(DecideEngagementRequestDto, ok)).toHaveLength(0);
    const bad = {
      items: [{ ...ok.items[0], condition: 'siempre' }],
    };
    expect(errorsOf(await check(DecideEngagementRequestDto, bad))).toContain(
      'condition',
    );
  });

  it('el ajuste (adjustment) también admite átomos y condición', async () => {
    const plain = {
      items: [
        {
          itemId: PRA,
          decision: 'ADJUSTED',
          comment: 'solo ver',
          adjustment: {
            targetKind: 'PRACTITIONER',
            practitionerRoleAssignmentId: PRA,
            actions: ['agenda.appointment.view'],
            condition: { schemaVersion: 1 },
          },
        },
      ],
    };
    expect(await check(DecideEngagementRequestDto, plain)).toHaveLength(0);
  });

  it('MoveGrantDto sigue aceptando átomos', async () => {
    expect(
      await check(MoveGrantDto, {
        targetKind: 'ALL_LOCATIONS',
        actions: ['agenda.appointment.view'],
      }),
    ).toHaveLength(0);
  });
});
