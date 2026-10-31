import { AUTHZ_CONCEPT_SEEDS, AUTHZ } from '../authz/authz.concepts';
import { AUDIT_CONCEPT_SEEDS, AUD } from '../audit/audit.concepts';
import { deterministicId } from '../../common/constants/concepts';
import { MODULE_CONCEPT_SEEDS } from '../../common/seed/module-concepts';
import {
  DELEGATED_ACCESS_CONCEPT_SEEDS,
  DELEG,
} from './delegated_access.concepts';

/**
 * Los 92 conceptos nuevos del gobierno de accesos (CONTRATO-GOBIERNO Anexo B):
 * 7 de `authz`, 1 de `audit` y 84 de `delegated_access`. Los CHECK del parche
 * v4.2.72 usan estos ids como literales: si una clave o un id cambia, la base
 * rechaza las filas. Los pares clave/id se copian del contrato, no se calculan
 * con el código que se prueba.
 */
const ANEXO_B: readonly (readonly [string, string])[] = [
  ['authz:SENSITIVITY_LOW', '2a5b8592-dcf4-5643-af29-609b689c5a96'],
  ['authz:SENSITIVITY_MEDIUM', '0beaba91-1b4d-5e7b-8ba9-be584245df0a'],
  ['authz:SENSITIVITY_HIGH', 'e9e9a413-e636-5eb1-8d73-62f67b9c57f3'],
  ['authz:SENSITIVITY_CRITICAL', 'dc8d3a20-6a3f-5d2f-b85f-85475513a93b'],
  ['authz:APPROVAL_DOCTOR', '1ec189f8-507a-5fce-9fac-09a584864c04'],
  ['authz:APPROVAL_SECOND_APPROVER', '610c6456-d162-539e-b21e-2d19a4a99b88'],
  ['authz:APPROVAL_SERVICE_HEAD', 'de62f18e-c56d-5ed2-a2f0-2ce76a2a52f0'],
  [
    'audit:LEGAL_BASIS_HEALTHCARE_OPERATIONS',
    '42521499-302b-56b5-ae4a-b3a0d2e6f468',
  ],
  [
    'delegated_access:GOV_RULE_DENY_PERMISSION',
    '2e3f3830-b5cc-5661-902e-9106df223081',
  ],
  ['delegated_access:GOV_RULE_CEILING', 'ce906685-7a58-54e7-b4d2-458062c0c303'],
  [
    'delegated_access:GOV_RULE_REQUIRE_CONDITION',
    '1b6db045-2cc5-5985-9c89-18b8ac0969be',
  ],
  [
    'delegated_access:GOV_RULE_FIELD_FLOOR',
    'f2534b4a-a8cc-5fb1-a431-30e1a750274b',
  ],
  ['delegated_access:SOD_ACTION_BLOCK', 'd317a334-2e99-5361-836c-674cbeec5d26'],
  [
    'delegated_access:SOD_ACTION_REQUIRE_APPROVAL',
    '117ffae4-a53b-5f5a-a927-d625ae57ad67',
  ],
  ['delegated_access:SOD_ACTION_WARN', '156a7df4-b47c-52d3-9646-9f201757db51'],
  ['delegated_access:SOD_SCOPE_PERSON', '0fb8d904-8d4c-5ff5-972e-b0968cadc699'],
  [
    'delegated_access:SOD_SCOPE_PERSON_OVERLAP',
    '5959b7b1-6a78-5a16-a856-8bd7b4395a0a',
  ],
  [
    'delegated_access:SOD_SCOPE_TRANSACTION',
    '926b5260-3468-5925-9aae-6ebbd4942fea',
  ],
  [
    'delegated_access:FOUR_EYES_PENDING',
    'a977935a-9073-5113-9644-7df96732e776',
  ],
  [
    'delegated_access:FOUR_EYES_APPROVED',
    '1627143e-d273-5fcb-b289-9e59b8b096f2',
  ],
  [
    'delegated_access:FOUR_EYES_REJECTED',
    'de15c53d-1aa0-5709-8ebd-69e9fd323e31',
  ],
  [
    'delegated_access:FOUR_EYES_EXPIRED',
    '94e35d5c-9790-5e6d-acaf-ae253e56101f',
  ],
  [
    'delegated_access:FOUR_EYES_CANCELLED',
    'cda80e89-c845-5d7e-aac1-f50bf78ef050',
  ],
  [
    'delegated_access:FOUR_EYES_EXECUTED',
    '013d578f-38af-564c-aff1-e36d1fdec6dd',
  ],
  [
    'delegated_access:FOUR_EYES_KIND_ACTION',
    '201ca117-97ad-58c2-a6d3-803ea412cd2c',
  ],
  [
    'delegated_access:FOUR_EYES_KIND_GRANT_CHANGE',
    '26a6dc6f-0b9f-5946-9214-e43a7382de68',
  ],
  [
    'delegated_access:FOUR_EYES_KIND_SOD_EXCEPTION',
    '5b36bf36-7f60-5d20-a2ea-3c7826e8d492',
  ],
  [
    'delegated_access:FOUR_EYES_KIND_REACTIVATION',
    '99b6eaae-af0b-5929-b0f9-666be9ed3a83',
  ],
  [
    'delegated_access:FOUR_EYES_KIND_ENGAGEMENT_MOVE',
    'c5dace75-a0b2-5bac-bdda-5b19d7f0aaef',
  ],
  [
    'delegated_access:REVIEW_KIND_PERIODIC',
    '969627cf-9dff-5f7d-b6c6-8478414a6822',
  ],
  [
    'delegated_access:REVIEW_KIND_RECERTIFICATION',
    '9f831109-61d2-54d4-8e67-7ad04ac9a315',
  ],
  [
    'delegated_access:REVIEW_KIND_MOVER',
    'c5759b60-79a6-5ff3-bca5-08d2d68b7387',
  ],
  [
    'delegated_access:REVIEW_KIND_TARGETED',
    '0105205a-86d2-538e-8d76-b51f93753d23',
  ],
  [
    'delegated_access:REVIEW_KIND_REMEDIATION',
    '4c13052c-1c83-571d-b201-40d74c23d430',
  ],
  [
    'delegated_access:REVIEW_CAMPAIGN_DRAFT',
    '743d9f11-b186-5547-ae3d-cc44d94724bd',
  ],
  [
    'delegated_access:REVIEW_CAMPAIGN_OPEN',
    'faa5c9bf-5300-5e43-8829-19a9f0e94fef',
  ],
  [
    'delegated_access:REVIEW_CAMPAIGN_CLOSED',
    '01114233-ee4d-52d2-beeb-821534f835e6',
  ],
  [
    'delegated_access:REVIEW_CAMPAIGN_CANCELLED',
    'b01bd8d2-99d0-5c44-a77d-2a3093f9695c',
  ],
  [
    'delegated_access:REVIEW_ITEM_PENDING',
    '55a6db07-19e7-5bb4-978a-3d246492f49d',
  ],
  [
    'delegated_access:REVIEW_ITEM_CERTIFIED',
    'a3896ca4-e2a6-5b1b-a192-6b457ea34586',
  ],
  [
    'delegated_access:REVIEW_ITEM_REVOKED',
    'bce72e9a-b3bb-5fab-8e79-85d411ba692c',
  ],
  [
    'delegated_access:REVIEW_ITEM_ADJUSTED',
    '26f790b1-6d77-5286-89d5-0e82a4dcfb81',
  ],
  [
    'delegated_access:REVIEW_ITEM_AUTO_REVOKED',
    'c94f52a2-fba0-5d54-a379-e7aa6a8e1144',
  ],
  [
    'delegated_access:REVIEW_ITEM_SKIPPED',
    '6aacf6b6-9473-5589-b191-90f8d378aa63',
  ],
  [
    'delegated_access:REVIEWER_KIND_DOCTOR_OWNER',
    '75b09a0e-44df-5830-93d0-6539c00145fd',
  ],
  [
    'delegated_access:REVIEWER_KIND_SERVICE_HEAD',
    '716540f6-d919-5f7f-8fe9-7f50909b789f',
  ],
  [
    'delegated_access:REVIEWER_KIND_SUPERVISOR',
    '7e4272cc-9ebe-575a-bc36-b6983980a68f',
  ],
  [
    'delegated_access:REVIEWER_KIND_ADMIN',
    'ca9f26e2-6ed7-5292-b073-b876770c6433',
  ],
  [
    'delegated_access:UNCERTIFIED_REVOKE',
    'cdc3190b-22f6-5662-8ae0-34c1fb5c2ed2',
  ],
  [
    'delegated_access:UNCERTIFIED_ESCALATE',
    '36d4dcbd-19f6-51d2-a763-77c4889d8d35',
  ],
  ['delegated_access:LIFECYCLE_JOINER', 'c2a9a59d-c88c-5e87-9065-1e0e068c479d'],
  ['delegated_access:LIFECYCLE_MOVER', '57910aca-6dba-56f3-89ae-e60e12cd0752'],
  ['delegated_access:LIFECYCLE_LEAVER', '52380372-44ca-5da2-9cf2-df8602006405'],
  [
    'delegated_access:LIFECYCLE_SUSPENSION',
    '767afaf6-3161-56ee-8c96-5e9386804fc0',
  ],
  [
    'delegated_access:LIFECYCLE_REACTIVATION',
    '429c40b8-eb46-5d8c-97c3-edf591657254',
  ],
  ['delegated_access:LIFECYCLE_OPEN', '4f73e30c-25ba-52ff-969e-862e588cce13'],
  [
    'delegated_access:LIFECYCLE_COMPLETED',
    '4734035e-72cf-519f-8e27-e6cf25ba557f',
  ],
  [
    'delegated_access:LIFECYCLE_CANCELLED',
    '19fce939-19ff-5c9e-b7b3-5d14ba721ca7',
  ],
  [
    'delegated_access:HANDOVER_CONVERSATION',
    '2e3528d8-17e6-56e8-ac36-f2875c3c1d30',
  ],
  [
    'delegated_access:HANDOVER_WORKFLOW_TASK',
    'a4f162d4-dfbc-5b08-afff-d1be949d0692',
  ],
  [
    'delegated_access:HANDOVER_SUPERVISED_ENGAGEMENT',
    '9705ceb3-0065-5ef3-8279-ba4d8b560406',
  ],
  [
    'delegated_access:HANDOVER_PENDING_BOOKING',
    '01dc2120-cc99-5743-ba80-ac342e5642e7',
  ],
  ['delegated_access:HANDOVER_PENDING', '29406164-994b-55ab-bc88-697e22cd1cbc'],
  [
    'delegated_access:HANDOVER_REASSIGNED',
    '57d9c373-5a94-5fd6-bf9c-bd6a95cb2a91',
  ],
  [
    'delegated_access:HANDOVER_RETURNED_TO_POOL',
    '30b914c9-ead2-5b3e-9e59-7837726f4d6b',
  ],
  ['delegated_access:HANDOVER_CLOSED', 'd8858706-8072-5c85-bdba-a4ddbfde549d'],
  [
    'delegated_access:SUSPENSION_MANUAL',
    '971fef05-5343-556d-96ac-851f50adc7de',
  ],
  ['delegated_access:SUSPENSION_LEAVE', '3d36501c-449c-53da-bc5a-03e1b261dfd3'],
  [
    'delegated_access:SUSPENSION_INVESTIGATION',
    '6b7d7624-50f0-57bb-bed7-37f6b095f6d5',
  ],
  [
    'delegated_access:SUSPENSION_INACTIVITY',
    'a2315bc4-1655-5e68-a29e-fadb56d78490',
  ],
  [
    'delegated_access:SUSPENSION_RECERTIFICATION_LAPSED',
    'a3424a33-1969-5a90-b929-a6d2da19c735',
  ],
  [
    'delegated_access:IDENTITY_METHOD_IN_PERSON',
    'e8273ad4-4e98-5dcb-869e-f34019625dbc',
  ],
  [
    'delegated_access:IDENTITY_METHOD_DOCUMENT_UPLOAD',
    'ec46b4ba-fd91-5ae9-9293-137f79f98637',
  ],
  [
    'delegated_access:IDENTITY_METHOD_PLATFORM',
    'e80db404-0819-597b-93e8-3fff6b4e8eac',
  ],
  ['delegated_access:PATIENT_FLAG_VIP', 'baf4dc8a-ac39-5c94-a176-92e012bd024f'],
  [
    'delegated_access:PATIENT_FLAG_CONFIDENTIAL',
    '697c3db6-133e-5d64-a6fb-6b9d4d5342d5',
  ],
  [
    'delegated_access:PATIENT_FLAG_STAFF_RELATIVE',
    'e384ff44-2406-56ea-80f7-f7f37018cc35',
  ],
  [
    'delegated_access:PATIENT_FLAG_PROTECTED',
    'cc971a72-7aff-5474-b0fe-9099b5c69405',
  ],
  [
    'delegated_access:DECISION_EFFECT_PERMIT',
    '444c2600-a8d7-5adf-b1a8-e6416402c5f6',
  ],
  [
    'delegated_access:DECISION_EFFECT_DENY',
    '179b3675-742f-552c-b50e-4bba5c79262e',
  ],
  [
    'delegated_access:DECISION_EFFECT_CHALLENGE',
    '3a1287bc-836d-5d84-92df-9c92f129f7b5',
  ],
  [
    'delegated_access:ANOMALY_SEARCH_SPIKE',
    '7f20d407-aa33-5757-a6e0-3ddf9160592d',
  ],
  [
    'delegated_access:ANOMALY_CANCEL_SPIKE',
    '45046d7b-b2ac-5217-9f20-ad8762fc9b43',
  ],
  [
    'delegated_access:ANOMALY_OFF_HOURS',
    'a0ad134a-96e5-596d-a508-e6895a75c62d',
  ],
  [
    'delegated_access:ANOMALY_DENIED_BURST',
    'db538591-37bd-554d-bf1d-f6239dddf71e',
  ],
  [
    'delegated_access:ANOMALY_BROWSE_PATIENTS',
    '5c1ba80a-84be-51ff-b80f-882006bbdacf',
  ],
  [
    'delegated_access:ANOMALY_INACTIVE_ACCOUNT',
    'b188b551-f49c-557f-95d0-432e1cfb3214',
  ],
  [
    'delegated_access:ANOMALY_PRIVILEGE_CREEP',
    'd1743b44-0500-50b3-b0c2-7ff5156ab25e',
  ],
  ['delegated_access:ANOMALY_OPEN', '5dc5d5c6-03af-5c50-9841-2559f959a180'],
  [
    'delegated_access:ANOMALY_ACKNOWLEDGED',
    'b6352476-bd20-5b04-8008-2d363504aee5',
  ],
  [
    'delegated_access:ANOMALY_DISMISSED',
    '1c8f5b91-371b-5967-b8fd-98d08f80ac9c',
  ],
  [
    'delegated_access:ANOMALY_ESCALATED',
    'ec7ffd73-1272-5e63-b6ec-da5c5d45e334',
  ],
];

