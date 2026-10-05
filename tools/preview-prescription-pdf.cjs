// Visual review fixture. Run `yarn build` first, then
// `node tools/preview-prescription-pdf.cjs <historial.pdf>`.
const fs = require('node:fs');
const path = require('node:path');
const { PrescriptionDocumentsService } = require('../dist/src/modules/clinical/services/prescription-documents.service.js');

const output = process.argv[2];
if (!output) throw new Error('Indicar la ruta de salida del PDF');
const em = {
  fork() { return this; },
  async find(entity) {
    if (entity.name === 'CatalogConcepts') return [
      { id: 'med', code: 'MED', display: 'Amoxicilina con ácido clavulánico 875 mg / 125 mg' },
      { id: 'status', code: 'MR_ISSUED', display: 'Medication request issued' },
      { id: 'route', code: 'PO', display: 'Vía oral' },
      { id: 'unit', code: 'TAB', display: 'tabletas' },
    ];
    if (entity.name === 'Persons') return [
      { id: 'patient', displayName: 'María Fernanda Pérez Quispe' },
      { id: 'doctor', displayName: 'Dra. Valeria Salazar' },
    ];
    if (entity.name === 'HealthPractitionerProfiles') return [
      { profileId: 'doctor', practitionerCode: 'MED-2048' },
    ];
    if (entity.name === 'JurisdictionAuthorizations') return [
      { practitionerProfileId: 'doctor', licenseNumber: 'MP-45821', regulatoryAuthority: 'Colegio Médico de Bolivia' },
    ];
    return [];
  },
};
const longInstructions = Array.from({ length: 30 }, (_, i) =>
  `${i + 1}. Tomar después de comer. Si aparecen molestias persistentes, consultar con el profesional tratante.`
).join('\n');
const rows = [
  { id: 'rx-preview-1', patientProfileId: 'patient', prescriberProfileId: 'doctor',
    medicationConceptId: 'med', statusConceptId: 'status', routeConceptId: 'route',
    unitConceptId: 'unit', quantityDecimal: '14',
    issuedAt: new Date('2026-10-01T12:00:00Z'), validTo: new Date('2026-10-31T12:00:00Z'),
    doseText: 'Una tableta de 875 mg / 125 mg por vía oral', frequencyText: 'Cada 12 horas durante 7 días',
    patientInstructionsText: longInstructions },
  { id: 'rx-preview-2', patientProfileId: 'patient', prescriberProfileId: 'doctor',
    medicationConceptId: 'med', statusConceptId: 'status', routeConceptId: 'route',
    unitConceptId: 'unit', quantityDecimal: '21',
    issuedAt: new Date('2026-09-01T12:00:00Z'), doseText: '500 mg', frequencyText: 'Cada 8 horas',
    patientInstructionsText: 'Completar el tratamiento indicado.' },
];

const service = new PrescriptionDocumentsService(em);
const individualOutput = path.join(
  path.dirname(output),
  `${path.basename(output, path.extname(output))}-individual.pdf`,
);

Promise.all([
  service.pdf(rows, 'Historial de recetas').then((buffer) => {
    fs.writeFileSync(output, buffer);
    process.stdout.write(`${output}\n`);
  }),
  service.pdf([rows[0]], 'Receta médica').then((buffer) => {
    fs.writeFileSync(individualOutput, buffer);
    process.stdout.write(`${individualOutput}\n`);
  }),
]).catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
