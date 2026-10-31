import { jest } from '@jest/globals';
import { runWithTenant, CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { PatientRestrictionFlagsService } from './patient-restriction-flags.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
const PEREZ = {
  id: 'dr-perez',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-perez',
} as any;
const PATIENT = 'pat-1';

const flagRow = (
  flagConceptId: string,
  over: Record<string, unknown> = {},
): any => ({
  id: `f-${flagConceptId}`,
  tenantId: TENANT,
  patientProfileId: PATIENT,
  flagConceptId,
  reasonText: 'Persona pública: no mostrar a terceros',
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  validFrom: new Date('2026-10-01T00:00:00Z'),
  ...over,
});

function build(
  opts: {
    active?: any[];
    patientExists?: boolean;
    careTeam?: boolean;
    /** SEG A-M6: ¿el paciente tiene relación con la organización? Por defecto sí. */
    linkedToTenant?: boolean;
    /** B-B9: ¿quien llama es el doctor titular del paciente en esta organización? */
    holder?: boolean;
    /** B-B9: ¿el paso extra está fresco? Por defecto sí. */
    stepUpFresh?: boolean;
  } = {},
) {
  const active = opts.active ?? [];
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn(async (sql: string) => {
      if (sql.includes('patient_tenant_link'))
        return opts.linkedToTenant === false ? [] : [{ ok: 1 }];
      if (
        sql.includes('patient_profiles') &&
        !sql.includes('care_relationships')
      )
        return opts.patientExists === false ? [] : [{ ok: 1 }];
      // B-B9: solo el doctor TITULAR (médico principal vigente con rol en la organización) retira banderas.
      if (
        sql.includes('patient_primary_practitioners') &&
        !sql.includes('care_relationships')
      )
        return opts.holder ? [{ ok: 1 }] : [];
      return opts.careTeam ? [{ ok: 1 }] : [];
    }),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const repo = {
    findActive: mockFn(
      async (_e: any, _t: string, _p: string, concept: string) =>
        active.find(
          (r) =>
            r.flagConceptId === concept &&
            r.statusConceptId === CONCEPTS.STATE_ACTIVE,
        ) ?? null,
    ),
    create: mockFn((_e: any, data: any) => {
      const row = flagRow(data.flagConceptId, {
        id: `new-${data.flagConceptId}`,
        reasonText: data.reasonText,
        validFrom: data.validFrom,
        validTo: data.validTo,
      });
      active.push(row);
      return row;
    }),
    revoke: mockFn((row: any, _actor: any, now: Date) => {
      row.statusConceptId = CONCEPTS.STATE_REVOKED;
      row.validTo = now;
    }),
  };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn() };
  const stepUp = {
    assertFresh: mockFn(async () => {
      if (opts.stepUpFresh === false)
        throw Object.assign(new Error('STEP_UP_REQUIRED'), {
          reason: 'STEP_UP_REQUIRED',
        });
    }),
  };
  const decisionLog = { appendNow: mockFn().mockResolvedValue('log-1') };
  jest.useFakeTimers({ now: NOW });
  const service = new PatientRestrictionFlagsService(
    em,
    repo as any,
    scope as any,
    stepUp as any,
    decisionLog as any,
    logger as any,
  );
  return { service, repo, tx, active, stepUp, decisionLog };
}
afterEach(() => jest.useRealTimers());
const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as any;
  }
  return undefined;
};

