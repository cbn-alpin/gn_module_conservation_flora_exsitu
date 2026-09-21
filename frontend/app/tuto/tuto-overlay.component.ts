import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  TutoService,
  TutoStepState
} from './tuto.service';

import {
  TUTO_IMAGE_2_DATA_URL
} from './tuto-images';


interface TutoTargetRect {

  top: number;
  left: number;

  width: number;
  height: number;

  right: number;
  bottom: number;

}


@Component({
  selector: 'app-tuto-overlay',
  templateUrl: './tuto-overlay.component.html',
  styleUrls: ['./tuto-overlay.component.scss']
})
export class TutoOverlayComponent
  implements OnInit, AfterViewInit, OnDestroy {

  readonly tutoImageDataUrl =
    TUTO_IMAGE_2_DATA_URL;


  state:
    TutoStepState | null =
      null;


  targetRect:
    TutoTargetRect | null =
      null;


  private stateSubscription:
    Subscription | null =
      null;


  private refreshTimer:
    any = null;


  private lastScrolledStep =
    '';


  private readonly cardWidth =
    370;


  private readonly cardHeight =
    310;


  private readonly viewportMargin =
    16;


  private pageScrollLocked =
    false;


  private previousHtmlOverflow =
    '';


  private previousBodyOverflow =
    '';


  private readonly documentClickCaptureHandler =
    (event: Event) => {
      this.handleTutorialTargetClick(
        event
      );
    };


  constructor(
    public tutoService:
      TutoService,

    private hostRef:
      ElementRef<HTMLElement>
  ) {}


  ngOnInit(): void {

    this.stateSubscription =
      this.tutoService
        .state$
        .subscribe(
          (
            state:
              TutoStepState | null
          ) => {

            this.state =
              state;

            this.targetRect =
              null;

            this.lastScrolledStep =
              '';


            this.updatePageScrollLock(
              state
            );


            this.stopRefresh();


            if (!state) {
              return;
            }


            setTimeout(
              () => {
                this.refreshTarget();
              }
            );


            this.refreshTimer =
              window.setInterval(
                () => {
                  this.refreshTarget();
                },
                100
              );

          }
        );
  }


  /*
   * IMPORTANT :
   * on sort physiquement le tutoriel de la page Ex situ
   * et on le place directement dans <body>.
   *
   * Il peut ainsi passer AU-DESSUS des MatDialog Angular.
   */
  ngAfterViewInit(): void {

    const host =
      this.hostRef.nativeElement;


    if (
      host.parentElement !==
      document.body
    ) {

      document.body
        .appendChild(host);

    }


    document.addEventListener(
      'click',
      this.documentClickCaptureHandler,
      true
    );
  }


  ngOnDestroy(): void {

    this.stopRefresh();

    this.restorePageScroll();


    document.removeEventListener(
      'click',
      this.documentClickCaptureHandler,
      true
    );


    this.stateSubscription
      ?.unsubscribe();


    const host =
      this.hostRef.nativeElement;


    if (
      host.parentElement ===
      document.body
    ) {

      host.remove();

    }
  }


  /*
   * Quand une fenêtre Angular Material est utilisée
   * pendant le tutoriel, seule cette fenêtre doit
   * pouvoir défiler.
   *
   * Cela évite d'avoir deux barres verticales
   * utilisables simultanément à droite.
   */
  private updatePageScrollLock(
    state:
      TutoStepState | null
  ): void {

    const lockSteps =
      [
        2,
        3,
        4,
        11,
        19,
        20,
        26,
        30,
        31,
        34,
        35,
        38,
        39,
        42,
        43,
        48,
        49
      ];


    const mustLock =
      !!state &&
      lockSteps.includes(
        state.step
      );


    if (
      mustLock &&
      !this.pageScrollLocked
    ) {

      this.previousHtmlOverflow =
        document.documentElement
          .style
          .overflow;


      this.previousBodyOverflow =
        document.body
          .style
          .overflow;


      document.documentElement
        .style
        .overflow =
          'hidden';


      document.body
        .style
        .overflow =
          'hidden';


      this.pageScrollLocked =
        true;

      return;
    }


    if (
      !mustLock
    ) {

      this.restorePageScroll();

    }
  }


  private restorePageScroll(): void {

    if (!this.pageScrollLocked) {
      return;
    }


    document.documentElement
      .style
      .overflow =
        this.previousHtmlOverflow;


    document.body
      .style
      .overflow =
        this.previousBodyOverflow;


    this.pageScrollLocked =
      false;
  }


  private handleTutorialTargetClick(
    event: Event
  ): void {

    if (!this.state) {
      return;
    }


    const target =
      event.target as HTMLElement | null;


    if (!target) {
      return;
    }


    const step =
      this.state.step;


    if (
      step === 28 &&
      target.closest(
        '#tuto-germination-tab'
      )
    ) {

      this.tutoService
        .showGerminationAddStep();

    } else if (
      step === 29 &&
      target.closest(
        '.germination-add-button'
      )
    ) {

      this.tutoService
        .showGerminationFormStep();

    } else if (
      step === 32 &&
      target.closest(
        '#tuto-sowing-tab'
      )
    ) {

      this.tutoService
        .showSemisAddStep();

    } else if (
      step === 33 &&
      target.closest(
        '.semis-list-header .gray-button'
      )
    ) {

      this.tutoService
        .showSemisFormStep();

    } else if (
      step === 36 &&
      target.closest(
        '#tuto-viability-tab'
      )
    ) {

      this.tutoService
        .showViabilityAddStep();

    } else if (
      step === 37 &&
      target.closest(
        '.viability-add-button'
      )
    ) {

      this.tutoService
        .showViabilityFormStep();

    } else if (
      step === 40 &&
      target.closest(
        '#tuto-culture-tab'
      )
    ) {

      this.tutoService
        .showCultureAddStep();

    } else if (
      step === 41 &&
      target.closest(
        '.culture-add-button'
      )
    ) {

      this.tutoService
        .showCultureFormStep();

    } else if (
      step === 44 &&
      target.closest(
        '.actions-trigger-red'
      )
    ) {

      const row =
        target.closest('tr');


      const code =
        String(
          row
            ?.querySelector('td')
            ?.textContent || ''
        )
          .trim()
          .toLowerCase();


      const expected =
        String(
          this.tutoService
            .tutorialCultureCode || ''
        )
          .trim()
          .toLowerCase();


      if (
        expected &&
        code === expected
      ) {

        this.tutoService
          .showCultureDetailsMenuStep();

      }

    } else if (
      step === 45
    ) {

      const item =
        target.closest(
          '.mat-menu-item, .mat-mdc-menu-item'
        );


      if (
        item &&
        String(
          item.textContent || ''
        ).includes(
          'Détails/Action'
        )
      ) {

        this.tutoService
          .showCultureActionsListStep();

      }

    } else if (
      step === 47 &&
      target.closest(
        '.culture-add-action-button'
      )
    ) {

      this.tutoService
        .showCultureActionFormStep();

    } else if (
      step === 50 &&
      target.closest(
        '.culture-actions-trigger-red'
      )
    ) {

      this.tutoService
        .showCultureActionDetailsMenuStep();

    } else if (
      step === 51
    ) {

      const item =
        target.closest(
          '.mat-menu-item, .mat-mdc-menu-item'
        );


      if (
        item &&
        String(
          item.textContent || ''
        )
          .trim()
          .includes('Détails')
      ) {

        this.tutoService
          .showCultureActionDetailsStep();

      }
    }
  }


  private stopRefresh(): void {

    if (
      this.refreshTimer !==
      null
    ) {

      clearInterval(
        this.refreshTimer
      );

      this.refreshTimer =
        null;

    }
  }


  private refreshTarget(): void {

    if (!this.state) {
      return;
    }


    let elements =
      this.state
        .selectors
        .map(
          selector =>
            document.querySelector(
              selector
            ) as HTMLElement | null
        )
        .filter(
          (
            element
          ): element is HTMLElement =>
            !!element
        );


    /*
     * ÉTAPE 6 :
     * retrouver directement la ligne correspondant
     * au matériel réellement créé pendant le tutoriel.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 6
    ) {

      const tutorialCode =
        String(
          this.tutoService
            .tutorialMaterialCode || ''
        )
          .trim()
          .toLowerCase();


      const rows =
        Array.from(
          document.querySelectorAll(
            '#tuto-material-table tbody tr'
          )
        ) as HTMLElement[];


      const createdRow =
        rows.find(
          row => {

            const firstCell =
              row.querySelector('td');


            const rowCode =
              String(
                firstCell?.textContent || ''
              )
                .trim()
                .toLowerCase();


            return (
              !!tutorialCode &&
              rowCode === tutorialCode
            );
          }
        );


      if (createdRow) {

        elements = [
          createdRow
        ];

      }
    }


    /*
     * ÉTAPE 44 :
     * retrouver précisément C-test
     * puis son bouton Actions.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 44
    ) {

      const expected =
        String(
          this.tutoService
            .tutorialCultureCode || ''
        )
          .trim()
          .toLowerCase();


      const rows =
        Array.from(
          document.querySelectorAll(
            '.culture-list-table tbody tr'
          )
        ) as HTMLElement[];


      const row =
        rows.find(
          item =>
            String(
              item
                .querySelector('td')
                ?.textContent || ''
            )
              .trim()
              .toLowerCase() ===
            expected
        );


      const button =
        row?.querySelector(
          '.actions-trigger-red'
        ) as HTMLElement | null;


      if (button) {
        elements = [button];
      }
    }


    /*
     * ÉTAPES 45 ET 51 :
     * les menus Angular sont créés dynamiquement.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 45 ||
        this.state.step === 51
      )
    ) {

      const expectedText =
        this.state.step === 45
          ? 'Détails/Action'
          : 'Détails';


      const menuItems =
        Array.from(
          document.querySelectorAll(
            '.mat-menu-item, .mat-mdc-menu-item'
          )
        ) as HTMLElement[];


      const item =
        menuItems.find(
          button =>
            String(
              button.textContent || ''
            )
              .trim()
              .includes(
                expectedText
              )
        );


      if (item) {
        elements = [item];
      }
    }


    if (
      elements.length === 0
    ) {

      this.targetRect =
        null;

      return;
    }


    const stepKey =
      `${this.state.section}-${this.state.step}`;


    /*
     * ÉTAPE 5 :
     *
     * On attend d'abord que les MatDialog
     * de création / confirmation soient réellement fermés.
     *
     * Ensuite le tableau complet est positionné
     * UNE SEULE FOIS.
     *
     * Très important :
     * après ce positionnement automatique,
     * on ne force plus le scroll.
     * L'utilisateur peut donc faire défiler librement
     * le tableau jusqu'au paginator.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 5
    ) {

      const openDialog =
        document.querySelector(
          '.mat-mdc-dialog-container, .mat-dialog-container'
        );


      if (openDialog) {

        this.targetRect =
          null;

        return;
      }


      if (
        this.lastScrolledStep !==
        stepKey
      ) {

        this.lastScrolledStep =
          stepKey;


        elements[0]
          .scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });


        window.setTimeout(
          () => {
            this.refreshTarget();
          },
          450
        );

      }

    } else if (
      this.state.section ===
        'material' &&
      this.state.step === 14
    ) {

      if (
        this.lastScrolledStep !==
        stepKey
      ) {

        this.lastScrolledStep =
          stepKey;


        elements[0]
          .scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });


        window.setTimeout(
          () => {
            this.refreshTarget();
          },
          450
        );

      }

    } else if (
      this.state.section ===
        'material' &&
      this.state.step === 46
    ) {

      /*
       * La page Culture se replace parfois en haut
       * pendant la navigation.
       *
       * On attend donc que la page soit chargée,
       * puis on centre réellement la liste des actions.
       * Ensuite l'utilisateur peut scroller librement.
       */
      if (
        this.lastScrolledStep !==
        stepKey
      ) {

        this.lastScrolledStep =
          stepKey;


        window.setTimeout(
          () => {

            if (
              this.state?.section !==
                'material' ||
              this.state?.step !==
                46
            ) {
              return;
            }


            const actionsList =
              document.querySelector(
                '.culture-actions-content'
              ) as HTMLElement | null;


            actionsList
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });


            window.setTimeout(
              () => {
                this.refreshTarget();
              },
              450
            );

          },
          500
        );

      }

    } else if (
      this.lastScrolledStep !==
      stepKey
    ) {

      this.lastScrolledStep =
        stepKey;


      elements[0]
        .scrollIntoView({
          behavior: 'smooth',

          block:
            this.state.step === 6
              ? 'end'
              : 'center',

          inline: 'center'
        });


      window.setTimeout(
        () => {
          this.refreshTarget();
        },
        450
      );

    }


    /*
     * La position du cadre continue d'être recalculée
     * pendant le scroll.
     *
     * Mais ici on ne déplace plus la page.
     */
    const rects =
      elements.map(
        element =>
          element.getBoundingClientRect()
      );


    const padding =
      10;


    const top =
      Math.max(
        0,
        Math.min(
          ...rects.map(
            rect =>
              rect.top
          )
        ) - padding
      );


    const left =
      Math.max(
        0,
        Math.min(
          ...rects.map(
            rect =>
              rect.left
          )
        ) - padding
      );


    const right =
      Math.min(
        window.innerWidth,
        Math.max(
          ...rects.map(
            rect =>
              rect.right
          )
        ) + padding
      );


    const bottom =
      Math.min(
        window.innerHeight,
        Math.max(
          ...rects.map(
            rect =>
              rect.bottom
          )
        ) + padding
      );


    this.targetRect = {

      top,
      left,

      width:
        Math.max(
          0,
          right - left
        ),

      height:
        Math.max(
          0,
          bottom - top
        ),

      right,
      bottom

    };
  }


  private clamp(
    value: number,
    min: number,
    max: number
  ): number {

    return Math.max(
      min,
      Math.min(
        value,
        max
      )
    );
  }


  get topBlockStyle(): any {

    if (!this.targetRect) {
      return {};
    }


    return {

      top:
        '0px',

      left:
        '0px',

      width:
        '100vw',

      height:
        `${this.targetRect.top}px`

    };
  }


  get bottomBlockStyle(): any {

    if (!this.targetRect) {
      return {};
    }


    return {

      top:
        `${this.targetRect.bottom}px`,

      left:
        '0px',

      width:
        '100vw',

      height:
        `${
          Math.max(
            0,
            window.innerHeight -
            this.targetRect.bottom
          )
        }px`

    };
  }


  get leftBlockStyle(): any {

    if (!this.targetRect) {
      return {};
    }


    return {

      top:
        `${this.targetRect.top}px`,

      left:
        '0px',

      width:
        `${this.targetRect.left}px`,

      height:
        `${this.targetRect.height}px`

    };
  }


  get rightBlockStyle(): any {

    if (!this.targetRect) {
      return {};
    }


    return {

      top:
        `${this.targetRect.top}px`,

      left:
        `${this.targetRect.right}px`,

      width:
        `${
          Math.max(
            0,
            window.innerWidth -
            this.targetRect.right
          )
        }px`,

      height:
        `${this.targetRect.height}px`

    };
  }


  get targetStyle(): any {

    if (!this.targetRect) {
      return {};
    }


    return {

      top:
        `${this.targetRect.top}px`,

      left:
        `${this.targetRect.left}px`,

      width:
        `${this.targetRect.width}px`,

      height:
        `${this.targetRect.height}px`

    };
  }


  get cardStyle(): any {

    if (
      !this.targetRect ||
      !this.state
    ) {
      return {};
    }


    const verticalCenter =
      this.clamp(
        this.targetRect.top +
          (
            this.targetRect.height /
            2
          ) -
          (
            this.cardHeight /
            2
          ),
        this.viewportMargin,
        window.innerHeight -
          this.cardHeight -
          this.viewportMargin
      );


    /*
     * ÉTAPE 1 :
     * carte à droite du bouton Ajouter.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 1
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.right + 72,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 2 :
     * carte à droite des champs.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 2
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.right + 60,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 3 :
     * carte à gauche du bouton Enregistrer.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 3
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.left -
                this.cardWidth -
                70,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPES 4, 15, 18 ET 20 :
     *
     * carte à droite de la cible.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 4 ||
        this.state.step === 15 ||
        this.state.step === 18 ||
        this.state.step === 20
      )
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.right + 90,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPES 9, 10, 12, 13, 16 ET 17 :
     *
     * La carte est placée à GAUCHE
     * du bouton ou du menu Actions.
     *
     * La cible reste entièrement visible
     * et cliquable à droite.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 9 ||
        this.state.step === 10 ||
        this.state.step === 12 ||
        this.state.step === 13 ||
        this.state.step === 16 ||
        this.state.step === 17
      )
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.left -
                this.cardWidth -
                80,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 19 :
     *
     * carte encore plus large en haut
     * pour réduire sa hauteur
     * et dégager davantage le formulaire Semence.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 19
    ) {

      const seedCardWidth =
        Math.min(
          1240,
          window.innerWidth - 32
        );


      return {

        width:
          `${seedCardWidth}px`,

        left:
          `${
            (
              window.innerWidth -
              seedCardWidth
            ) / 2
          }px`,

        top:
          '8px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPES 25, 29, 33, 37, 41 ET 47 :
     *
     * même présentation que l'étape 1 :
     * bouton à gauche,
     * carte juste à droite.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 25 ||
        this.state.step === 29 ||
        this.state.step === 33 ||
        this.state.step === 37 ||
        this.state.step === 41 ||
        this.state.step === 47
      )
    ) {

      return {

        left:
          `${
            this.clamp(
              this.targetRect.right + 72,
              this.viewportMargin,
              window.innerWidth -
                this.cardWidth -
                this.viewportMargin
            )
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 21 :
     *
     * carte à droite mais légèrement
     * ramenée vers le centre.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 21
    ) {

      const sideCardWidth =
        Math.min(
          380,
          window.innerWidth - 32
        );


      return {

        width:
          `${sideCardWidth}px`,

        left:
          `${
            window.innerWidth -
            sideCardWidth -
            90
          }px`,

        top:
          '16px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 27 :
     *
     * carte à droite et remontée.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 27
    ) {

      const sideCardWidth =
        Math.min(
          380,
          window.innerWidth - 32
        );


      return {

        width:
          `${sideCardWidth}px`,

        left:
          `${
            window.innerWidth -
            sideCardWidth -
            this.viewportMargin
          }px`,

        top:
          '16px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 46 :
     * carte compacte en haut.
     * La vraie liste des actions est centrée
     * automatiquement dans l'écran.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 46
    ) {

      const actionsListCardWidth =
        Math.min(
          720,
          window.innerWidth - 32
        );


      return {

        width:
          `${actionsListCardWidth}px`,

        left:
          `${
            (
              window.innerWidth -
              actionsListCardWidth
            ) / 2
          }px`,

        top:
          '8px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 48 :
     * carte en haut à gauche.
     *
     * Le formulaire reste libre à droite,
     * notamment la Date de début et
     * son bouton calendrier.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 48
    ) {

      const cultureActionCardWidth =
        Math.min(
          360,
          window.innerWidth - 32
        );


      return {

        width:
          `${cultureActionCardWidth}px`,

        left:
          `${this.viewportMargin}px`,

        top:
          '16px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 52 :
     * carte à gauche,
     * détail de l'action visible à droite.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 52
    ) {

      return {

        left:
          `${this.viewportMargin}px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * Cartes placées à droite
     * pour ne pas masquer
     * les formulaires ou confirmations.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 11 ||
        this.state.step === 23 ||
        this.state.step === 26 ||
        this.state.step === 30 ||
        this.state.step === 31 ||
        this.state.step === 34 ||
        this.state.step === 35 ||
        this.state.step === 38 ||
        this.state.step === 39 ||
        this.state.step === 42 ||
        this.state.step === 43 ||
        this.state.step === 49
      )
    ) {

      const sideCardWidth =
        Math.min(
          this.state.step === 42
            ? 430
            : 380,
          window.innerWidth - 32
        );


      return {

        width:
          `${sideCardWidth}px`,

        left:
          `${
            window.innerWidth -
            sideCardWidth -
            this.viewportMargin
          }px`,

        top:
          `${verticalCenter}px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 5 :
     *
     * carte très large et compacte en haut.
     * Cela libère un maximum de hauteur
     * pour afficher le tableau complet.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 5
    ) {

      const step5CardWidth =
        Math.min(
          960,
          window.innerWidth - 32
        );


      return {

        width:
          `${step5CardWidth}px`,

        left:
          `${
            (
              window.innerWidth -
              step5CardWidth
            ) / 2
          }px`,

        top:
          '8px',

        transform:
          'none'

      };
    }


    /*
     * ÉTAPES 7 ET 8 :
     *
     * carte large sous les onglets présentés.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 7 ||
        this.state.step === 8
      )
    ) {

      const tabsCardWidth =
        Math.min(
          760,
          window.innerWidth - 32
        );


      return {

        width:
          `${tabsCardWidth}px`,

        left:
          `${
            (
              window.innerWidth -
              tabsCardWidth
            ) / 2
          }px`,

        top:
          `${
            Math.min(
              this.targetRect.bottom + 62,
              180
            )
          }px`,

        transform:
          'none'

      };
    }


    /*
     * ÉTAPE 14 :
     *
     * carte compacte en haut de l'écran.
     * La fiche Détails reste visible et scrollable.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 14
    ) {

      const detailsCardWidth =
        Math.min(
          760,
          window.innerWidth - 32
        );


      return {

        width:
          `${detailsCardWidth}px`,

        left:
          `${
            (
              window.innerWidth -
              detailsCardWidth
            ) / 2
          }px`,

        top:
          '10px',

        transform:
          'none'

      };
    }


    const genericCardHeight =
      this.cardHeight;


    const centeredLeft =
      this.clamp(
        this.targetRect.left +
          (
            this.targetRect.width /
            2
          ) -
          (
            this.cardWidth /
            2
          ),
        this.viewportMargin,
        window.innerWidth -
          this.cardWidth -
          this.viewportMargin
      );


    if (
      this.state.placement ===
      'top'
    ) {

      return {

        left:
          `${centeredLeft}px`,

        top:
          `${
            this.clamp(
              this.targetRect.top -
                genericCardHeight -
                64,
              this.viewportMargin,
              window.innerHeight -
                genericCardHeight -
                this.viewportMargin
            )
          }px`,

        transform:
          'none'

      };
    }


    return {

      left:
        `${centeredLeft}px`,

      top:
        `${
          this.clamp(
            this.targetRect.bottom + 64,
            this.viewportMargin,
            window.innerHeight -
              genericCardHeight -
              this.viewportMargin
          )
        }px`,

      transform:
        'none'

    };
  }


  get arrowStyle(): any {

    if (
      !this.targetRect ||
      !this.state
    ) {
      return {};
    }


    /*
     * ÉTAPE 14 :
     * toute la page Détails est présentée.
     * Une flèche n'apporte rien ici.
     */
    if (
      this.state.section ===
        'material' &&
      this.state.step === 14
    ) {

      return {
        display: 'none'
      };

    }


    /*
     * ÉTAPES 1, 2 ET 4 :
     * carte à droite de la cible.
     * La flèche pointe vers la gauche.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 1 ||
        this.state.step === 2 ||
        this.state.step === 4 ||
        this.state.step === 15 ||
        this.state.step === 18 ||
        this.state.step === 20 ||
        this.state.step === 25 ||
        this.state.step === 29 ||
        this.state.step === 33 ||
        this.state.step === 37 ||
        this.state.step === 41 ||
        this.state.step === 47
      )
    ) {

      return {

        left:
          `${this.targetRect.right + 12}px`,

        top:
          `${
            this.targetRect.top +
            (
              this.targetRect.height /
              2
            ) -
            22
          }px`

      };
    }


    /*
     * ÉTAPES 3, 10 ET 13 :
     *
     * la carte est à gauche de la cible.
     * La flèche pointe donc vers la droite.
     */
    if (
      this.state.section ===
        'material' &&
      (
        this.state.step === 3 ||
        this.state.step === 9 ||
        this.state.step === 10 ||
        this.state.step === 12 ||
        this.state.step === 13 ||
        this.state.step === 16 ||
        this.state.step === 17 ||
        this.state.step === 44 ||
        this.state.step === 45 ||
        this.state.step === 50 ||
        this.state.step === 51
      )
    ) {

      return {

        left:
          `${this.targetRect.left - 56}px`,

        top:
          `${
            this.targetRect.top +
            (
              this.targetRect.height /
              2
            ) -
            22
          }px`

      };
    }


    const center =
      this.targetRect.left +
      (
        this.targetRect.width /
        2
      );


    if (
      this.state.placement ===
      'top'
    ) {

      return {

        left:
          `${center - 22}px`,

        top:
          `${
            Math.max(
              4,
              this.targetRect.top - 54
            )
          }px`

      };
    }


    return {

      left:
        `${center - 22}px`,

      top:
        `${this.targetRect.bottom + 10}px`

    };
  }


  get arrowIcon(): string {

    if (
      this.state?.section ===
        'material' &&
      (
        this.state?.step === 1 ||
        this.state?.step === 2 ||
        this.state?.step === 4 ||
        this.state?.step === 15 ||
        this.state?.step === 18 ||
        this.state?.step === 20 ||
        this.state?.step === 25 ||
        this.state?.step === 29 ||
        this.state?.step === 33 ||
        this.state?.step === 37 ||
        this.state?.step === 41 ||
        this.state?.step === 47
      )
    ) {

      return 'arrow_back';
    }


    if (
      this.state?.section ===
        'material' &&
      (
        this.state?.step === 3 ||
        this.state?.step === 9 ||
        this.state?.step === 10 ||
        this.state?.step === 12 ||
        this.state?.step === 13 ||
        this.state?.step === 16 ||
        this.state?.step === 17 ||
        this.state?.step === 44 ||
        this.state?.step === 45 ||
        this.state?.step === 50 ||
        this.state?.step === 51
      )
    ) {

      return 'arrow_forward';
    }


    return (
      this.state?.placement ===
      'top'
    )
      ? 'arrow_downward'
      : 'arrow_upward';
  }


  next(): void {

    this.tutoService.next();
  }


  quit(): void {

    this.tutoService.complete();
  }

}