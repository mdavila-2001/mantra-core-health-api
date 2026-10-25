import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { PERFORMER_SELECTION_CONCEPTS } from '../performer-selection';
import { CLIN } from '../clinical.concepts';
import {
  PerformerSelectionValidator,
  type PerformerSelectionInput,
} from './performer-selection.validator';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const em = {} as any;
const PROCEDURE = 'proc-endoscopia';
const DOCTOR = 'doc-1';
const SITE = 'site-1';

/**
 * Construye el validador con un lector de sedes controlado.
 *
 * @param offered - Si la sede ofrece el procedimiento con precio.
 * @param affiliated - Si el médico está afiliado y activo en la sede.
 * @returns El validador y el lector.
 */
function build(offered = true, affiliated = true) {
  const sites = {
    offersProcedureWithPrice: mockFn().mockResolvedValue(offered),
    isActivelyAffiliated: mockFn().mockResolvedValue(affiliated),
  };
  return { validator: new PerformerSelectionValidator(sites as any), sites };
}

/**
 * Entrada base de una orden de procedimiento.
 *
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns La entrada.
 */
function input(
  overrides: Partial<PerformerSelectionInput> = {},
): PerformerSelectionInput {
  return {
    procedureConceptId: PROCEDURE,
    requesterProfileId: DOCTOR,
    ...overrides,
  };
}

/**
 * Extrae el motivo de rechazo de una promesa que debe fallar con 422.
 *
 * @param promise - Llamada a validar.
 * @returns El `reason` de la excepción.
 */
async function reasonOf(
  promise: Promise<unknown>,
): Promise<string | undefined> {
  const failure = await promise.catch((e: unknown) => e);
  expect(failure).toBeInstanceOf(PreconditionFailedException);
  return (failure as PreconditionFailedException).reason;
}

describe('PerformerSelectionValidator', () => {
  it('sin modo, la orden queda en PATIENT_CHOICE sin médico ni sede', async () => {
    const { validator, sites } = build();

    await expect(validator.resolve(em, input())).resolves.toEqual({
      performerSelectionConceptId:
        CLIN.SERVICE_REQUEST_PERFORMER_PATIENT_CHOICE,
      performerPractitionerProfileId: null,
      suggestedPracticeSiteId: null,
    });
    expect(sites.offersProcedureWithPrice).not.toHaveBeenCalled();
  });

  it('un concepto fuera del conjunto da 422', async () => {
    const { validator } = build();

    expect(
      await reasonOf(
        validator.resolve(
          em,
          input({
            performerSelectionConceptId:
              CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
          }),
        ),
      ),
    ).toBe(ClinicalErrorReason.PERFORMER_SELECTION_INVALID);
  });

  describe('PATIENT_CHOICE', () => {
    const mode = PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE;

    it.each([
      ['con sede', { suggestedPracticeSiteId: SITE }],
      ['con médico', { performerPractitionerProfileId: DOCTOR }],
    ])('%s da 422', async (_name, extra) => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({ performerSelectionConceptId: mode, ...extra }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_FIELD_NOT_ALLOWED);
    });
  });

  describe('ORGANIZATION', () => {
    const mode = PERFORMER_SELECTION_CONCEPTS.ORGANIZATION;

    it('sin sede da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(em, input({ performerSelectionConceptId: mode })),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_FIELD_REQUIRED);
    });

    it('con médico ejecutor da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({
              performerSelectionConceptId: mode,
              suggestedPracticeSiteId: SITE,
              performerPractitionerProfileId: DOCTOR,
            }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_FIELD_NOT_ALLOWED);
    });

    it('en una sede sin el procedimiento con precio (o inactivo) da 422', async () => {
      const { validator } = build(false);

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({
              performerSelectionConceptId: mode,
              suggestedPracticeSiteId: SITE,
            }),
          ),
        ),
      ).toBe(ClinicalErrorReason.SUGGESTED_SITE_DOES_NOT_OFFER_PROCEDURE);
    });

    it('en una sede que lo ofrece con precio es válido y no consulta afiliaciones', async () => {
      const { validator, sites } = build();

      await expect(
        validator.resolve(
          em,
          input({
            performerSelectionConceptId: mode,
            suggestedPracticeSiteId: SITE,
          }),
        ),
      ).resolves.toEqual({
        performerSelectionConceptId: mode,
        performerPractitionerProfileId: null,
        suggestedPracticeSiteId: SITE,
      });
      expect(sites.offersProcedureWithPrice).toHaveBeenCalledWith(
        em,
        SITE,
        PROCEDURE,
      );
      expect(sites.isActivelyAffiliated).not.toHaveBeenCalled();
    });
  });

  describe('SELF', () => {
    const mode = PERFORMER_SELECTION_CONCEPTS.SELF;
    const complete = {
      performerSelectionConceptId: mode,
      performerPractitionerProfileId: DOCTOR,
      suggestedPracticeSiteId: SITE,
    };

    it('sin médico ejecutor da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({ ...complete, performerPractitionerProfileId: undefined }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_FIELD_REQUIRED);
    });

    it('con un médico distinto del que pide la orden da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({ ...complete, performerPractitionerProfileId: 'otro' }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_NOT_REQUESTER);
    });

    it('si la orden no dice quién la pide da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({ ...complete, requesterProfileId: undefined }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_NOT_REQUESTER);
    });

    it('sin sede da 422', async () => {
      const { validator } = build();

      expect(
        await reasonOf(
          validator.resolve(
            em,
            input({ ...complete, suggestedPracticeSiteId: undefined }),
          ),
        ),
      ).toBe(ClinicalErrorReason.PERFORMER_FIELD_REQUIRED);
    });

    it('en una sede que no ofrece el procedimiento con precio da 422', async () => {
      const { validator } = build(false, true);

      expect(await reasonOf(validator.resolve(em, input(complete)))).toBe(
        ClinicalErrorReason.SUGGESTED_SITE_DOES_NOT_OFFER_PROCEDURE,
      );
    });

    it('sin afiliación ACTIVE del médico para ese procedimiento en esa sede da 422', async () => {
      const { validator, sites } = build(true, false);

      expect(await reasonOf(validator.resolve(em, input(complete)))).toBe(
        ClinicalErrorReason.PRACTITIONER_NOT_AFFILIATED_AT_SITE,
      );
      expect(sites.isActivelyAffiliated).toHaveBeenCalledWith(
        em,
        DOCTOR,
        SITE,
        PROCEDURE,
      );
    });

    it('con todo en regla devuelve los tres campos', async () => {
      const { validator } = build();

      await expect(validator.resolve(em, input(complete))).resolves.toEqual({
        performerSelectionConceptId: mode,
        performerPractitionerProfileId: DOCTOR,
        suggestedPracticeSiteId: SITE,
      });
    });
  });
});
