import {
  Injectable
} from '@angular/core';

import {
  BehaviorSubject
} from 'rxjs';


export type TutoPlacement =
  'top' |
  'bottom';


export interface TutoStepState {

  section: 'material';

  step: number;
  total: number;

  selectors: string[];

  title: string;
  description: string;

  placement: TutoPlacement;

  showNext: boolean;
  canNext: boolean;

}


@Injectable({
  providedIn: 'root'
})
export class TutoService {

  private readonly stateSubject =
    new BehaviorSubject<TutoStepState | null>(
      null
    );


  private materialTutorialCode:
    string | null =
      null;


  private cultureTutorialCode:
    string | null =
      null;


  readonly state$ =
    this.stateSubject.asObservable();


  get currentState():
    TutoStepState | null {

    return this.stateSubject.value;
  }


  get tutorialMaterialCode():
    string | null {

    return this.materialTutorialCode;
  }


  get tutorialCultureCode():
    string | null {

    return this.cultureTutorialCode;
  }


  isMaterialTutorialActive(): boolean {

    return (
      this.currentState?.section ===
      'material'
    );
  }


  isMaterialStep(
    step: number
  ): boolean {

    return (
      this.currentState?.section ===
        'material' &&
      this.currentState?.step ===
        step
    );
  }


  isTutorialMaterialCode(
    value: any
  ): boolean {

    const expected =
      String(
        this.materialTutorialCode || ''
      )
        .trim()
        .toLowerCase();


    const current =
      String(
        value || ''
      )
        .trim()
        .toLowerCase();


    return (
      !!expected &&
      current === expected
    );
  }


  startMaterialTutorial(): void {

    this.materialTutorialCode =
      null;


    this.stateSubject.next({

      section: 'material',

      step: 1,
      total: 54,

      selectors: [
        '#tuto-material-add-button'
      ],

      title:
        'Créer une fiche',

      description:
        'Cliquez sur « Ajouter une fiche de matériel récolté » pour commencer.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialFormStep(): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 2,
      total: 54,

      selectors: [
        '#tuto-material-code',
        '#tuto-material-type'
      ],

      title:
        'Renseigner les champs obligatoires',

      description:
        'Les champs obligatoires du tutoriel sont préremplis avec « test » et « Plante entière ». Vous pouvez modifier le numéro de récolte, par exemple « test57 ».',

      placement:
        'bottom',

      showNext:
        true,

      canNext:
        false

    });
  }


  setCanContinue(
    canContinue: boolean
  ): void {

    const current =
      this.currentState;


    if (
      !current ||
      current.section !== 'material' ||
      current.step !== 2
    ) {
      return;
    }


    if (
      current.canNext ===
      canContinue
    ) {
      return;
    }


    this.stateSubject.next({
      ...current,

      canNext:
        canContinue
    });
  }


  next(): void {

    const current =
      this.currentState;


    if (
      !current ||
      current.section !== 'material'
    ) {
      return;
    }


    switch (current.step) {

      case 2:
        if (current.canNext) {
          this.showMaterialSaveStep();
        }
        break;

      case 5:
        if (current.canNext) {
          this.showMaterialCreatedRowStep();
        }
        break;

      case 7:
        if (current.canNext) {
          this.showMaterialWorkflowTabsStep();
        }
        break;

      case 8:
        if (current.canNext) {
          this.showMaterialActionsStep();
        }
        break;

      case 14:
        if (current.canNext) {
          this.showMaterialDetailsBackStep();
        }
        break;

      case 21:
        if (current.canNext) {
          this.showStorageTabStep();
        }
        break;

      case 23:
        if (current.canNext) {
          this.showStoragePlacesStep();
        }
        break;

      case 24:
        if (current.canNext) {
          this.showStorageAddStep();
        }
        break;

      case 27:
        if (current.canNext) {
          this.showGerminationTabStep();
        }
        break;

      case 46:
        if (current.canNext) {
          this.showCultureAddActionStep();
        }
        break;

      case 52:
        if (current.canNext) {
          this.showOtherActionsInfoStep();
        }
        break;

      case 53:
        if (current.canNext) {
          this.showTutorialCompleteStep();
        }
        break;

      case 54:
        if (current.canNext) {
          this.complete();
        }
        break;

    }
  }


