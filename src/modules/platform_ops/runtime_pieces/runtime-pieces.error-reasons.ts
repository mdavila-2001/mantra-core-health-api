/**
 * Sub-códigos de negocio estables del registro de piezas ejecutables.
 * `code` dice el tipo HTTP; `reason` dice cuál error concreto fue.
 */
export enum RuntimePiecesErrorReason {
  RUNTIME_PIECE_NOT_FOUND = 'RUNTIME_PIECE_NOT_FOUND',
  RUNTIME_PIECES_SOURCE_UNAVAILABLE = 'RUNTIME_PIECES_SOURCE_UNAVAILABLE',
  RUNTIME_PIECES_CONCEPTS_MISSING = 'RUNTIME_PIECES_CONCEPTS_MISSING',
  RUNTIME_PIECES_TENANT_MISSING = 'RUNTIME_PIECES_TENANT_MISSING',
}
