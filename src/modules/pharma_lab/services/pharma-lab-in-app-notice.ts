import type {
  EmitInAppInput,
  NotificationCategory,
  NotificationDestinationType,
} from '../../messaging/notifications.contract';
import type { PharmaLabNotice } from './pharma-lab-notifications.service';

/** Templates addressed to the doctor who receives the visit. */
const DOCTOR_TEMPLATES = new Set([
  'PHARMA_LAB_VISIT_REQUESTED',
  'PHARMA_LAB_VISIT_AUTO_CONFIRMED',
  'PHARMA_LAB_VISIT_RESCHEDULED',
  'PHARMA_LAB_VISIT_CANCELLED',
  'PHARMA_LAB_VISIT_CANCELLED_BY_UNLINK',
  'PHARMA_LAB_VISIT_RECORDED',
  'PHARMA_LAB_SURVEY_ISSUED',
]);

/** Templates addressed to the lab staff (safety and regulatory events). */
const LAB_STAFF_TEMPLATES = new Set([
  'PHARMA_LAB_PV_REPORT_RECEIVED',
  'PHARMA_LAB_DOCUMENT_EXPIRED',
  'PHARMA_LAB_DOCUMENT_EXPIRING',
]);

/**
 * Pharmacovigilance bodies quote the adverse-event description, which may
 * carry patient data: the bell gets a fixed line instead.
 */
const GENERIC_BODY: Readonly<Record<string, string>> = {
  PHARMA_LAB_PV_REPORT_RECEIVED:
    'Revise el reporte en el panel de farmacovigilancia del laboratorio.',
};

/**
 * Which screen opens the notice. Everything not addressed to the doctor or
 * to the lab staff goes to the visitor (decisions on their visits, ratings,
 * post moderation).
 */
function destinationTypeOf(templateCode: string): NotificationDestinationType {
  if (DOCTOR_TEMPLATES.has(templateCode)) return 'PHARMA_LAB_DOCTOR_VISITS';
  if (LAB_STAFF_TEMPLATES.has(templateCode)) return 'PHARMA_LAB_ADMIN';
  return 'PHARMA_LAB_VISITOR_VISITS';
}

/**
 * Preference family: visits are scheduling, post moderation is social, and
 * safety/regulatory events are clinical so muting "social" never hides them.
 */
function categoryOf(templateCode: string): NotificationCategory {
  if (LAB_STAFF_TEMPLATES.has(templateCode)) return 'CLINICAL';
  if (templateCode.startsWith('PHARMA_LAB_POST_')) return 'SOCIAL';
  return 'SCHEDULING';
}

/**
 * The messaging copy of a pharma_lab notice.
 *
 * The debounce key is the local notice row: one in-app request per fact, and
 * retrying the same write never produces a second one.
 *
 * @param notice - The notice written to `pharma_lab.pharma_lab_notices`.
 * @param noticeId - Id of that row.
 * @param actorUserId - Who caused the fact.
 * @returns The `emitInApp` input.
 */
export function pharmaLabInAppNotice(
  notice: PharmaLabNotice,
  noticeId: string,
  actorUserId?: string,
): EmitInAppInput {
  return {
    recipientUserId: notice.recipientUserId,
    category: categoryOf(notice.templateCode),
    subject: notice.subject,
    bodyText: GENERIC_BODY[notice.templateCode] ?? notice.bodyText,
    destination: {
      type: destinationTypeOf(notice.templateCode),
      id: notice.relatedResourceId,
    },
    tenantId: notice.tenantId,
    debounceKey: `pharma_lab:notice:${noticeId}`,
    payloadJson: { templateCode: notice.templateCode },
    actorUserId,
  };
}