  showMaterialSaveStep(): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 3,
      total: 54,

      selectors: [
        '#tuto-material-save-button'
      ],

      title:
        'Enregistrer la fiche',

      description:
        'Cliquez sur « Enregistrer » pour poursuivre.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialConfirmStep(): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 4,
      total: 54,

      selectors: [
        '#tuto-material-confirm-save-button'
      ],

      title:
        'Confirmer l’enregistrement',

      description:
        'Cliquez sur « Oui » pour confirmer et enregistrer le matériel récolté.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialTableStep(
    materialCode: string
  ): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.materialTutorialCode =
      String(
        materialCode || ''
      ).trim();


    this.stateSubject.next({

      section: 'material',

      step: 5,
      total: 54,

      selectors: [
        '#matlist-container'
      ],

      title:
        'Comprendre le tableau',

      description:
        '• N° récolte : identifiant du matériel récolté.\n' +
        '• Taxons : taxon(s) associé(s).\n' +
        '• Matériel végétal : nature du matériel récolté.\n' +
        '• N° banque culturale : référence de banque culturale lorsqu’elle existe.\n' +
        '• N° récolte parent : récolte d’origine associée lorsqu’elle existe.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showMaterialCreatedRowStep(): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 6,
      total: 54,

      selectors: [
        '#tuto-material-created-row'
      ],

      title:
        'Sélectionner le matériel créé',

      description:
        this.materialTutorialCode
          ? `Cliquez sur la ligne « ${this.materialTutorialCode} » que vous venez de créer.`
          : 'Cliquez sur la ligne du matériel que vous venez de créer.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialAvailabilityStep(): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 7,
      total: 54,

      selectors: [
        '#tuto-seed-tab',
        '#tuto-stock-tab'
      ],

      title:
        'Pourquoi ces onglets sont indisponibles ?',

      description:
        'Semence : indisponible car une fiche Semence nécessite un matériel de type Graine avec au moins un taxon. Ici, le taxon est NULL et le matériel est « Plante entière ».\n\n' +
        'Stockage : indisponible car « Plante entière » ne fait pas partie des 4 types stockables : Graine, Spore, Mélange de graine et Prélèvement de sol.',

      placement:
        'bottom',

      showNext:
        true,

      canNext:
        true

    });
  }


  showMaterialWorkflowTabsStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 8,
      total: 54,

      selectors: [
        '#tuto-germination-tab',
        '#tuto-sowing-tab',
        '#tuto-viability-tab',
        '#tuto-culture-tab'
      ],

      title:
        'Les autres suivis du matériel',

      description:
        'Test de germination : permet de suivre les tests de germination associés au matériel sélectionné.\n\n' +
        'Semis : permet de suivre les semis associés au matériel.\n\n' +
        'Test de Viabilité : permet de suivre les contrôles de viabilité associés au matériel.\n\n' +
        'Culture : permet de suivre la mise en culture et les actions réalisées sur le matériel sélectionné.',

      placement:
        'bottom',

      showNext:
        true,

      canNext:
        true

    });
  }


  showMaterialActionsStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 9,
      total: 54,

      selectors: [
        '#tuto-material-action-button'
      ],

      title:
        'Ouvrir les actions',

      description:
        this.materialTutorialCode
          ? `Cliquez sur le bouton d’actions de « ${this.materialTutorialCode} ».`
          : 'Cliquez sur le bouton d’actions du matériel créé.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialEditActionStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 10,
      total: 54,

      selectors: [
        '#tuto-material-edit-button'
      ],

      title:
        'Modifier le matériel',

      description:
        'Cliquez sur « Modifier » pour compléter le matériel créé pendant le tutoriel.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialEditFormStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 11,
      total: 54,

      selectors: [
        '#tuto-material-taxon',
        '#tuto-material-type',
        '#tuto-material-save-button'
      ],

      title:
        'Activer Semence et Stockage',

      description:
        'Le type « Graine » est prérempli. Un taxon réel déjà présent dans la récolte est également repris automatiquement lorsqu’il est disponible. Sinon, sélectionnez un taxon. Puis cliquez sur « Enregistrer ».',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialEditConfirmStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 11,
      total: 54,

      selectors: [
        '#tuto-material-confirm-save-button'
      ],

      title:
        'Confirmer la modification',

      description:
        'Cliquez sur « Oui » pour enregistrer le taxon et le type Graine.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialActionsAgainStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 12,
      total: 54,

      selectors: [
        '#tuto-material-action-button'
      ],

      title:
        'Rouvrir les actions',

      description:
        'Le matériel a été complété. Ouvrez de nouveau son menu d’actions.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialDetailsActionStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 13,
      total: 54,

      selectors: [
        '#tuto-material-details-button'
      ],

      title:
        'Ouvrir Détails/Action',

      description:
        'Cliquez sur « Détails/Action » pour consulter la fiche détaillée du matériel.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialDetailsStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 14,
      total: 54,

      selectors: [
        '#tuto-material-details-page'
      ],

      title:
        'Découvrir la fiche détaillée',

      description:
        'Vous pouvez faire défiler librement cette page de haut en bas.\n\n' +
        'Elle présente l’identification du matériel récolté, les informations d’échantillonnage et de phénologie, puis les informations complémentaires.\n\n' +
        'Le bandeau supérieur rappelle également le N° de récolte et donne accès à la suppression du matériel.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showMaterialDetailsBackStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 15,
      total: 54,

      selectors: [
        '#tuto-material-details-back'
      ],

      title:
        'Retour aux matériels récoltés',

      description:
        'Cliquez sur « Retour » pour revenir à la liste des matériels récoltés.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialActionsForSeedStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 16,
      total: 54,

      selectors: [
        '#tuto-material-action-button'
      ],

      title:
        'Ouvrir les actions',

      description:
        this.materialTutorialCode
          ? `Ouvrez de nouveau les actions de « ${this.materialTutorialCode} ».`
          : 'Ouvrez de nouveau les actions du matériel créé.',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showMaterialSeedDetailsActionStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 17,
      total: 54,

      selectors: [
        '#tuto-material-seed-details-button'
      ],

      title:
        'Ouvrir Détails semence',

      description:
        'Le matériel possède maintenant un taxon et est de type Graine. Cliquez sur « Détails semence ».',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showSeedDetailsStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 18,
      total: 54,

      selectors: [
        '#tuto-seed-add-button'
      ],

      title:
        'Créer une fiche de Semence',

      description:
        'Cliquez sur « Ajouter une fiche de Semence » pour créer la fiche associée au matériel.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showSeedFormStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 19,
      total: 54,

      selectors: [
        '#tuto-seed-total-mass',
        '#tuto-seed-sample-mass',
        '#tuto-seed-sample-count',
        '#tuto-seed-total-count',
        '#tuto-seed-save-button'
      ],

      title:
        'Calculer le nombre total de graines',

      description:
        'La fiche de test est préremplie avec : Masse totale = 100 g, Masse des graines échantillonnées = 10 g et Nombre de graines échantillonnées = 50.\n\n' +
        'Le calcul est automatique :\n' +
        'Nombre total = (Nombre échantillonné × Masse totale) / Masse échantillonnée.\n\n' +
        'Ici : (50 × 100) / 10 = 500 graines.\n\n' +
        'Cliquez ensuite sur « Enregistrer ».',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showSeedConfirmStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 20,
      total: 54,

      selectors: [
        '#tuto-seed-confirm-save-button'
      ],

      title:
        'Confirmer la fiche de Semence',

      description:
        'Cliquez sur « Oui » pour confirmer l’enregistrement de la fiche de Semence.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showSeedSummaryStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 21,
      total: 54,

      selectors: [
        '.seed-details-left-panel'
      ],

      title:
        'Comprendre la fiche de Semence',

      description:
        'Cette partie regroupe les caractéristiques morphologiques du lot, sa masse, son échantillonnage et les informations complémentaires.\n\n' +
        'Dans notre exemple : Masse totale = 100 g, 50 graines échantillonnées pour 10 g et Nombre total de graines calculé = 500.\n\n' +
        'La vue d’ensemble reprend les informations essentielles : 500 graines estimées, 100 g de masse totale et aucune photo.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showStorageTabStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 22,
      total: 54,

      selectors: [
        '#tuto-stock-tab'
      ],

      title:
        'Ouvrir le Stockage',

      description:
        'Cliquez maintenant sur l’onglet « Stockage ».',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showStorageSummaryStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 23,
      total: 54,

      selectors: [
        '.stock-summary-card'
      ],

      title:
        'Comprendre la synthèse des quantités',

      description:
        'La quantité initiale globale est de 500 graines : elle provient de la fiche de Semence créée précédemment.\n\n' +
        'La quantité actuelle globale est également de 500 graines car aucun mouvement de stockage, déplacement ou déstockage n’a encore diminué le lot.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showStoragePlacesStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 24,
      total: 54,

      selectors: [
        '.stock-actions-grid'
      ],

      title:
        'Les quatre lieux de stockage',

      description:
        'Les actions sont réparties entre quatre lieux : Salle de pré-séchage, Salle de séchage, Chambre froide et Congélateur.\n\n' +
        'Pour le moment aucune action n’est enregistrée dans ces différents lieux.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showStorageAddStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 25,
      total: 54,

      selectors: [
        '.stock-list-add-button'
      ],

      title:
        'Créer une fiche de Stockage',

      description:
        'Cliquez sur « Ajouter une fiche de stockage ».',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showStorageFormStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 26,
      total: 54,

      selectors: [
        '.stock-form-card'
      ],

      title:
        'Créer le stockage initial',

      description:
        'La fiche est préremplie avec le type d’action « Stockage initial » et le lieu « Salle de pré-séchage ».\n\n' +
        'La quantité reprend automatiquement les 500 graines de la fiche de Semence et les dates sont préremplies pour permettre l’enregistrement.\n\n' +
        'Cliquez sur « Enregistrer », puis confirmez avec « Oui ».',

      placement:
        'top',

      showNext:
        false,

      canNext:
        false

    });
  }


  showStorageConfirmStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 26,
      total: 54,

      selectors: [
        '#tuto-stock-confirm-save-button'
      ],

      title:
        'Confirmer le stockage initial',

      description:
        'Cliquez sur « Oui » pour enregistrer le stockage initial.',

      placement:
        'bottom',

      showNext:
        false,

      canNext:
        false

    });
  }


  showStorageSummaryAfterStep(): void {

    if (!this.isMaterialTutorialActive()) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step: 27,
      total: 54,

      selectors: [
        '.stock-summary-card'
      ],

      title:
        'Le stockage initial est enregistré',

      description:
        'La synthèse reste à 500 graines initiales et 500 graines disponibles.\n\n' +
        'C’est normal : le stockage initial enregistre le lot dans la Salle de pré-séchage mais ne retire aucune graine. Aucun déstockage ou déplacement n’a encore été effectué.\n\n' +
        'L’action de stockage initial est maintenant enregistrée dans la Salle de pré-séchage.',

      placement:
        'top',

      showNext:
        true,

      canNext:
        true

    });
  }


  showGerminationTabStep(): void {
    this.setStep(
      28,
      ['#tuto-germination-tab'],
      'Ouvrir le Test de germination',
      'Cliquez sur l’onglet « Test de germination ».',
      'bottom',
      false
    );
  }


  showGerminationAddStep(): void {
    this.setStep(
      29,
      ['.germination-add-button'],
      'Créer un test de germination',
      'Cliquez sur « Ajouter une fiche de germination ».',
      'bottom',
      false
    );
  }


  showGerminationFormStep(): void {
    this.setStep(
      30,
      ['.germination-form-card'],
      'Créer TG-test',
      'La fiche est préremplie avec « TG-test », 50 graines, 1 réplicat ainsi qu’un support et un substrat. Cliquez sur « Enregistrer ».',
      'top',
      false
    );
  }


  showGerminationConfirmStep(): void {
    this.setStep(
      31,
      ['#tuto-germination-confirm-save-button'],
      'Confirmer TG-test',
      'Cliquez sur « Oui » pour créer le test de germination.',
      'bottom',
      false
    );
  }


  showSemisTabStep(): void {
    this.setStep(
      32,
      ['#tuto-sowing-tab'],
      'Ouvrir Semis',
      'Cliquez sur l’onglet « Semis ».',
      'bottom',
      false
    );
  }


  showSemisAddStep(): void {
    this.setStep(
      33,
      ['.semis-list-header .gray-button'],
      'Créer un Semis',
      'Cliquez sur « Ajouter une fiche de semis ».',
      'bottom',
      false
    );
  }


  showSemisFormStep(): void {
    this.setStep(
      34,
      ['.semis-form-card'],
      'Créer S-test',
      'La fiche est préremplie avec « S-test » et les valeurs obligatoires nécessaires. Cliquez sur « Enregistrer ».',
      'top',
      false
    );
  }


  showSemisConfirmStep(): void {
    this.setStep(
      35,
      ['#tuto-semis-confirm-save-button'],
      'Confirmer le Semis',
      'Cliquez sur « Oui » pour créer S-test.',
      'bottom',
      false
    );
  }


  showViabilityTabStep(): void {
    this.setStep(
      36,
      ['#tuto-viability-tab'],
      'Ouvrir le Test de Viabilité',
      'Cliquez sur l’onglet « Test de Viabilité ».',
      'bottom',
      false
    );
  }


  showViabilityAddStep(): void {
    this.setStep(
      37,
      ['.viability-add-button'],
      'Créer un test de viabilité',
      'Cliquez sur « Ajouter une fiche de viabilité ».',
      'bottom',
      false
    );
  }


  showViabilityFormStep(): void {
    this.setStep(
      38,
      ['.viability-form-card'],
      'Créer TV-test',
      'La fiche est préremplie avec « TV-test » et les valeurs nécessaires. Cliquez sur « Enregistrer ».',
      'top',
      false
    );
  }


  showViabilityConfirmStep(): void {
    this.setStep(
      39,
      ['#tuto-viability-confirm-save-button'],
      'Confirmer TV-test',
      'Cliquez sur « Oui » pour créer le test de viabilité.',
      'bottom',
      false
    );
  }


  showCultureTabStep(): void {
    this.setStep(
      40,
      ['#tuto-culture-tab'],
      'Ouvrir Culture',
      'Cliquez sur l’onglet « Culture ».',
      'bottom',
      false
    );
  }


  showCultureAddStep(): void {
    this.setStep(
      41,
      ['.culture-add-button'],
      'Créer une Culture',
      'Cliquez sur « Ajouter une fiche de culture ».',
      'bottom',
      false
    );
  }


  showCultureFormStep(): void {
    this.setStep(
      42,
      ['.culture-form-card'],
      'Créer C-test',
      'La Culture est créée directement depuis le Matériel récolté.\n\nN° de semis associé : Aucun.\nN° de test de germination associé : Aucun.\n\nLa fiche « C-test » est préremplie. Cliquez sur « Enregistrer ».',
      'top',
      false
    );
  }


  showCultureConfirmStep(): void {
    this.setStep(
      43,
      ['#tuto-culture-confirm-save-button'],
      'Confirmer C-test',
      'Cliquez sur « Oui » pour créer la Culture.',
      'bottom',
      false
    );
  }


  showCultureActionsStep(
    cultureCode: string = 'C-test'
  ): void {

    this.cultureTutorialCode =
      String(
        cultureCode || 'C-test'
      ).trim();


    this.setStep(
      44,
      [
        '.culture-actions-cell .actions-trigger-red'
      ],
      'Ouvrir les actions de C-test',
      'Cliquez sur le bouton Actions de la Culture créée pendant le tutoriel.',
      'top',
      false
    );
  }


  showCultureDetailsMenuStep(): void {
    this.setStep(
      45,
      [
        '.mat-menu-item',
        '.mat-mdc-menu-item'
      ],
      'Ouvrir Détails/Action',
      'Cliquez sur « Détails/Action ».',
      'top',
      false
    );
  }


  showCultureActionsListStep(): void {
    this.setStep(
      46,
      ['.culture-actions-panel'],
      'Liste des actions de Culture',
      'Cette liste centralise toutes les interventions réalisées sur la Culture : type d’action, dates, agent et accès aux détails.\n\nNous allons maintenant créer la première action.',
      'top',
      true
    );
  }


  showCultureAddActionStep(): void {
    this.setStep(
      47,
      ['.culture-add-action-button'],
      'Ajouter une action',
      'Cliquez sur « Ajouter une action ».',
      'bottom',
      false
    );
  }


  showCultureActionFormStep(): void {
    this.setStep(
      48,
      ['.culture-action-form'],
      'Transplantation obligatoire au démarrage',
      'Pour la première action, le Type d’action est automatiquement « Transplantation ».\n\nLe Type de transplantation est obligatoire pour cette transplantation initiale.\n\nSi la Culture possède un id_semis ou un id_germination, seul « Repiquage » est proposé.\n\nSi id_semis et id_germination sont tous les deux NULL, les possibilités sont « Rempotage » ou « Plantation ».\n\nUne valeur compatible est préremplie ici. Cliquez sur « Enregistrer ».',
      'top',
      false
    );
  }


  showCultureActionConfirmStep(): void {
    this.setStep(
      49,
      ['#tuto-culture-confirm-save-button'],
      'Confirmer la Transplantation',
      'Cliquez sur « Oui » pour enregistrer cette première action de Culture.',
      'bottom',
      false
    );
  }


  showCultureActionMenuStep(): void {
    this.setStep(
      50,
      ['.culture-actions-trigger-red'],
      'Ouvrir les actions de la Transplantation',
      'Cliquez sur le bouton Actions de la ligne Transplantation.',
      'top',
      false
    );
  }


  showCultureActionDetailsMenuStep(): void {
    this.setStep(
      51,
      [
        '.mat-menu-item',
        '.mat-mdc-menu-item'
      ],
      'Ouvrir le détail de l’action',
      'Cliquez sur « Détails ».',
      'top',
      false
    );
  }


  showCultureActionDetailsStep(): void {
    this.setStep(
      52,
      ['.culture-action-details-card'],
      'Détail de l’action',
      'Cette fiche détaille la Transplantation : type d’action, dates et paramètres propres à l’intervention. Elle permet de retrouver précisément ce qui a été réalisé sur la Culture.',
      'top',
      true
    );
  }


  showOtherActionsInfoStep(): void {
    this.setStep(
      53,
      [
        '#tuto-germination-tab',
        '#tuto-sowing-tab',
        '#tuto-viability-tab'
      ],
      'Les Actions existent aussi ailleurs',
      'Le même principe d’Actions est disponible dans Test de germination, Semis et Test de Viabilité. Chaque partie possède sa liste d’actions et les informations adaptées à son suivi.',
      'bottom',
      true
    );
  }


  showTutorialCompleteStep(): void {
    this.setStep(
      54,
      ['#tuto-culture-tab'],
      'Tutoriel terminé ! 🎉',
      'Félicitations ! Vous avez parcouru le fonctionnement principal du module Ex situ : Matériel récolté, Semence, Stockage, Test de germination, Semis, Test de Viabilité, Culture et Actions.',
      'bottom',
      true
    );
  }


  private setStep(
    step: number,
    selectors: string[],
    title: string,
    description: string,
    placement: TutoPlacement,
    showNext: boolean
  ): void {

    if (
      !this.isMaterialTutorialActive()
    ) {
      return;
    }


    this.stateSubject.next({

      section: 'material',

      step,
      total: 54,

      selectors,

      title,
      description,

      placement,

      showNext,
      canNext: showNext

    });
  }


  complete(): void {

    this.materialTutorialCode =
      null;

    this.cultureTutorialCode =
      null;

    this.stateSubject.next(
      null
    );
  }

}