import { AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AppContextService, CustomData, CustomSetting, isNullOrUndefined, NotifConfiguration, NotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { IHfwMessage, ISnapInConfig, SnapInBase } from '@gms-flex/core';

import { Subject, Subscription } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { ResizeObserverService, TreeItem, TreeItemFolderState } from '@simpl/element-ng';

@Component({
    selector: 'gms-notifconfig-snapin',
    templateUrl: './notifconfig-snapin.component.html',
    styleUrl: '../gms-notifconfig-snapin.scss',
    standalone: false
})
export class NotifConfigSnapInComponent extends SnapInBase implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.panel') public guardPanel = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;

  @ViewChild('treeComponent', { static: true, read: ElementRef }) public treeEl: ElementRef;

  public configurations: Map<string, NotifConfiguration> = new Map<string, NotifConfiguration>();
  public labels: Map<string, string> = new Map<string, string>([
    ['CONFIG-SHOW', ''],
    ['CONFIG-SOUND', ''],
    ['CONFIG-SOUND-EVENTS', ''],
    ['TOAST-TITLE', ''],
    ['NONE', ''],
    ['BANNER', ''],
    ['ALERT', ''],
    ['OVERRIDE', '']
  ]);
  public selected: string;
  public selectedSub: string;
  public canEditSoundToggle = true;
  public enableBackToNormal = false;
  public senders: string[] = ['newEvents', 'backToNormal', 'suppressedObjects', 'license'];
  public activeSenders: string[] = [];
  public orderedConfigs: NotifConfiguration[] = [];
  public treeItems: TreeItem[] = [];
  public treeContent: any[] = [];
  public updateTree: Subject<void>;
  public treeSelected: TreeItem;
  public flatTree = false;
  public detailsActive = false;
  private readonly subscriptions: Subscription[] = [];
  private resizeSubscription: Subscription;
  private treeWidth: number;

  constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly resizeObserverService: ResizeObserverService,
    private readonly traceService: TraceService,
    private readonly notificationService: NotificationServiceBase,
    private readonly snapinConfig: ISnapInConfig
  ) {
    super(messageBroker, activatedRoute);
    this.updateTree = new Subject<void>();
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture != null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.aboutFrame, 'No default Culture for appContextService');
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.aboutFrame, 'use user Culture');
        });
      } else {
        this.traceService.warn(TraceModules.aboutFrame, 'No user Culture for appContextService');
      }
    }));

    this.setTranslations();

    this.configurations = this.notificationService.getConfigurations();
    this.subscriptions.push(this.notificationService.subscribeConfigurations().subscribe(res => {
      this.configurations = res;

      // order configurations
      const tempConfigs: NotifConfiguration[] = [];
      const tempSenders: string[] = [];
      this.senders.forEach(c => {
        if (this.configurations.get(c)) {
          tempConfigs.push(this.configurations.get(c));
          tempSenders.push(c);
        }
      });

      // reset arrays if the configuration length changed
      if (tempConfigs.length !== this.orderedConfigs.length) {
        this.selected = undefined;
        this.selectedSub = undefined;
        this.orderedConfigs = tempConfigs;
        this.activeSenders = tempSenders;
      }


      // TODO:
      // 1. BTN Sounds
      // 2. BTN Hide on disable show
      // 3. BTN Labels

      if (this.orderedConfigs) {
        if (!this.selected) {
          this.select([this.activeSenders[0], undefined]);
        } else if (this.selected && !this.selectedSub) {
          this.select([this.selected, undefined]);
        } else if (this.selected && this.selectedSub) {
          this.select([this.selected, this.selectedSub]);
        }
      }

      this.createConfigTree();
    }));

    // order configurations
      this.senders.forEach(c => {
        if (this.configurations.get(c)) {
          this.orderedConfigs.push(this.configurations.get(c));
          this.activeSenders.push(c);
        }
      });

    this.endInit();
  }

  public ngAfterViewInit(): void {
    this.subscribeContainerWidthChanges();
  }

  public ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
      this.resizeSubscription = undefined;
    }
    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });
  }

  public sel(items: any[]): void {
    this.select(items[0].customData);
    this.detailsActive = true;
  }

  public select(selected: any[]): void {
    if (!selected[1]) {
      this.selected = selected[0];
      this.selectedSub = undefined;
    } else {
      this.selected = selected[0];
      this.selectedSub = selected[1];
    }
  }

  public buildTreeHelper(data: any[]): TreeItem[] {
    // update tree only if the configuration structure is changed
    if (this.buildTree(data).length !== this.treeItems.length) {
      this.treeItems = this.buildTree(data);
    }
    return this.treeItems;
  }

  public getSubData(): CustomSetting[] {
    return this.configurations.get(this.selected).getCustomData().find(r => r.name === this.selectedSub).data;
  }

  public getSub(): CustomData {
    return this.configurations.get(this.selected).getCustomData().find(r => r.name === this.selectedSub);
  }

  public getOverride(customData: any[]): boolean {
    if (!customData[1]) { return false; } else {
      const child = this.configurations.get(customData[0]).getCustomData().find(ch => ch.name === customData[1]);
      if (child) { return child.override; } else { return false; }
    }
  }

  public setConfig(_id: number, $event?: any, type?: string): void {
    if (!type) {
      // 0 = show
      if (_id === 0) {
        this.configurations.get(this.selected).setShow($event);
        // if show is set to false, remove active Events notifications
        if (this.configurations.get(this.selected).getShow() === false) {
          this.notificationService.cancelAll(this.selected);
        }
      } else if (_id === 1) {
        // 1 = toast none
        this.configurations.get(this.selected).setToast('none');
      } else if (_id === 2) {
        // 2 = toast autoclose
        this.configurations.get(this.selected).setToast('banner');
      } else if (_id === 3) {
        // 3 = toast manual close
        this.configurations.get(this.selected).setToast('alert');
      } else if (_id === 4) {
        // 4 = sound
        this.configurations.get(this.selected).setSound($event);
      } else if (_id === 5) {
        // 5 = override subsetting
        this.getSub().override = $event;
      }
    } else if (type === 'sub') {
      // update customData
      const cat: any = this.configurations.get(this.selected).getCustomData().find(x => x.name === this.selectedSub);
      cat.data[_id].value = $event;
      // if show is set to false, remove active Events notifications
      if ($event === false && cat.data[_id].name === 'show') {
        this.notificationService.hideSub(cat.id);
      }
      // if show is set to false, remove active Back to Normal notifications
      if ($event === false && cat.data[_id].name === 'toNormal') {
       // hideBackToNormal is a EMPTY function
       // not need to call it
        // this.notificationService.hideBackToNormal(cat.id);
      }
    } else if (type === 'customCfg') {
      // update customConfigs
      this.configurations.get(this.selected).getCustomSettings()[_id].value = $event;
      // if show is set to false, remove active Back to Normal notifications
      if (this.configurations.get(this.selected).getCustomSettings()[_id].value === false) {
        this.notificationService.getActiveNotifications(this.selected).forEach(notif => {
          if (notif.id < 0) { this.notificationService.cancel(this.selected, notif.id); }
        });
      }
    }

    this.updateConfig();
  }

  public enableSoundSub(): void {
    this.configurations.get('newEvents').getCustomData().forEach(sub => {
      sub.data[1].value = true;
    });

    this.updateConfig();
  }

  public disableBackToNormal(): void {
    if (!isNullOrUndefined(this.configurations.get('newEvents'))) {
      this.configurations.get('newEvents').getCustomSettings()[0].value = false;
      this.configurations.get('newEvents').getCustomData().forEach(sub => {
        sub.data[3].value = false;
      });
    }

    this.updateConfig();
  }

  public getLabel(key: string): string {
    return this.labels[key];
  }

  public updateConfig(): void {
    this.notificationService.updateConfigurations(this.configurations);
  }

  private endInit(): void {
    if (this.orderedConfigs) {
      if (!this.selected) {
        this.select([this.activeSenders[0], undefined]);
      } else if (this.selected && !this.selectedSub) {
        this.select([this.selected, undefined]);
      } else if (this.selected && this.selectedSub) {
        this.select([this.selected, this.selectedSub]);
      }
    }

    this.getHldlConfigs();
    this.createConfigTree();
  }

  private setTranslations(): void {
    const translateKeys = Array.from(this.labels.keys());
    this.translateService.get(translateKeys).subscribe(strings => {
      this.labels = strings;
    });
  }

  private buildTree(data: any[], parent?: TreeItem): TreeItem[] {
    let root: TreeItem[] = [];

    if (!data || !data.length) {
      return root;
    }

    root = data.map(value => {
      const item = Object.assign(
        {
          label:  value.label,
          state: value.children ? 'expanded' : 'leaf',
          parent: parent
        }, value
      ) as TreeItem;
      item.children = this.buildTree(value.children, item);
      return item;
    });

    return root;
  }

  private createConfigTree(): void {
    // create tree view
    if (this.orderedConfigs.length > 0) {
      this.treeContent = [];
      this.orderedConfigs.forEach((value: NotifConfiguration, index: number) => {
        const treeElement: any = {
          label: value.getDescription(),
          icon: value.getIcon(),
          customData: [this.activeSenders[index], undefined],
          templateName: 'root'
        };
        if (value.getCustomData() !== undefined) {
          const children: any[] = [];
          value.getCustomData().forEach(ch => {
            const child: any = {
              label: ch.name,
              icon: value.getIcon(),
              stateIndicatorColor: ch.color,
              customData: [this.activeSenders[index], ch.name],
              templateName: 'child'
            };
            children.push(child);
          });
          treeElement.children = children;
        }
        this.treeContent.push(treeElement);
      });

      // update tree view
      this.buildTreeHelper(this.treeContent);
      this.treeSelected = this.treeItems[0];
      this.updateTree.next();
    }
  }

  private subscribeContainerWidthChanges(): void {
    if (!(this.treeEl?.nativeElement)) {
      this.traceService.warn('Unable to locate si-tree-view element in DOM for width monitoring');
      return;
    }
    // Detach any previously established subscriptions on this element
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
      this.resizeSubscription = undefined;
    }
    // Subscribe for size changes on this host element
    this.resizeSubscription = this.resizeObserverService.observe(this.treeEl.nativeElement, 100, true, true)
      .subscribe(dim => this.onTreeWidthChanged(dim?.width));
  }

  private onTreeWidthChanged(w: number): void {
    // update tree width and set flat tree accordingly
    if (!isNaN(w) && w !== 0 && w !== this.treeWidth) {
      this.treeWidth = w;
      this.flatTree = !isNaN(this.treeWidth) && this.treeWidth !== 0 && this.treeWidth < 300 ? true : false;
    }
  }

  private getHldlConfigs(): void {
    const hldlConfig = this.snapinConfig.getSnapInHldlConfig(this.fullId, this.location);
    if (hldlConfig !== undefined) {
      this.canEditSoundToggle = hldlConfig.CanEditSoundSettings;
      // this.enableBackToNormal = hldlConfig.EnableNotificationsForBackToNormal;

      if (this.canEditSoundToggle === false) {
        this.setConfig(4, true);
        this.enableSoundSub();
      }

      // if (this.enableBackToNormal === false) {
      this.disableBackToNormal();
      // }
    }
  }
}
