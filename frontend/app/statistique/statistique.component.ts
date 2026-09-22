import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  StatistiqueService
} from './statistique.service';


interface StatisticDisplay {
  gradient: string;
  caption: string;
  tooltip: string;
  selectedGradient?: string;
}


@Component({
  selector: 'app-statistique',
  templateUrl: './statistique.component.html',
  styleUrls: ['./statistique.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StatistiqueComponent
  implements
    OnInit,
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input()
  public initialFilter:
    'sowing' |
    'germination' |
    'viability' |
    'culture' =
      'sowing';


  /*
   * Toutes les lignes actuellement concernées
   * par les filtres de la liste.
   *
   * Le paginator n'intervient pas ici :
   * dataSource.data contient toutes les lignes
   * filtrées et pas seulement la page affichée.
   */
  @Input()
  public rows: any[] = [];


  @Input()
  public allRows: any[] = [];


  @Input()
  public codeFilter: any = '';


  @Input()
  public dateFilter: any = null;


  @Input()
  public primaryFilter: any = null;


  @Input()
  public secondaryFilter: any = null;


  @Input()
  public tertiaryFilter: any = null;


  @Output()
  public statistiqueClick =
    new EventEmitter<string>();


  public enabled = true;


  private enabledSubscription:
    Subscription | null =
      null;


  private filtersCard:
    HTMLElement | null =
      null;


  private refreshTimer: any = null;


  private distributionIndex = 0;


  private readonly donutPalettes = [
    [
      '#b51657',
      '#1565c0',
      '#2e7d32',
      '#f9a825',
      '#6a1b9a'
    ],
    [
      '#5e35b1',
      '#ef6c00',
      '#00897b',
      '#c62828',
      '#3949ab'
    ],
    [
      '#00695c',
      '#ad1457',
      '#f9a825',
      '#283593',
      '#8d6e63'
    ],
    [
      '#ef6c00',
      '#1565c0',
      '#7b1fa2',
      '#388e3c',
      '#c2185b'
    ],
    [
      '#37474f',
      '#c62828',
      '#2e7d32',
      '#6a1b9a',
      '#f9a825'
    ]
  ];


  constructor(
    private statistiqueService:
      StatistiqueService,

    private elementRef:
      ElementRef<HTMLElement>,

    private renderer:
      Renderer2
  ) {}


  ngOnInit(): void {

    this.enabled =
      this.statistiqueService.enabled;


    this.enabledSubscription =
      this.statistiqueService
        .enabled$
        .subscribe(
          enabled => {

            this.enabled = enabled;

            this.updateStatisticsDisplay(
              enabled
            );

          }
        );
  }


  ngAfterViewInit(): void {

    this.filtersCard =
      this.elementRef.nativeElement.closest(
        [
          '.semis-filters-card',
          '.germination-filters-card',
          '.viability-filters-card',
          '.culture-filters-card'
        ].join(', ')
      );


    this.updateStatisticsDisplay(
      this.enabled
    );


    this.scheduleStatisticsRefresh();
  }


  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['rows'] ||
      changes['allRows'] ||
      changes['codeFilter'] ||
      changes['dateFilter'] ||
      changes['primaryFilter'] ||
      changes['secondaryFilter'] ||
      changes['tertiaryFilter'] ||
      changes['initialFilter']
    ) {

      this.scheduleStatisticsRefresh();

    }
  }


  ngOnDestroy(): void {

    this.enabledSubscription
      ?.unsubscribe();


    if (this.refreshTimer) {

      clearTimeout(
        this.refreshTimer
      );

    }


    if (this.filtersCard) {

      this.renderer.removeClass(
        this.filtersCard,
        'statistique-enabled'
      );

    }
  }


  public onToggle(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.statistiqueService
      .setEnabled(
        input.checked
      );
  }


  public openStatistique(): void {

    if (!this.enabled) {
      return;
    }


    this.statistiqueClick.emit(
      this.initialFilter
    );
  }


  private updateStatisticsDisplay(
    enabled: boolean
  ): void {

    if (!this.filtersCard) {
      return;
    }


    if (enabled) {

      this.renderer.addClass(
        this.filtersCard,
        'statistique-enabled'
      );


      this.scheduleStatisticsRefresh();

      return;
    }


    this.renderer.removeClass(
      this.filtersCard,
      'statistique-enabled'
    );
  }


  private scheduleStatisticsRefresh(): void {

    if (this.refreshTimer) {

      clearTimeout(
        this.refreshTimer
      );

    }


    this.refreshTimer =
      setTimeout(
        () => {

          this.refreshTimer = null;

          this.renderStatistics();

        },
        0
      );
  }


  private renderStatistics(): void {

    if (
      !this.filtersCard ||
      !this.enabled
    ) {
      return;
    }


    const selector =
      this.getFilterFieldSelector();


    const fields =
      Array.from(
        this.filtersCard
          .querySelectorAll<HTMLElement>(
            selector
          )
      );


    const statistics =
      this.getSectionStatistics();


    fields.forEach(
      (
        field,
        index
      ) => {

        const statistic =
          statistics[index];


        if (!statistic) {

          field.style.removeProperty(
            '--stat-donut-colors'
          );

          field.style.removeProperty(
            '--stat-selected-colors'
          );

          field.removeAttribute(
            'data-stat-caption'
          );

          field.removeAttribute(
            'title'
          );

          return;
        }


        field.style.setProperty(
          '--stat-donut-colors',
          statistic.gradient
        );


        field.style.setProperty(
          '--stat-selected-colors',
          statistic.selectedGradient ||
            'conic-gradient(transparent 0% 100%)'
        );


        field.setAttribute(
          'data-stat-caption',
          statistic.caption
        );


        field.setAttribute(
          'title',
          statistic.tooltip
        );

      }
    );
  }


  private getFilterFieldSelector(): string {

    switch (this.initialFilter) {

      case 'germination':
        return '.germination-filter-field';

      case 'viability':
        return '.viability-filter-field';

      case 'culture':
        return '.culture-filter-field';

      case 'sowing':
      default:
        return '.semis-filter-field';

    }
  }


  private getSectionStatistics():
    StatisticDisplay[] {

    /*
     * Tous les donuts utilisent maintenant
     * exactement les lignes restantes après
     * l'application de TOUS les filtres actifs.
     *
     * Les statistiques sont donc reliées entre elles.
     */
    const rows =
      Array.isArray(this.rows)
        ? this.rows
        : [];


    this.distributionIndex = 0;


    switch (this.initialFilter) {

      case 'germination':

        return [

          this.buildTotalStatistic(
            rows.length,
            'tests'
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.formatDate(
                  row?.meta_create_date
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.normalizeValue(
                  row?.thermoPhoto
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.normalizeValue(
                  row?.treatment
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                row?.pre_treatment === true
                  ? 'Oui'
                  : 'Non'
            )
          )

        ];


      case 'viability':

        return [

          this.buildTotalStatistic(
            rows.length,
            'tests'
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.formatDate(
                  row?.meta_create_date
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.normalizeValue(
                  row?.traitement
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                row?.pre_treatment === true
                  ? 'Oui'
                  : 'Non'
            )
          )

        ];


      case 'culture':

        return [

          this.buildTotalStatistic(
            rows.length,
            'cultures'
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.getCultureSourceType(
                  row
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.getCultureSource(
                  row
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.formatDate(
                  row?.date_start
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                (
                  row?.is_active ||
                  !row?.date_end
                )
                  ? 'Culture active'
                  : 'Culture terminée'
            )
          )

        ];


      case 'sowing':
      default:

        return [

          this.buildTotalStatistic(
            rows.length,
            'semis'
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.formatDate(
                  row?.start_date
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.normalizeValue(
                  row?.label_sowing ||
                  row?.id_sowing_method
                )
            )
          ),

          this.buildDistribution(
            rows.map(
              row =>
                this.normalizeValue(
                  row?.label_substrate ||
                  row?.substrate?.value ||
                  row?.substrate
                )
            )
          )

        ];

    }
  }


  private buildTotalStatistic(
    total: number,
    label: string
  ): StatisticDisplay {

    if (total <= 0) {

      return this.buildEmptyStatistic();

    }


    const normalizedCode =
      String(
        this.codeFilter || ''
      )
        .trim()
        .toLowerCase();


    /*
     * Le premier donut affiche TOUJOURS
     * la répartition réelle des codes visibles.
     *
     * Exemple Semis :
     * s  = 50 %
     * ss = 50 %
     *
     * Exemple Culture :
     * c  = 50 %
     * cc = 50 %
     */
    const sourceRows =
      Array.isArray(this.rows)
        ? this.rows
        : [];


    const codeCounts =
      new Map<string, number>();


    sourceRows.forEach(
      row => {

        const code =
          this.initialFilter ===
            'culture'
            ? row?.code_culture
            : row?.code;


        const normalizedValue =
          this.normalizeValue(
            code
          );


        codeCounts.set(
          normalizedValue,
          (
            codeCounts.get(
              normalizedValue
            ) || 0
          ) + 1
        );

      }
    );


    let items =
      Array
        .from(
          codeCounts.entries()
        )
        .map(
          (
            [
              code,
              count
            ],
            index
          ) => ({
            label:
              code,

            count,

            color:
              this.donutPalettes[0][
                index %
                this.donutPalettes[0].length
              ]
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            first.label.localeCompare(
              second.label
            )
        );


    /*
     * Maximum 5 parties lisibles.
     */
    if (items.length > 5) {

      const mainItems =
        items.slice(
          0,
          4
        );


      const otherCount =
        items
          .slice(4)
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.count,
            0
          );


      items = [
        ...mainItems,
        {
          label:
            'Autres',

          count:
            otherCount,

          color:
            '#b0bec5'
        }
      ];
    }


    /*
     * Si aucun N° n'est saisi :
     * aucune tranche n'est spécialement agrandie,
     * mais toutes les valeurs restent visibles.
     *
     * Si un N° est saisi :
     * toutes les valeurs correspondantes
     * sont mises en avant.
     *
     * Exemple "s" :
     * s et ss peuvent être sélectionnés.
     */
    const selectedLabels =
      normalizedCode
        ? new Set<string>(
            items
              .filter(
                item =>
                  item.label
                    .toLowerCase()
                    .includes(
                      normalizedCode
                    )
              )
              .map(
                item =>
                  item.label
              )
          )
        : new Set<string>();


    return this.buildSegmentStatistic(
      items,
      selectedLabels
    );
  }


  private buildDistribution(
    rawValues: any[]
  ): StatisticDisplay {

    const currentIndex =
      this.distributionIndex++;


    const filter =
      this.getDistributionFilter(
        currentIndex
      );


    /*
     * Cas spécial :
     * filtre "À partir du".
     */
    if (
      filter.isDate &&
      this.hasFilterValue(
        filter.value
      )
    ) {

      return this.buildDateThresholdDistribution(
        rawValues,
        filter.value
      );

    }


    if (
      !rawValues ||
      rawValues.length === 0
    ) {

      return this.buildEmptyStatistic();

    }


    const selectedLabels =
      this.getSelectedLabels(
        filter.value
      );


    const counts =
      new Map<string, number>();


    rawValues.forEach(
      value => {

        const normalizedValue =
          this.normalizeValue(
            value
          );


        counts.set(
          normalizedValue,
          (
            counts.get(
              normalizedValue
            ) || 0
          ) + 1
        );

      }
    );


    let items =
      Array
        .from(
          counts.entries()
        )
        .map(
          (
            [
              label,
              count
            ]
          ) => ({
            label,
            count
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            second.count -
            first.count
        );


    /*
     * Maximum 5 parties.
     *
     * Si une valeur est sélectionnée,
     * elle est toujours conservée.
     */
    if (items.length > 5) {

      const selectedItem =
        items.find(
          item =>
            selectedLabels.has(
              item.label
            )
        );


      if (selectedItem) {

        const remainingItems =
          items.filter(
            item =>
              item.label !==
                selectedItem.label
          );


        const keptItems = [
          selectedItem,
          ...remainingItems.slice(
            0,
            3
          )
        ];


        const otherCount =
          remainingItems
            .slice(3)
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                item.count,
              0
            );


        items =
          otherCount > 0
            ? [
                ...keptItems,
                {
                  label: 'Autres',
                  count: otherCount
                }
              ]
            : keptItems;

      } else {

        const mainItems =
          items.slice(
            0,
            4
          );


        const otherCount =
          items
            .slice(4)
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                item.count,
              0
            );


        items = [
          ...mainItems,
          {
            label: 'Autres',
            count: otherCount
          }
        ];

      }
    }


    return this.buildSegmentStatistic(
      items.map(
        (
          item,
          index
        ) => ({
          ...item,

          color:
            item.label === 'Autres'
              ? '#90a4ae'
              : this.getStatisticColor(
                  index
                )
        })
      ),
      selectedLabels
    );
  }


  private getDistributionFilter(
    index: number
  ): {
    value: any;
    isDate: boolean;
  } {

    switch (this.initialFilter) {

      case 'germination':

        return [
          {
            value:
              this.dateFilter,
            isDate:
              true
          },
          {
            value:
              this.primaryFilter,
            isDate:
              false
          },
          {
            value:
              this.secondaryFilter,
            isDate:
              false
          },
          {
            value:
              this.tertiaryFilter,
            isDate:
              false
          }
        ][index] || {
          value: null,
          isDate: false
        };


      case 'viability':

        return [
          {
            value:
              this.dateFilter,
            isDate:
              true
          },
          {
            value:
              this.primaryFilter,
            isDate:
              false
          },
          {
            value:
              this.secondaryFilter,
            isDate:
              false
          }
        ][index] || {
          value: null,
          isDate: false
        };


      case 'culture':

        return [
          {
            value:
              this.primaryFilter,
            isDate:
              false
          },
          {
            value:
              this.secondaryFilter,
            isDate:
              false
          },
          {
            value:
              this.dateFilter,
            isDate:
              true
          },
          {
            value:
              this.tertiaryFilter,
            isDate:
              false
          }
        ][index] || {
          value: null,
          isDate: false
        };


      case 'sowing':
      default:

        return [
          {
            value:
              this.dateFilter,
            isDate:
              true
          },
          {
            value:
              this.primaryFilter,
            isDate:
              false
          },
          {
            value:
              this.secondaryFilter,
            isDate:
              false
          }
        ][index] || {
          value: null,
          isDate: false
        };

    }
  }


  private getSelectedLabels(
    value: any
  ): Set<string> {

    const labels =
      new Set<string>();


    if (
      !this.hasFilterValue(
        value
      )
    ) {

      return labels;

    }


    const normalizedValue =
      typeof value === 'boolean'
        ? (
            value
              ? 'Oui'
              : 'Non'
          )
        : this.normalizeValue(
            value
          );


    labels.add(
      normalizedValue
    );


    /*
     * Les filtres utilisent "-"
     * pour une donnée absente.
     */
    if (normalizedValue === '-') {

      labels.add(
        'Non renseigné'
      );

      labels.add(
        'Sans origine'
      );

    }


    return labels;
  }


  private buildDateThresholdDistribution(
    rawValues: any[],
    threshold: any
  ): StatisticDisplay {

    const thresholdKey =
      this.getStatisticDateKey(
        threshold
      );


    if (!thresholdKey) {

      return this.buildEmptyStatistic();

    }


    let beforeCount = 0;
    let missingCount = 0;


    const afterCounts =
      new Map<string, number>();


    rawValues.forEach(
      value => {

        const dateKey =
          this.getStatisticDateKey(
            value
          );


        if (!dateKey) {

          missingCount++;

          return;
        }


        /*
         * Toutes les dates avant
         * la date sélectionnée.
         */
        if (
          dateKey <
          thresholdKey
        ) {

          beforeCount++;

          return;
        }


        /*
         * Chaque date à partir du seuil
         * garde sa propre partie.
         */
        afterCounts.set(
          dateKey,
          (
            afterCounts.get(
              dateKey
            ) || 0
          ) + 1
        );

      }
    );


    const thresholdLabel =
      this.formatDate(
        threshold
      );


    const items:
      Array<{
        label: string;
        count: number;
        color: string;
      }> = [];


    /*
     * Une couleur unique pour
     * toutes les données AVANT.
     */
    if (beforeCount > 0) {

      items.push({
        label:
          `Avant ${thresholdLabel}`,

        count:
          beforeCount,

        color:
          '#b0bec5'
      });

    }


    /*
     * Toutes les dates à partir du seuil
     * sont considérées comme sélectionnées :
     * elles ressortent du donut.
     */
    const selectedLabels =
      new Set<string>();


    Array
      .from(
        afterCounts.entries()
      )
      .sort(
        (
          first,
          second
        ) =>
          first[0].localeCompare(
            second[0]
          )
      )
      .forEach(
        (
          [
            dateKey,
            count
          ],
          index
        ) => {

          const label =
            this.formatDate(
              dateKey
            );


          items.push({
            label,
            count,

            color:
              this.getStatisticColor(
                index
              )
          });


          selectedLabels.add(
            label
          );

        }
      );


    if (missingCount > 0) {

      items.push({
        label:
          'Non renseigné',

        count:
          missingCount,

        color:
          '#cfd8dc'
      });

    }


    return this.buildSegmentStatistic(
      items,
      selectedLabels
    );
  }


  private buildSegmentStatistic(
    rawItems:
      Array<{
        label: string;
        count: number;
        color: string;
      }>,

    selectedLabels:
      Set<string>
  ): StatisticDisplay {

    const items =
      rawItems.filter(
        item =>
          item.count > 0
      );


    const total =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.count,
        0
      );


    if (total <= 0) {

      return this.buildEmptyStatistic();

    }


    let startPercent = 0;


    const gradientParts:
      string[] = [];


    const selectedGradientParts:
      string[] = [];


    const details:
      string[] = [];


    items.forEach(
      item => {

        const percent =
          (
            item.count /
            total
          ) * 100;


        const endPercent =
          startPercent +
          percent;


        /*
         * Taille réelle de la statistique.
         *
         * Une séparation noire très fine est ajoutée
         * entre les différentes parties du donut.
         */
        const separator =
          0.12;


        const colorStart =
          startPercent > 0
            ? startPercent + separator
            : startPercent;


        const colorEnd =
          endPercent < 100
            ? endPercent - separator
            : endPercent;


        if (startPercent > 0) {

          gradientParts.push(
            `rgba(0, 0, 0, 0.38) ` +
            `${startPercent.toFixed(2)}% ` +
            `${colorStart.toFixed(2)}%`
          );

        }


        gradientParts.push(
          `${item.color} ` +
          `${colorStart.toFixed(2)}% ` +
          `${colorEnd.toFixed(2)}%`
        );


        if (endPercent < 100) {

          gradientParts.push(
            `rgba(0, 0, 0, 0.38) ` +
            `${colorEnd.toFixed(2)}% ` +
            `${endPercent.toFixed(2)}%`
          );

        }


        const isSelected =
          selectedLabels.has(
            item.label
          );


        /*
         * Cette deuxième couche correspond
         * uniquement aux parties sélectionnées.
         *
         * Le SCSS les affiche plus grandes
         * sans modifier leur pourcentage réel.
         */
        selectedGradientParts.push(
          `${
            isSelected
              ? item.color
              : 'transparent'
          } ` +
          `${startPercent.toFixed(2)}% ` +
          `${endPercent.toFixed(2)}%`
        );


        details.push(
          `${
            isSelected
              ? '★ '
              : ''
          }${item.label} ` +
          `${this.formatPercentage(percent)}`
        );


        startPercent =
          endPercent;

      }
    );


    return {

      gradient:
        `conic-gradient(
          ${gradientParts.join(', ')}
        )`,

      selectedGradient:
        `conic-gradient(
          ${selectedGradientParts.join(', ')}
        )`,

      caption:
        details.join(' • '),

      tooltip:
        details.join(' | ')

    };
  }


  private hasFilterValue(
    value: any
  ): boolean {

    return (
      value !== null &&
      value !== undefined &&
      value !== ''
    );
  }


  private getStatisticDateKey(
    value: any
  ): string {

    if (!value) {

      return '';

    }


    if (
      typeof value === 'string'
    ) {

      const isoPart =
        value.split('T')[0];


      /*
       * yyyy-mm-dd
       */
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          isoPart
        )
      ) {

        return isoPart;

      }


      /*
       * dd/mm/yyyy
       */
      const frenchMatch =
        value.match(
          /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


      if (frenchMatch) {

        return (
          `${frenchMatch[3]}-` +
          `${frenchMatch[2]}-` +
          `${frenchMatch[1]}`
        );

      }
    }


    const date =
      value instanceof Date
        ? value
        : new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';

    }


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return (
      `${year}-` +
      `${month}-` +
      `${day}`
    );
  }


  private getStatisticColor(
    index: number
  ): string {

    /*
     * distributionIndex vaut :
     *
     * 1 = deuxième donut
     * 2 = troisième donut
     * 3 = quatrième donut
     * 4 = cinquième donut
     *
     * Chaque donut reçoit donc
     * une palette différente.
     */
    const paletteIndex =
      Math.min(
        this.distributionIndex,
        this.donutPalettes.length - 1
      );


    const palette =
      this.donutPalettes[
        paletteIndex
      ];


    if (
      index <
      palette.length
    ) {

      return palette[index];

    }


    /*
     * Si un donut possède beaucoup
     * de valeurs différentes,
     * on continue à générer
     * des couleurs distinctes.
     */
    const extraIndex =
      index -
      palette.length;


    const hue =
      (
        330 +
        (
          paletteIndex * 55
        ) +
        (
          extraIndex * 17
        )
      ) % 360;


    const lightness =
      36 +
      (
        extraIndex % 5
      ) * 7;


    return (
      `hsl(` +
      `${hue}, 52%, ${lightness}%` +
      `)`
    );
  }


  private buildEmptyStatistic():
    StatisticDisplay {

    return {

      gradient:
        `conic-gradient(
          #d7dde1 0% 100%
        )`,

      caption:
        'Aucune donnée',

      tooltip:
        'Aucune donnée'

    };
  }


  private formatPercentage(
    value: number
  ): string {

    const rounded =
      Math.round(
        value * 10
      ) / 10;


    const displayValue =
      Number.isInteger(
        rounded
      )
        ? String(rounded)
        : rounded
            .toFixed(1)
            .replace(
              '.',
              ','
            );


    return `${displayValue} %`;
  }


  private formatDate(
    value: any
  ): string {

    if (!value) {
      return 'Non renseigné';
    }


    if (
      typeof value === 'string'
    ) {

      const datePart =
        value.split('T')[0];


      const match =
        datePart.match(
          /^(\d{4})-(\d{2})-(\d{2})$/
        );


      if (match) {

        return (
          `${match[3]}/` +
          `${match[2]}/` +
          `${match[1]}`
        );

      }
    }


    const date =
      value instanceof Date
        ? value
        : new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return 'Non renseigné';

    }


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    return (
      `${day}/${month}/` +
      `${date.getFullYear()}`
    );
  }


  private normalizeValue(
    value: any
  ): string {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return 'Non renseigné';

    }


    if (
      typeof value === 'object' &&
      value?.value !== undefined
    ) {

      return this.normalizeValue(
        value.value
      );

    }


    const text =
      String(value).trim();


    return text ||
      'Non renseigné';
  }


  private getCultureSourceType(
    row: any
  ): string {

    if (
      row?.source_type === 'sowing' ||
      row?.id_sowing
    ) {

      return 'Semis';

    }


    if (
      row?.source_type === 'test' ||
      row?.id_test
    ) {

      return 'Test de germination';

    }


    return 'Sans origine';
  }


  private getCultureSource(
    row: any
  ): string {

    return this.normalizeValue(
      row?.source_code ||
      row?.code_sowing ||
      row?.code_test
    );
  }
}