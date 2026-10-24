import { IamOnboardingDraftsController } from './iam-onboarding-drafts.controller';
import {
  IamOnboardingDraftsService,
  type OnboardingDraftPayload,
} from '../../application/services/iam-onboarding-drafts.service';

describe('IamOnboardingDraftsController', () => {
  let controller: IamOnboardingDraftsController;
  let service: IamOnboardingDraftsService;

  beforeEach(() => {
    service = new IamOnboardingDraftsService();
    controller = new IamOnboardingDraftsController(service);
  });

  const mockPayload: OnboardingDraftPayload = {
    draftId: 'draft-xyz',
    formType: 'patient',
    stepIndex: 1,
    stepKey: 'contacto',
    stepTitle: 'Datos de contacto',
    data: { name: 'Maria', password: 'plain-password-to-strip' },
    createdAt: '2026-10-21T00:00:00Z',
    updatedAt: '2026-10-21T00:00:00Z',
    percentComplete: 50,
  };

  it('guarda un borrador eliminando contraseñas por seguridad y lo recupera', () => {
    const saveResult = controller.saveDraft('patient', 'draft-xyz', mockPayload);
    expect(saveResult.ok).toBe(true);

    const retrieved = controller.getDraft('patient', 'draft-xyz');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.data['name']).toBe('Maria');
    expect(retrieved?.data['password']).toBeUndefined();
  });

  it('elimina el borrador', () => {
    controller.saveDraft('patient', 'draft-xyz', mockPayload);
    expect(controller.getDraft('patient', 'draft-xyz')).not.toBeNull();

    const deleteResult = controller.deleteDraft('patient', 'draft-xyz');
    expect(deleteResult.ok).toBe(true);
    expect(controller.getDraft('patient', 'draft-xyz')).toBeNull();
  });
});
