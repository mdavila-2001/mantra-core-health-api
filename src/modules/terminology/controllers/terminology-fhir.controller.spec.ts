import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { TerminologyFhirController } from './terminology-fhir.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyFhirController', () => {
  function build() {
    const valueSetsService = { expandValueSet: jest.fn() } as any;
    const conceptMapsService = { translate: jest.fn() } as any;
    const conceptsService = { lookupConcept: jest.fn() } as any;
    const controller = new TerminologyFhirController(
      valueSetsService,
      conceptMapsService,
      conceptsService,
    );
    return {
      controller,
      valueSetsService,
      conceptMapsService,
      conceptsService,
    };
  }

  it('$expand delega con el id del conjunto de valores', async () => {
    const { controller, valueSetsService } = build();
    const dto = { valueSetVersionId: 'vsv-1' };
    const expected = { valueSetId: 'vs-1', valueSetVersionId: 'vsv-1' };
    valueSetsService.expandValueSet.mockResolvedValue(expected);

    const result = await controller.expandValueSet('vs-1', dto, user);

    expect(valueSetsService.expandValueSet).toHaveBeenCalledWith(
      'vs-1',
      dto,
      user,
    );
    expect(result).toBe(expected);
  });

  it('$translate delega el cuerpo completo', async () => {
    const { controller, conceptMapsService } = build();
    const dto = { sourceConceptId: 'c-1' };
    const expected = {
      sourceConceptId: 'c-1',
      matched: false,
      matches: [],
      curated: false,
    };
    conceptMapsService.translate.mockResolvedValue(expected);

    const result = await controller.translate(dto, user);

    expect(conceptMapsService.translate).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(expected);
  });

  it('$lookup delega system y code', async () => {
    const { controller, conceptsService } = build();
    const expected = { conceptId: 'c-1', code: 'E11' };
    conceptsService.lookupConcept.mockResolvedValue(expected);

    const result = await controller.lookup('http://x', 'E11');

    expect(conceptsService.lookupConcept).toHaveBeenCalledWith(
      'http://x',
      'E11',
    );
    expect(result).toBe(expected);
  });

  it('$lookup rechaza la llamada sin system', () => {
    const { controller } = build();

    expect(() => controller.lookup('', 'E11')).toThrow(BadRequestException);
  });

  it('$lookup rechaza la llamada sin code', () => {
    const { controller } = build();

    expect(() => controller.lookup('http://x', '')).toThrow(
      BadRequestException,
    );
  });
});
