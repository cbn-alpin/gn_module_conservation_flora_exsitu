/*
 * =========================================================
 * HISTORIQUE - ÉVÉNEMENT
 *
 * Structure commune destinée à être réutilisée plus tard
 * pour toutes les parties Ex-situ.
 * =========================================================
 */

export interface HistoriqueEvent {

  id_history: number;

  entity_type: string;

  entity_id: number;

  entity_code: string | null;

  event_type:
    | 'creation'
    | 'modification'
    | 'suppression'
    | string;

  event_date: string;

  id_actor: number | null;

  observer: string | null;

  id_harvest: number | null;

  id_material: number | null;

  changes?: any;
}