import 'reflect-metadata';
import { jest } from '@jest/globals';
import { PatientReviewsController } from './patient-reviews.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const rolesOf = (method: string): unknown =>
  Reflect.getMetadata(
    ROLES_KEY,
    (PatientReviewsController.prototype as never as Record<string, object>)[
      method
    ],
  );

describe('PatientReviewsController', () => {
  it('reviewable-care y reviews son sólo para PATIENT', () => {
    expect(rolesOf('getReviewableCare')).toEqual(['PATIENT']);
    expect(rolesOf('publishOwnReview')).toEqual(['PATIENT']);
  });

  it('GET reviewable-care delega con la reserva pedida y el actor de la sesión', async () => {
    const reviewableCare = {
      getReviewableCare: mockFn().mockResolvedValue({ canReview: true }),
    };
    const controller = new PatientReviewsController(
      {} as any,
      reviewableCare as any,
    );
    const actor = { id: 'u', roles: ['PATIENT'], patientProfileId: 'p' } as any;

    const result = await controller.getReviewableCare(
      { appointmentBookingId: 'book-1' },
      actor,
    );

    expect(result).toEqual({ canReview: true });
    expect(reviewableCare.getReviewableCare).toHaveBeenCalledWith(
      'book-1',
      actor,
    );
  });
});
