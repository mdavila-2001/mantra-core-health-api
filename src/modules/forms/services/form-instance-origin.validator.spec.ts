import { jest } from '@jest/globals';
import { FormInstanceOriginValidator } from './form-instance-origin.validator';
import { FORMS } from '../forms.concepts';
import { PreconditionFailedException } from '../../../common';
import { FormInstances } from '../entities';

/**
 * P43 · la instancia de formulario de la que dice salir un registro: existe,
 * está cerrada y es del mismo encuentro. Cada rechazo es 422
 * `PRECONDITION_FAILED` con el motivo en `details.reason`.
 */
const FORM = 'form-1';
const ENCOUNTER = 'enc-1';

function emWith(instance: Partial<FormInstances> | null) {
  const findOne = (jest.fn as any)().mockResolvedValue(instance);
  return { em: { findOne } as any, findOne };
}

async function reason(p: Promise<void>): Promise<unknown> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(PreconditionFailedException);
    const ex = e as PreconditionFailedException;
    expect(ex.getStatus()).toBe(422);
    expect(ex.code).toBe('PRECONDITION_FAILED');
    return (ex.getResponse() as { details: { reason: string } }).details.reason;
  }
  throw new Error('no lanzó');
}

describe('FormInstanceOriginValidator (P43)', () => {
  const validator = new FormInstanceOriginValidator();

  it('busca la instancia por id en la transacción del llamador', async () => {
    const { em, findOne } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_CLOSED,
      resourceId: ENCOUNTER,
    });
    await validator.assertUsableOrigin(em, FORM, ENCOUNTER);
    expect(findOne).toHaveBeenCalledWith(FormInstances, { id: FORM });
  });

  it('inexistente → 422 NOT_FOUND', async () => {
    const { em } = emWith(null);
    expect(
      await reason(validator.assertUsableOrigin(em, FORM, ENCOUNTER)),
    ).toBe('NOT_FOUND');
  });

  it('abierta (no cerrada) → 422 NOT_CLOSED', async () => {
    const { em } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_OPEN,
      resourceId: ENCOUNTER,
    });
    expect(
      await reason(validator.assertUsableOrigin(em, FORM, ENCOUNTER)),
    ).toBe('NOT_CLOSED');
  });

  it('de otro encuentro → 422 ENCOUNTER_MISMATCH', async () => {
    const { em } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_CLOSED,
      resourceId: 'otro-encuentro',
    });
    expect(
      await reason(validator.assertUsableOrigin(em, FORM, ENCOUNTER)),
    ).toBe('ENCOUNTER_MISMATCH');
  });

  it('cerrada y del mismo encuentro → pasa', async () => {
    const { em } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_CLOSED,
      resourceId: ENCOUNTER,
    });
    await expect(
      validator.assertUsableOrigin(em, FORM, ENCOUNTER),
    ).resolves.toBeUndefined();
  });

  it('sin encounterId en el registro sólo exige existir y estar cerrada', async () => {
    const { em } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_CLOSED,
      resourceId: 'cualquier-recurso',
    });
    await expect(
      validator.assertUsableOrigin(em, FORM, undefined),
    ).resolves.toBeUndefined();
    await expect(
      validator.assertUsableOrigin(em, FORM, null),
    ).resolves.toBeUndefined();
  });

  it('sin encounterId, una instancia abierta sigue siendo 422 NOT_CLOSED', async () => {
    const { em } = emWith({
      id: FORM,
      stateConceptId: FORMS.INSTANCE_OPEN,
      resourceId: 'cualquier-recurso',
    });
    expect(await reason(validator.assertUsableOrigin(em, FORM))).toBe(
      'NOT_CLOSED',
    );
  });
});