describe('PatientRestrictionFlagsService', () => {
  it('get: devuelve las banderas vigentes del paciente', async () => {
    const d = build({ active: [flagRow(DELEG.PATIENT_FLAG_VIP)] });
    const out = await run(() => d.service.get(PATIENT, ADMIN));
    expect(out).toMatchObject({
      patientProfileId: PATIENT,
      flags: [{ flag: 'VIP' }],
    });
  });

  it('put: crea las que faltan y quita las que ya no vienen (reemplaza el conjunto)', async () => {
    const d = build({ active: [flagRow(DELEG.PATIENT_FLAG_VIP)] });
    const out = await run(() =>
      d.service.put(
        PATIENT,
        {
          flags: [
            { flag: 'CONFIDENTIAL', reason: 'Pidió reserva por escrito' },
          ],
          removalReason: 'Ya no es persona pública',
        } as any,
        ADMIN,
      ),
    );
    expect(d.repo.revoke).toHaveBeenCalledTimes(1);
    expect(d.repo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        patientProfileId: PATIENT,
        flagConceptId: DELEG.PATIENT_FLAG_CONFIDENTIAL,
        reasonText: 'Pidió reserva por escrito',
        validFrom: NOW,
        actorUserId: 'admin',
      }),
    );
    expect(out.flags.map((f) => f.flag)).toEqual(['CONFIDENTIAL']);
  });

  it('put con la misma bandera, motivo y fin no cambia nada', async () => {
    const d = build({ active: [flagRow(DELEG.PATIENT_FLAG_VIP)] });
    await run(() =>
      d.service.put(
        PATIENT,
        {
          flags: [
            { flag: 'VIP', reason: 'Persona pública: no mostrar a terceros' },
          ],
        } as any,
        ADMIN,
      ),
    );
    expect(d.repo.revoke).not.toHaveBeenCalled();
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('put con otro motivo: retira la fila vigente y crea la nueva (la bandera sigue)', async () => {
    const d = build({ active: [flagRow(DELEG.PATIENT_FLAG_VIP)] });
    await run(() =>
      d.service.put(
        PATIENT,
        {
          flags: [{ flag: 'VIP', reason: 'Nuevo motivo más detallado' }],
        } as any,
        ADMIN,
      ),
    );
    expect(d.repo.revoke).toHaveBeenCalledTimes(1);
    expect(d.repo.create).toHaveBeenCalledTimes(1);
    expect(d.tx.flush).toHaveBeenCalledTimes(2);
  });

  it('put con conjunto vacío quita todas', async () => {
    const d = build({
      active: [
        flagRow(DELEG.PATIENT_FLAG_VIP),
        flagRow(DELEG.PATIENT_FLAG_PROTECTED),
      ],
    });
    const out = await run(() =>
      d.service.put(
        PATIENT,
        { flags: [], removalReason: 'Se levanta toda restricción' } as any,
        ADMIN,
      ),
    );
    expect(d.repo.revoke).toHaveBeenCalledTimes(2);
    expect(out.flags).toEqual([]);
  });

  it('banderas repetidas o motivo corto: 422 RESTRICTION_FLAG_INVALID', async () => {
    const d = build();
    const dup = await failure(
      run(() =>
        d.service.put(
          PATIENT,
          {
            flags: [
              { flag: 'VIP', reason: 'x'.repeat(12) },
              { flag: 'VIP', reason: 'y'.repeat(12) },
            ],
          } as any,
          ADMIN,
        ),
      ),
    );
    expect(dup.reason).toBe('RESTRICTION_FLAG_INVALID');
    const short = await failure(
      run(() =>
        d.service.put(
          PATIENT,
          { flags: [{ flag: 'VIP', reason: 'corto' }] } as any,
          ADMIN,
        ),
      ),
    );
    expect(short.reason).toBe('RESTRICTION_FLAG_INVALID');
    const past = await failure(
      run(() =>
        d.service.put(
          PATIENT,
          {
            flags: [
              {
                flag: 'VIP',
                reason: 'x'.repeat(12),
                validTo: '2026-01-01T00:00:00Z',
              },
            ],
          } as any,
          ADMIN,
        ),
      ),
    );
    expect(past.reason).toBe('RESTRICTION_FLAG_INVALID');
  });

  it('paciente inexistente: 404 uniforme', async () => {
    const d = build({ patientExists: false });
    const err = await failure(run(() => d.service.get(PATIENT, ADMIN)));
    expect(err.getStatus()).toBe(404);
  });

  it('un doctor solo toca a los pacientes de su equipo: si no, 404 uniforme', async () => {
    const out = build({ careTeam: false });
    const err = await failure(run(() => out.service.get(PATIENT, PEREZ)));
    expect(err.getStatus()).toBe(404);
    const mine = build({
      careTeam: true,
      active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
    });
    const ok = await run(() => mine.service.get(PATIENT, PEREZ));
    expect(ok.flags).toHaveLength(1);
  });

  it('un doctor sin perfil profesional en el token no pasa', async () => {
    const d = build({ careTeam: true });
    const err = await failure(
      run(() =>
        d.service.get(PATIENT, { id: 'x', roles: ['PRACTITIONER'] } as any),
      ),
    );
    expect(err.getStatus()).toBe(404);
  });

  describe('B-B9: retirar o aflojar una bandera exige titular o SECURITY_ADMIN, paso extra y motivo', () => {
    const REASON = 'La paciente dejó de ser persona pública';

    it('un doctor del equipo que NO es el titular no puede retirar una bandera: 403 y no se toca nada', async () => {
      const d = build({
        careTeam: true,
        holder: false,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      const err = await failure(
        run(() =>
          d.service.put(
            PATIENT,
            { flags: [], removalReason: REASON } as any,
            PEREZ,
          ),
        ),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.getResponse().reason).toBe(
        'RESTRICTION_FLAG_REMOVAL_FORBIDDEN',
      );
      expect(d.repo.revoke).not.toHaveBeenCalled();
      expect(d.stepUp.assertFresh).not.toHaveBeenCalled();
    });

    it('retirar sin motivo: 422 y no se toca nada (ni se pide el paso extra antes de saber qué se quiere hacer)', async () => {
      const d = build({
        careTeam: true,
        holder: true,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      const err = await failure(
        run(() => d.service.put(PATIENT, { flags: [] } as any, PEREZ)),
      );
      expect(err.getResponse().reason).toBe('RESTRICTION_FLAG_INVALID');
      expect(d.repo.revoke).not.toHaveBeenCalled();
    });

    it('retirar con motivo pero sin paso extra fresco: se rechaza y no se toca nada', async () => {
      const d = build({
        careTeam: true,
        holder: true,
        stepUpFresh: false,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      const err = await failure(
        run(() =>
          d.service.put(
            PATIENT,
            { flags: [], removalReason: REASON } as any,
            PEREZ,
          ),
        ),
      );
      expect(err.reason).toBe('STEP_UP_REQUIRED');
      expect(d.repo.revoke).not.toHaveBeenCalled();
    });

    it('el doctor titular con motivo y paso extra fresco retira; el asiento guarda código, longitud y huella del motivo, nunca el texto', async () => {
      const d = build({
        careTeam: true,
        holder: true,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      const out = await run(() =>
        d.service.put(
          PATIENT,
          { flags: [], removalReason: REASON } as any,
          PEREZ,
        ),
      );
      expect(out.flags).toEqual([]);
      expect(d.repo.revoke).toHaveBeenCalledTimes(1);
      expect(d.stepUp.assertFresh).toHaveBeenCalledTimes(1);
      const entry = d.decisionLog.appendNow.mock.calls[0][1];
      expect(entry.detail).toMatchObject({
        flags: ['VIP'],
        reasonLength: REASON.length,
        reasonSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(JSON.stringify(entry)).not.toContain(REASON);
      expect(entry.patientProfileId).toBe(PATIENT);
    });

    it('SECURITY_ADMIN con relación con la organización también puede, con motivo y paso extra', async () => {
      const d = build({ active: [flagRow(DELEG.PATIENT_FLAG_VIP)] });
      await run(() =>
        d.service.put(
          PATIENT,
          { flags: [], removalReason: REASON } as any,
          ADMIN,
        ),
      );
      expect(d.repo.revoke).toHaveBeenCalledTimes(1);
      expect(d.stepUp.assertFresh).toHaveBeenCalledTimes(1);
    });

    it('acortar el fin de una restricción (aflojarla) cuenta como retirarla; alargarla o endurecerla no', async () => {
      const aflojar = build({
        careTeam: true,
        holder: false,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      const err = await failure(
        run(() =>
          aflojar.service.put(
            PATIENT,
            {
              flags: [
                {
                  flag: 'VIP',
                  reason: 'Persona pública: no mostrar a terceros',
                  validTo: '2026-11-04T00:00:00Z',
                },
              ],
            } as any,
            PEREZ,
          ),
        ),
      );
      expect(err.getStatus()).toBe(403);
      const endurecer = build({
        careTeam: true,
        holder: false,
        active: [flagRow(DELEG.PATIENT_FLAG_VIP)],
      });
      await run(() =>
        endurecer.service.put(
          PATIENT,
          {
            flags: [
              {
                flag: 'VIP',
                reason: 'Persona pública: no mostrar a terceros',
              },
              { flag: 'PROTECTED', reason: 'Protección adicional pedida' },
            ],
          } as any,
          PEREZ,
        ),
      );
      expect(endurecer.stepUp.assertFresh).not.toHaveBeenCalled();
      expect(endurecer.repo.create).toHaveBeenCalledTimes(1);
    });

    it('poner banderas nuevas no pide paso extra ni motivo de retiro (un doctor del equipo basta)', async () => {
      const d = build({ careTeam: true, holder: false });
      await run(() =>
        d.service.put(
          PATIENT,
          {
            flags: [{ flag: 'VIP', reason: 'Persona pública conocida' }],
          } as any,
          PEREZ,
        ),
      );
      expect(d.repo.create).toHaveBeenCalledTimes(1);
      expect(d.stepUp.assertFresh).not.toHaveBeenCalled();
    });
  });

  describe('SEG A-M6: sin oráculo de existencia para la administración de otra organización', () => {
    it('un SECURITY_ADMIN de otra organización responde igual (404) con un paciente real ajeno que con uno inexistente', async () => {
      const ajeno = build({ patientExists: true, linkedToTenant: false });
      const inexistente = build({
        patientExists: false,
        linkedToTenant: false,
      });
      const a = await failure(run(() => ajeno.service.get(PATIENT, ADMIN)));
      const b = await failure(
        run(() => inexistente.service.get(PATIENT, ADMIN)),
      );
      expect(a.getStatus()).toBe(404);
      expect(b.getStatus()).toBe(404);
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('tampoco puede fijar banderas a un paciente ajeno', async () => {
      const d = build({ linkedToTenant: false });
      const err = await failure(
        run(() =>
          d.service.put(
            PATIENT,
            {
              flags: [{ flag: 'VIP', reason: 'Persona pública conocida' }],
            } as any,
            ADMIN,
          ),
        ),
      );
      expect(err.getStatus()).toBe(404);
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('con relación con la organización el administrador sigue pudiendo', async () => {
      const d = build({ linkedToTenant: true });
      await expect(
        run(() => d.service.get(PATIENT, ADMIN)),
      ).resolves.toMatchObject({ patientProfileId: PATIENT });
    });
  });
});
