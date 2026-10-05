import {
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import PDFDocument from 'pdfkit';
import { CatalogConcepts } from '../../terminology/entities/catalog_concepts.entity';
import { Persons } from '../../profiles/entities/persons.entity';
import { HealthPractitionerProfiles } from '../../profiles/entities/health_practitioner_profiles.entity';
import { JurisdictionAuthorizations } from '../../profiles/entities/jurisdiction_authorizations.entity';
import { MedicationRequests } from '../entities/medication_requests.entity';
import { PRESCRIPTION_PDF_THEME as theme } from './prescription-pdf.theme';

export interface PrescriptionListItem {
  id: string;
  medication: string;
  status: string;
  issuedAt: Date;
  validTo?: Date;
  doseText?: string;
  frequencyText?: string;
  prescriber?: string;
}

type Prescription = MedicationRequests;
const MAX_HISTORY_PRESCRIPTIONS = 5_000;

/** Fuente única de los documentos de receta: siempre lee datos sellados en la API. */
@Injectable()
export class PrescriptionDocumentsService {
  constructor(private readonly em: EntityManager) {}

  async list(patientProfileId: string, offset: number, limit: number) {
    const em = this.em.fork();
    const where = { patientProfileId, issuedAt: { $ne: null } };
    const [rows, total] = await em.findAndCount(MedicationRequests, where, {
      orderBy: { issuedAt: 'DESC', id: 'DESC' },
      offset,
      limit,
    });
    const labels = await this.labels(em, rows);
    const people = await this.people(
      em,
      rows.flatMap((row) =>
        row.prescriberProfileId ? [row.prescriberProfileId] : [],
      ),
    );
    return {
      items: rows.map((row) => this.item(row, labels, people)),
      total,
      offset,
      limit,
    };
  }

  async one(id: string): Promise<Prescription> {
    const row = await this.em.fork().findOne(MedicationRequests, { id });
    if (!row || !row.issuedAt)
      throw new NotFoundException('Receta emitida no encontrada');
    return row;
  }

  async all(patientProfileId: string): Promise<Prescription[]> {
    const em = this.em.fork();
    const rows: Prescription[] = [];
    // Cursor estable: una nueva emisión durante la exportación no desplaza
    // las páginas ya leídas ni duplica una receta.
    let cursor: Prescription | undefined;
    for (;;) {
      const page = await em.find(
        MedicationRequests,
        {
          patientProfileId,
          issuedAt: { $ne: null },
          ...(cursor
            ? {
                $or: [
                  { issuedAt: { $lt: cursor.issuedAt } },
                  { issuedAt: cursor.issuedAt, id: { $lt: cursor.id } },
                ],
              }
            : {}),
        },
        { orderBy: { issuedAt: 'DESC', id: 'DESC' }, limit: 200 },
      );
      rows.push(...page);
      if (rows.length > MAX_HISTORY_PRESCRIPTIONS) {
        throw new PayloadTooLargeException(
          `El historial supera el máximo operativo de ${MAX_HISTORY_PRESCRIPTIONS} recetas.`,
        );
      }
      if (page.length < 200) break;
      cursor = page[page.length - 1];
    }
    return rows;
  }

  async pdf(rows: readonly Prescription[], title: string): Promise<Buffer> {
    const em = this.em.fork();
    const labels = await this.labels(em, rows);
    const peopleIds = [
      ...new Set(
        rows.flatMap((row) =>
          [row.patientProfileId, row.prescriberProfileId].filter(
            (id): id is string => !!id,
          ),
        ),
      ),
    ];
    const people = await this.people(em, peopleIds);
    const practitioners = new Map(
      (
        await em.find(HealthPractitionerProfiles, {
          profileId: {
            $in: rows
              .map((row) => row.prescriberProfileId)
              .filter((id): id is string => !!id),
          },
        })
      ).map((profile) => [profile.profileId, profile]),
    );
    const licenses = new Map<string, JurisdictionAuthorizations>();
    for (const license of await em.find(
      JurisdictionAuthorizations,
      {
        practitionerProfileId: {
          $in: rows
            .map((row) => row.prescriberProfileId)
            .filter((id): id is string => !!id),
        },
      },
      { orderBy: { createdAt: 'DESC' } },
    )) {
      if (!licenses.has(license.practitionerProfileId))
        licenses.set(license.practitionerProfileId, license);
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: theme.page.margin,
        bottom: 85,
        left: theme.page.margin,
        right: theme.page.margin,
      },
      bufferPages: true,
      info: { Title: title, Author: 'AloVida' },
    });
    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    const left = theme.page.margin;
    const right = doc.page.width - theme.page.margin;
    const blue = theme.brand;
    const ink = theme.ink;
    const muted = theme.muted;
    const rule = theme.rule;
    let intentionalPage = false;
    doc.on('pageAdded', () => {
      if (intentionalPage) return;
      doc
        .fillColor(blue)
        .font('Helvetica-Bold')
        .fontSize(theme.font.label + 4)
        .text('ALOVIDA', left, 45);
      doc
        .strokeColor(rule)
        .lineWidth(0.7)
        .moveTo(left, 67)
        .lineTo(right, 67)
        .stroke();
      doc.y = 89;
      doc
        .fillColor(muted)
        .font('Helvetica')
        .fontSize(8)
        .text(`${title} · continuación`);
      doc.moveDown(1);
    });
    const line = (text: string, value?: string) => {
      if (!value?.trim()) return;
      doc
        .fillColor(muted)
        .font('Helvetica-Bold')
        .fontSize(theme.font.label)
        .text(text.toUpperCase(), { continued: false });
      doc
        .moveDown(0.18)
        .fillColor(ink)
        .font('Helvetica')
        .fontSize(theme.font.body + 0.5)
        .text(value, { lineGap: 3 })
        .moveDown(0.45);
    };
    const header = (subtitle: string) => {
      doc
        .fillColor(blue)
        .font('Helvetica-Bold')
        .fontSize(theme.font.label + 4)
        .text('ALOVIDA', left, 45);
      doc
        .strokeColor(rule)
        .lineWidth(0.7)
        .moveTo(left, 67)
        .lineTo(right, 67)
        .stroke();
      doc.y = 89;
      doc
        .fillColor(theme.brandDeep)
        .font('Helvetica-Bold')
        .fontSize(theme.font.title)
        .text(title);
      doc
        .moveDown(0.25)
        .fillColor(muted)
        .font('Helvetica')
        .fontSize(9)
        .text(subtitle);
      doc.moveDown(1.5);
    };
    header(
      title === 'Historial de recetas'
        ? `${rows.length} recetas emitidas · orden cronológico`
        : 'Documento clínico individual',
    );
    if (rows.length === 0) {
      doc
        .fillColor(ink)
        .fontSize(11)
        .text('No hay recetas emitidas registradas.');
    }
    if (title === 'Historial de recetas' && rows.length > 0) {
      doc
        .moveDown(0.8)
        .fillColor(theme.brandDeep)
        .font('Helvetica-Bold')
        .fontSize(theme.font.section)
        .text('Índice de recetas');
      doc
        .moveDown(0.5)
        .fillColor(muted)
        .font('Helvetica')
        .fontSize(theme.font.note)
        .text('Buscá el mismo número en el detalle de cada receta.');
      doc.moveDown(0.4);
      for (const [index, row] of rows.entries()) {
        const medication =
          labels.get(row.medicationConceptId) ?? 'Medicamento sin nombre';
        const status =
          labels.get(row.statusConceptId) ?? 'Estado no disponible';
        const issued = this.date(row.issuedAt!).split(',')[0];
        doc
          .fillColor(ink)
          .font('Helvetica')
          .fontSize(theme.font.note)
          .text(
            `${String(index + 1).padStart(2, '0')} · ${issued} · ${medication} · ${status}`,
            { width: right - left, lineGap: 2 },
          );
        doc.moveDown(0.25);
      }
      intentionalPage = true;
      doc.addPage();
      intentionalPage = false;
      header('Detalle de las recetas');
    }
    for (const [index, row] of rows.entries()) {
      if (index === 0 && title === 'Historial de recetas') {
        doc
          .fillColor(blue)
          .font('Helvetica-Bold')
          .fontSize(theme.font.label + 2)
          .text(`RECETA 1 DE ${rows.length}`);
        doc.moveDown(0.8);
      } else if (index > 0) {
        // Reservar espacio para los datos básicos de la siguiente receta.
        // Si empieza al final de una hoja, sus indicaciones quedarían huérfanas.
        if (doc.y > 250) {
          intentionalPage = true;
          doc.addPage();
          intentionalPage = false;
          header(`Receta ${index + 1} de ${rows.length}`);
        } else {
          doc
            .moveDown(1.5)
            .strokeColor(rule)
            .lineWidth(1)
            .moveTo(left, doc.y)
            .lineTo(right, doc.y)
            .stroke();
          doc
            .moveDown(1.5)
            .fillColor(blue)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(`RECETA ${index + 1} DE ${rows.length}`);
          doc.moveDown(0.8);
        }
      }
      const item = this.item(row, labels, people);
      const status = labels.get(row.statusConceptId) ?? 'Estado no disponible';
      const invalid = /invalid|replac|anulad|sustituid/i.test(status);
      const expired =
        row.validTo !== undefined && row.validTo.getTime() < Date.now();
      const historical =
        invalid || expired || /completad|renovad/i.test(status);
      const knownCurrent = /^(emitida|vigente)$/i.test(status);
      doc
        .fillColor(
          invalid ? '#9a3c24' : historical || !knownCurrent ? '#855d1d' : blue,
        )
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          historical
            ? `REGISTRO HISTÓRICO · ${expired && !invalid ? 'VENCIDA' : status.toUpperCase()}`
            : knownCurrent
              ? 'RECETA EMITIDA'
              : `RECETA EMITIDA · ${status.toUpperCase()}`,
        );
      doc.moveDown(1);
      line('Paciente', people.get(row.patientProfileId) || 'No registrado');
      line('Fecha de emisión', this.date(row.issuedAt!));
      line(
        'Profesional',
        people.get(row.prescriberProfileId ?? '') || 'No registrado',
      );
      line(
        'Matrícula',
        licenses.get(row.prescriberProfileId ?? '')?.licenseNumber,
      );
      line(
        'Autoridad',
        licenses.get(row.prescriberProfileId ?? '')?.regulatoryAuthority,
      );
      if (!licenses.has(row.prescriberProfileId ?? '')) {
        line(
          'Código profesional',
          practitioners.get(row.prescriberProfileId ?? '')?.practitionerCode,
        );
      }
      doc
        .moveDown(0.5)
        .strokeColor(rule)
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .stroke();
      doc.moveDown(1);
      doc
        .fillColor(theme.brandDeep)
        .font('Helvetica-Bold')
        .fontSize(theme.font.section + 1)
        .text(item.medication);
      doc.moveDown(0.8);
      line('Dosis', row.doseText);
      line('Vía de administración', labels.get(row.routeConceptId ?? ''));
      line('Frecuencia', row.frequencyText);
      line(
        'Cantidad',
        [row.quantityDecimal, labels.get(row.unitConceptId ?? '')]
          .filter(Boolean)
          .join(' '),
      );
      line(
        'Vigencia',
        [
          row.validFrom && this.date(row.validFrom),
          row.validTo && this.date(row.validTo),
        ]
          .filter(Boolean)
          .join(' — '),
      );
      line('Indicaciones al paciente', row.patientInstructionsText);
      if (invalid) line('Motivo del cambio de estado', row.statusReasonText);
      doc
        .moveDown(0.5)
        .fillColor(muted)
        .font('Helvetica')
        .fontSize(8)
        .text(`Identificador de receta: ${row.id}`);
    }
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 52;
      const footerRuleY = theme.page.height - 76;
      const footerTextY = theme.page.height - 66;
      doc
        .strokeColor(rule)
        .moveTo(left, footerRuleY)
        .lineTo(right, footerRuleY)
        .stroke();
      doc
        .fillColor(muted)
        .font('Helvetica')
        .fontSize(theme.font.note)
        .text('Documento confidencial · AloVida', left, footerTextY, {
          lineBreak: false,
        })
        .text(`Página ${i + 1} de ${pages.count}`, right - 73, footerTextY, {
          align: 'right',
          width: 73,
          lineBreak: false,
        });
    }
    doc.end();
    return done;
  }

  private date(date: Date): string {
    return new Intl.DateTimeFormat('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/La_Paz',
    }).format(date);
  }

  private item(
    row: Prescription,
    labels: ReadonlyMap<string, string>,
    people: ReadonlyMap<string, string> = new Map(),
  ): PrescriptionListItem {
    return {
      id: row.id,
      medication:
        labels.get(row.medicationConceptId) ?? 'Medicamento sin nombre',
      status: labels.get(row.statusConceptId) ?? 'Estado no disponible',
      issuedAt: row.issuedAt!,
      validTo: row.validTo,
      doseText: row.doseText,
      frequencyText: row.frequencyText,
      prescriber: people.get(row.prescriberProfileId ?? ''),
    };
  }

  private async people(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(ids)];
    const people = new Map<string, string>();
    for (let i = 0; i < unique.length; i += 200) {
      for (const person of await em.find(Persons, {
        id: { $in: unique.slice(i, i + 200) },
      })) {
        const name =
          person.displayName ||
          [
            person.name,
            person.middleName,
            person.lastName,
            person.motherLastName,
          ]
            .filter(Boolean)
            .join(' ');
        if (name) people.set(person.id, name);
      }
    }
    return people;
  }

  private async labels(
    em: EntityManager,
    rows: readonly Prescription[],
  ): Promise<Map<string, string>> {
    const ids = [
      ...new Set(
        rows.flatMap((row) =>
          [
            row.medicationConceptId,
            row.statusConceptId,
            row.routeConceptId,
            row.unitConceptId,
          ].filter((id): id is string => !!id),
        ),
      ),
    ];
    if (ids.length === 0) return new Map();
    const labels = new Map<string, string>();
    for (let i = 0; i < ids.length; i += 200) {
      for (const concept of await em.find(CatalogConcepts, {
        id: { $in: ids.slice(i, i + 200) },
      })) {
        const estados: Record<string, string> = {
          MR_ISSUED: 'Emitida',
          MR_ACTIVE: 'Vigente',
          MR_COMPLETED: 'Completada',
          MR_INVALIDATED: 'Anulada',
          MR_REPLACED: 'Reemplazada',
          MR_RENEWED: 'Renovada',
        };
        labels.set(concept.id, estados[concept.code] ?? concept.display);
      }
    }
    return labels;
  }
}
