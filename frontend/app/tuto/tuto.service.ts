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
      total: 20,

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
      total: 20,

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


    if (
      current.step === 2 &&
      current.canNext
    ) {

      this.showMaterialSaveStep();

      return;
    }


    if (
      current.step === 5 &&
      current.canNext
    ) {

      this.showMaterialCreatedRowStep();

      return;
    }


    if (
      current.step === 7 &&
      current.canNext
    ) {

      this.showMaterialWorkflowTabsStep();

      return;
    }


    if (
      current.step === 8 &&
      current.canNext
    ) {

      this.showMaterialActionsStep();

      return;
    }


    if (
      current.step === 14 &&
      current.canNext
    ) {

      this.showMaterialDetailsBackStep();

      return;
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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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
      total: 20,

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


  complete(): void {

    this.materialTutorialCode =
      null;

    this.stateSubject.next(
      null
    );
  }

}