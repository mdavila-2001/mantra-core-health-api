import { Injectable } from '@nestjs/common';

export interface OnboardingDraftPayload {
  readonly draftId: string;
  readonly formType: string;
  readonly stepIndex: number;
  readonly stepKey?: string;
  readonly stepTitle?: string;
  readonly data: Record<string, unknown>;
  readonly extraData?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly percentComplete: number;
}

@Injectable()
export class IamOnboardingDraftsService {
  // Almacén seguro de borradores indexado por formType:draftId con TTL de 30 días
  private readonly drafts = new Map<
    string,
    { payload: OnboardingDraftPayload; expiresAt: number }
  >();

  private readonly TTL_MS = 30 * 24 * 60 * 60 * 1000;

  getDraft(formType: string, draftId: string): OnboardingDraftPayload | null {
    const key = `${formType}:${draftId}`;
    const entry = this.drafts.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.drafts.delete(key);
      return null;
    }
    return entry.payload;
  }

  saveDraft(
    formType: string,
    draftId: string,
    payload: OnboardingDraftPayload,
  ): { ok: boolean; savedAt: string } {
    const key = `${formType}:${draftId}`;
    const sanitizedData = { ...payload.data };
    // Seguridad: jamás persistir contraseñas en borradores
    delete sanitizedData['password'];
    delete sanitizedData['confirmPassword'];

    const safePayload: OnboardingDraftPayload = {
      ...payload,
      formType,
      draftId,
      data: sanitizedData,
      updatedAt: new Date().toISOString(),
    };

    this.drafts.set(key, {
      payload: safePayload,
      expiresAt: Date.now() + this.TTL_MS,
    });

    return { ok: true, savedAt: safePayload.updatedAt };
  }

  deleteDraft(formType: string, draftId: string): { ok: boolean } {
    const key = `${formType}:${draftId}`;
    this.drafts.delete(key);
    return { ok: true };
  }
}
