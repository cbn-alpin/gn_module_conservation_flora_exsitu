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

  /*
   * Numéro enregistré au moment de l'événement.
   *
   * Exemple :
   * création = A
   * modification = AA
   */
  entity_code: string | null;


  /*
   * Numéro actuel de l'élément.
   *
   * C'est celui affiché comme numéro principal
   * dans toutes les cartes de l'Historique.
   */
  current_entity_code: string | null;


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


  /*
   * =========================================================
   * HISTORIQUE - CONTEXTE DE NAVIGATION
   * =========================================================
   */
  detail_context?: {
    place_code?: string | null;
  };

}