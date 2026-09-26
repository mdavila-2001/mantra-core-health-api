/* ============================================================================
    El pack de stickers «AloVida Salud» (AG-17, BR-22).

    Los 24 `id` son fijos y compartidos con el front
    (`core/messaging/sticker-pack.generated.ts`, GENERADO por
    `scripts/gen-sticker-pack.mjs`): un sticker mandado desde un entorno tiene
    que entenderse en el otro sin traducir nada.

    El backend **no sirve los bytes**: el front pinta el sticker desde su
    propio `public/stickers/*.svg` (es un archivo del producto, no del
    usuario). Lo único que el backend necesita es que estos 24 ids existan
    como filas de `common.files`/`common.file_versions` —para que la FK de
    `direct_messages.attachment_file_id` no falle— y una regla que permita
    asociarlos a un mensaje sin exigir que el remitente sea su dueño (los 24
    son del sistema, no de ningún usuario).
    ========================================================================== */

/** Un sticker del pack, con lo que el seed necesita para su fila. */
export interface StickerPackEntry {
  /** El mismo uuid fijo que usa el front como `attachmentFileId`. */
  readonly id: string;
  /** Clave corta, para el nombre del archivo y los logs. */
  readonly clave: string;
  /** Nombre legible, para `common.files.original_name`. */
  readonly nombre: string;
}

export const STICKER_PACK: readonly StickerPackEntry[] = [
  {
    id: 'a7c1f0e2-0001-4a00-9000-5713ca110001',
    clave: 'saludo',
    nombre: 'Hola',
  },
  {
    id: 'a7c1f0e2-0002-4a00-9000-5713ca110002',
    clave: 'gracias',
    nombre: 'Gracias',
  },
  {
    id: 'a7c1f0e2-0003-4a00-9000-5713ca110003',
    clave: 'en-camino',
    nombre: 'Ya voy en camino',
  },
  {
    id: 'a7c1f0e2-0004-4a00-9000-5713ca110004',
    clave: 'llegando-tarde',
    nombre: 'Llego tarde',
  },
  {
    id: 'a7c1f0e2-0005-4a00-9000-5713ca110005',
    clave: 'confirmado',
    nombre: 'Turno confirmado',
  },
  {
    id: 'a7c1f0e2-0006-4a00-9000-5713ca110006',
    clave: 'te-espero',
    nombre: 'Te espero en la consulta',
  },
  {
    id: 'a7c1f0e2-0007-4a00-9000-5713ca110007',
    clave: 'receta-lista',
    nombre: 'Receta lista',
  },
  {
    id: 'a7c1f0e2-0008-4a00-9000-5713ca110008',
    clave: 'tomar-remedio',
    nombre: 'Acordate del remedio',
  },
  {
    id: 'a7c1f0e2-0009-4a00-9000-5713ca110009',
    clave: 'resultados',
    nombre: 'Resultados listos',
  },
  {
    id: 'a7c1f0e2-0010-4a00-9000-5713ca110010',
    clave: 'ayunas',
    nombre: 'Vení en ayunas',
  },
  {
    id: 'a7c1f0e2-0011-4a00-9000-5713ca110011',
    clave: 'mejorate',
    nombre: 'Recuperate pronto',
  },
  {
    id: 'a7c1f0e2-0012-4a00-9000-5713ca110012',
    clave: 'animo',
    nombre: 'Ánimo',
  },
  {
    id: 'a7c1f0e2-0013-4a00-9000-5713ca110013',
    clave: 'cuidate',
    nombre: 'Cuidate mucho',
  },
  {
    id: 'a7c1f0e2-0014-4a00-9000-5713ca110014',
    clave: 'descansa',
    nombre: 'Descansá',
  },
  {
    id: 'a7c1f0e2-0015-4a00-9000-5713ca110015',
    clave: 'agua',
    nombre: 'Tomá agua',
  },
  {
    id: 'a7c1f0e2-0016-4a00-9000-5713ca110016',
    clave: 'control',
    nombre: 'Control en dos semanas',
  },
  {
    id: 'a7c1f0e2-0017-4a00-9000-5713ca110017',
    clave: 'entendido',
    nombre: 'Entendido',
  },
  {
    id: 'a7c1f0e2-0018-4a00-9000-5713ca110018',
    clave: 'consulta',
    nombre: 'Tengo una consulta',
  },
  {
    id: 'a7c1f0e2-0019-4a00-9000-5713ca110019',
    clave: 'reprogramar',
    nombre: 'Podemos reprogramar',
  },
  {
    id: 'a7c1f0e2-0020-4a00-9000-5713ca110020',
    clave: 'urgencia',
    nombre: 'Es urgente',
  },
  {
    id: 'a7c1f0e2-0021-4a00-9000-5713ca110021',
    clave: 'estudios',
    nombre: 'Traé tus estudios',
  },
  {
    id: 'a7c1f0e2-0022-4a00-9000-5713ca110022',
    clave: 'buen-dia',
    nombre: 'Buen día',
  },
  {
    id: 'a7c1f0e2-0023-4a00-9000-5713ca110023',
    clave: 'buenas-noches',
    nombre: 'Buenas noches',
  },
  {
    id: 'a7c1f0e2-0024-4a00-9000-5713ca110024',
    clave: 'felicitaciones',
    nombre: 'Felicitaciones',
  },
];

/** Sólo los ids, para la allowlist de `AttachableFileService`. */
export const STICKER_PACK_FILE_IDS: readonly string[] = STICKER_PACK.map(
  (s) => s.id,
);