const SEMILLAS = [
  ...AUTHZ_CONCEPT_SEEDS,
  ...AUDIT_CONCEPT_SEEDS,
  ...DELEGATED_ACCESS_CONCEPT_SEEDS,
];

describe('conceptos del gobierno de accesos (Anexo B)', () => {
  it('son 92: 7 authz, 1 audit y 84 delegated_access', () => {
    expect(ANEXO_B).toHaveLength(92);
    const por = (p: string): number =>
      ANEXO_B.filter(([k]) => k.startsWith(`${p}:`)).length;
    expect([por('authz'), por('audit'), por('delegated_access')]).toEqual([
      7, 1, 84,
    ]);
  });

  it.each(ANEXO_B)(
    '%s se siembra con la clave completa y el id %s',
    (clave, id) => {
      const semilla = SEMILLAS.find((s) => s.key === clave);
      expect(semilla).toBeDefined();
      expect(deterministicId(clave)).toBe(id);
      expect((semilla?.display ?? '').length).toBeGreaterThan(0);
      const [modulo, nombre] = clave.split(':');
      const mapa = (
        modulo === 'authz' ? AUTHZ : modulo === 'audit' ? AUD : DELEG
      ) as Record<string, string>;
      expect(mapa[nombre]).toBe(id);
    },
  );

  it('el agregador MODULE_CONCEPT_SEEDS los incluye todos, sin repetir claves', () => {
    const claves = new Set(MODULE_CONCEPT_SEEDS.map((s) => s.key));
    for (const [clave] of ANEXO_B) expect(claves.has(clave)).toBe(true);
    expect(claves.size).toBe(MODULE_CONCEPT_SEEDS.length);
  });

  it('los ids son únicos (ninguna clave nueva choca con una existente)', () => {
    const ids = MODULE_CONCEPT_SEEDS.map((s) => deterministicId(s.key));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('authz:EFFECT_ALLOW y authz:EFFECT_DENY (reutilizados) tienen los ids de los CHECK', () => {
    expect(AUTHZ.EFFECT_ALLOW).toBe('6905e0db-1650-5d49-adca-8b2688ac049c');
    expect(AUTHZ.EFFECT_DENY).toBe('b038e546-a6ba-5848-9cd2-04b02ccb22b0');
  });
});
