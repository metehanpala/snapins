import { AsyncSubject, from, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, filter, map, take, takeUntil, tap, toArray } from 'rxjs/operators';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { BrowserObject, CnsHelperService, CnsLabelEn, Designation, designationSeparator, designationViewSeparator,
  GmsSubscription, LanguageInfo, NewObjectParameters, ObjectCreationInfo, ObjectsServiceBase, SearchOption, SystemBrowserServiceBase,
  SystemBrowserSubscription, SystemBrowserSubscriptionServiceBase, SystemInfo, SystemsResponseObject, SystemsServiceBase,
  TextEntry, ViewNode, ViewType, ViewTypeConverter } from '@gms-flex/services';
import { TraceServiceDelegate } from '../shared/trace-service-delegate';
import { AggregateView, AggregateViewIfc } from './data-model/aggregate-view';
import { CnsNodeIfc } from './data-model/cns-node';
import { WsiTranslator } from './wsi-translator';

export interface CreateObjectResponse {
  browserObj?: BrowserObject;
  errorMessage?: string;
}

export interface ObjectManagerCoreIfc {

  readonly locale: string;
  readonly isDistributedSystem: boolean;
  readonly localSystemId: number;
  readonly localSystemName: string;
  readonly languages: readonly LanguageInfo[];
  readonly coreViewListModified: Observable<void>;
  getViews(): Observable<readonly AggregateViewIfc[]>;
  lookupViewNode(viewId: number, systemId?: number): ViewNode;
  findObject(designation: string): Observable<BrowserObject>;
  findPathObjects(designation: string): Observable<BrowserObject[]>;
  searchName(
    pageSize: number, pageNumber: number,
    systemId: number, viewId: number, pattern: string, aliasPattern: string,
    disciplineArr: TextEntry[], objectTypeArr: TextEntry[], alarmSuppression?: boolean): Observable<BrowserObject[]>;
  searchDescription(
    pageSize: number, pageNumber: number,
    systemId: number, viewId: number, pattern: string, aliasPattern: string,
    disciplineArr: TextEntry[], objectTypeArr: TextEntry[], alarmSuppression?: boolean): Observable<BrowserObject[]>;
  searchAlias(
    pageSize: number, pageNumber: number,
    systemId: number, viewId: number, pattern: string,
    disciplineArr: TextEntry[], objectTypeArr: TextEntry[], alarmSuppression?: boolean): Observable<BrowserObject[]>;
  getObjectInfo(cnsNode: CnsNodeIfc): Observable<ObjectCreationInfo>;
  createObject(omName: string, parentCnsNode: CnsNodeIfc, cnsDescription: string): Observable<CreateObjectResponse>;

}

export class ObjectManagerCore implements ObjectManagerCoreIfc {

  private readonly systemMap: Map<number, SystemInfo>;
  private systemDistributedFlag: boolean;
  private systemLocalId: number;
  private systemLocalName: string;
  private languageArr: LanguageInfo[];
  private views: AggregateView[];
  private isInitialized: boolean;
  private cnsLabelDefault: CnsLabelEn;
  private cnsSubscriptionClientId: string;
  private cnsSubscription: GmsSubscription<SystemBrowserSubscription>;

  private respGetViews: AsyncSubject<readonly AggregateViewIfc[]>;
  private viewListModifedInd: Subject<void>;
  private destroyInd: Subject<void>;

  public get coreViewListModified(): Observable<void> {
    return this.viewListModifedInd;
  }

  public get isChildOrderByName(): boolean {
    return this.cnsLabelDefault === CnsLabelEn.Name ||
      this.cnsLabelDefault === CnsLabelEn.NameAndDescription ||
      this.cnsLabelDefault === CnsLabelEn.NameAndAlias;
  }

  public get isDistributedSystem(): boolean {
    return Boolean(this.systemDistributedFlag);
  }

  public get localSystemId(): number {
    return this.systemLocalId;
  }

  public get localSystemName(): string {
    return this.systemLocalName;
  }

  public get languages(): readonly LanguageInfo[] {
    return this.languageArr || [];
  }

  public constructor(
    private readonly traceSvc: TraceServiceDelegate,
    private readonly systemsService: SystemsServiceBase,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly systemBrowserSubscriptionService: SystemBrowserSubscriptionServiceBase,
    private readonly objectsService: ObjectsServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    public locale: string) {

    if (!(traceSvc && systemsService && systemBrowserService && systemBrowserSubscriptionService &&
      objectsService && cnsHelperService && locale)) {
      throw new Error('invalid argument');
    }
    this.destroyInd = new Subject<void>();
    this.viewListModifedInd = new Subject<void>();
    this.systemMap = new Map<number, SystemInfo>();
    this.cnsLabelDefault = CnsLabelEn.Description;
    this.isInitialized = false;
  }

  public dispose(): void {
    if (!this.destroyInd) {
      return; // already disposed
    }
    if (this.views) {
      this.views.forEach(v => v.dispose());
    }
    this.views = undefined;
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
    this.systemBrowserSubscriptionService.unsubscribeNodeChanges(this.cnsSubscription, this.cnsSubscriptionClientId);
    this.systemBrowserSubscriptionService.disposeClient(this.cnsSubscriptionClientId);
    this.systemsService.unSubscribeSystems();
    this.cnsSubscription = undefined;
    this.cnsSubscriptionClientId = undefined;
    this.viewListModifedInd.complete();
    this.viewListModifedInd = undefined;
  }

  public getViews(): Observable<readonly AggregateViewIfc[]> {
    if (!this.destroyInd) {
      return throwError(new Error('core disposed'));
    }
    if (this.views) {
      return of(this.views); // already loaded!
    }

    // Allow only a single sequence of outstanding server requests to load views.
    // Response is multi-cast through a Subject in case of multiple concurrent callers.
    let resp: AsyncSubject<readonly AggregateViewIfc[]> = this.respGetViews;
    if (!resp) {
      // NOTE: An AsyncSubject is used to ensure the caller receives the last (and only)
      //  indication from the returned Observable in the case that it subscribes after
      //  the Subject completes.
      resp = new AsyncSubject<readonly AggregateViewIfc[]>();
      this.respGetViews = resp;
      this.initialize(); // no harm if already initialized (just returns)
      this.systemsService.getSystemsExt()
        .pipe(
          tap(sys => this.setSystemInformation(sys)),
          concatMap(() => this.systemBrowserService.getViews()),
          tap(cnsViews => this.setAggregateViews(cnsViews)),
          catchError(err => {
            this.traceSvc.error('Error loading views: %s', err);
            return of(undefined);
          }))
        .subscribe(
          () => {
            this.respGetViews.next(this.views || []);
            this.respGetViews.complete();
            this.respGetViews = undefined;
          });
    }
    return resp;
  }

  public findObject(designation: string): Observable<BrowserObject> {
    const d: Designation = new Designation(designation);
    if (!(d.isValid && d.isViewValid && d.isRootNodeValid)) {
      return of(undefined); // invalid designation!
    }
    const sysName: string = d.systemName || this.localSystemName;
    return this.getViews()
      .pipe(
        map(views => {
          // Search loaded aggregate views for matching node
          const view: AggregateView = this.findViewContaining(sysName, d.viewName);
          let cnsNode: CnsNodeIfc;
          if (view) {
            cnsNode = view.findCnsNode(d);
          }
          return cnsNode;
        }),
        concatMap(cnsNode => {
          if (cnsNode) {
            // Node found in an expanded view; return its browser-object
            return of([cnsNode.browserObj]);
          }
          // Search associated CNS view at server for matching node
          const view: AggregateView = this.findViewContaining(sysName, d.viewName);
          const cnsView: ViewNode = view.findCnsView(sysName, d.viewName);
          if (!cnsView) {
            return of(undefined); // view not found!
          }
          return this.searchName(100, 1, cnsView.SystemId, cnsView.ViewId, d.designation, undefined, undefined, undefined);
        }),
        map(boArr => boArr && boArr.length > 0 ? boArr[0] : undefined)
      );
  }

  public findObjectOrThrow(designation: string): Observable<BrowserObject> {
    return this.findObject(designation)
      .pipe(
        tap(bo => {
          if (!bo) {
            throw new Error(`Failed to find browser-object for designation=${designation}`);
          }
        }));
  }

  public findPathObjects(designation: string): Observable<BrowserObject[]> {
    const d: Designation = new Designation(designation);
    if (!(d.isValid && d.isViewValid && d.isRootNodeValid)) {
      return of(undefined); // invalid designation!
    }
    // Parts of the path not including the optional system-name and view-name (i.e. staring with root-node)
    const pathParts: string[] = d.designationParts.slice(d.isSystemValid ? 2 : 1);
    // Build an array of the full designation of each part of the path
    const pathPartsFull: string[] = [];
    let path: string = d.viewNameFull + designationViewSeparator;
    for (let i = 0; i < pathParts.length; ++i) {
      path += (i === 0 ? '' : designationSeparator) + pathParts[i];
      pathPartsFull.push(path);
    }
    return from(pathPartsFull)
      .pipe(
        concatMap(part => this.findObjectOrThrow(part)),
        toArray()
      );
  }

  public getObjectInfo(cnsNode: CnsNodeIfc): Observable<ObjectCreationInfo> {
    if (!cnsNode) {
      return of(undefined);
    }
    return this.objectsService.getObjectCreationInfo(cnsNode.designation, true)
      .pipe(
        catchError(err => {
          this.traceSvc.error('Error getting object creation info: designation=%s, %s', cnsNode.designation, err);
          return of(undefined);
        }));
  }

  public createObject(omName: string, parentCnsNode: CnsNodeIfc, cnsDescription: string): Observable<CreateObjectResponse> {
    const emptyResp: CreateObjectResponse = {};
    // Parameter validation
    if (!(omName && parentCnsNode)) {
      this.traceSvc.error('Invalid argument');
      return of(emptyResp);
    }
    // Create a CNS name from the provided CNS description
    const cnsName: string = Designation.createNodeName(cnsDescription);
    if (!cnsName) {
      this.traceSvc.error('Invalid cns name');
      return of(emptyResp);
    }

    // Request creation of new DP and CNS node
    /* eslint-disable */
    const params: NewObjectParameters = {
      ObjectModelName: omName,
      Designation: parentCnsNode.designation,
      NameChildNode: cnsName,
      Descriptor: { CommonText: cnsDescription }
    };
    /* eslint-enable */

    return this.objectsService.createObject(params)
      .pipe(
        map(bo => ({ browserObj: bo })),
        catchError(err => {
          this.traceSvc.error('Error creating object: om=%s, parent=%s, cnsName=%s, cnsDesc=%s, %s',
            params.ObjectModelName, params.Designation, params.NameChildNode, params.Descriptor.CommonText, err);
          return of({ errorMessage: err.message });
        }));
  }

  public lookupViewNode(viewId: number, systemId?: number): ViewNode {
    if (!this.views) {
      return undefined;
    }
    let cnsView: ViewNode;
    const sysId: number = isNaN(systemId) ? this.localSystemId : systemId;
    for (const view of this.views) {
      cnsView = view.findCnsViewById(sysId, viewId);
      if (cnsView) {
        break;
      }
    }
    return cnsView;
  }

  public searchName(
    pageSize: number,
    pageNumber: number,
    systemId: number,
    viewId: number,
    pattern: string,
    aliasPattern: string,
    disciplineArr: TextEntry[],
    objectTypeArr: TextEntry[],
    alarmSuppression?: boolean): Observable<BrowserObject[]> {
    return this.search(pageSize, pageNumber, systemId, viewId,
      pattern, SearchOption.designation, aliasPattern, disciplineArr, objectTypeArr, alarmSuppression);
  }

  public searchDescription(
    pageSize: number,
    pageNumber: number,
    systemId: number,
    viewId: number,
    pattern: string,
    aliasPattern: string,
    disciplineArr: TextEntry[],
    objectTypeArr: TextEntry[],
    alarmSuppression?: boolean): Observable<BrowserObject[]> {
    return this.search(pageSize, pageNumber, systemId, viewId,
      pattern, SearchOption.description, aliasPattern, disciplineArr, objectTypeArr, alarmSuppression);
  }

  public searchAlias(
    pageSize: number,
    pageNumber: number,
    systemId: number,
    viewId: number,
    pattern: string,
    disciplineArr: TextEntry[],
    objectTypeArr: TextEntry[],
    alarmSuppression?: boolean): Observable<BrowserObject[]> {
    // Perform a search on ALL objects by name/description according to the specified sort order, with the
    // provided pattern passed in the alias-pattern field.
    return this.search(pageSize, pageNumber, systemId, viewId,
      pattern, SearchOption.alias, undefined, disciplineArr, objectTypeArr, alarmSuppression);
  }

  private search(
    pageSize: number,
    pageNumber: number,
    systemId: number,
    viewId: number,
    pattern: string,
    sOpt: SearchOption,
    aliasPattern: string,
    disciplineArr: TextEntry[],
    objectTypeArr: TextEntry[],
    alarmSuppression?: boolean): Observable<BrowserObject[]> {
    if (sOpt === SearchOption.objectId) {
      throw new Error('search by object-id not supported through this method');
    }
    let disciplines: string;
    let types: string;
    let alarmSup: boolean;
    if (disciplineArr && disciplineArr.length > 0) {
      disciplines = JSON.stringify(TextEntry.arrayAsWsiParam(disciplineArr));
    }
    if (objectTypeArr && objectTypeArr.length > 0) {
      types = JSON.stringify(TextEntry.arrayAsWsiParam(objectTypeArr));
    }
    if (!isNullOrUndefined(alarmSuppression)) {
      alarmSup = Boolean(alarmSuppression);
    }
    return this.systemBrowserService.searchNodes(
      systemId,
      pattern,
      viewId,
      sOpt,
      false, // case sensitive flag
      true, // group by parent flag
      pageSize,
      pageNumber,
      disciplines,
      types,
      alarmSup,
      sOpt === SearchOption.alias ? null : aliasPattern) // MUST be `null` when primary search pattern is alias!
      .pipe(
        map(page => page.Nodes));
  }

  private initialize(): void {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    // Record the initial setting of the chosen CNS display mode
    this.cnsHelperService.activeCnsLabel
      .pipe(
        filter(lab => !isNullOrUndefined(lab)),
        take(1)) // take only the first emitted not-undefined object (will then implicitly unsubscribe)
      .subscribe(
        lab => {
          this.cnsLabelDefault = lab.cnsLabel;
        });
    // Subscribe for CNS changes across all systems and views
    this.cnsSubscriptionClientId = this.systemBrowserSubscriptionService.registerClient('ObjectManagerCore');
    this.cnsSubscription = this.systemBrowserSubscriptionService.subscribeNodeChanges('*', this.cnsSubscriptionClientId);
    this.cnsSubscription.changed
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        change => {
          this.onCnsChange(change);
        });
    // Subscribe for system online/offline state changes
    this.systemsService.subscribeSystems();
    this.systemsService.systemsNotification()
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        systemInfoArr => {
          this.onSystemChange(systemInfoArr);
        });
  }

  private setSystemInformation(sys: SystemsResponseObject): void {
    if (!sys || !sys.Systems || sys.Systems.length === 0) {
      throw new Error('System information response is empty');
    }
    this.systemDistributedFlag = sys.IsDistributed === undefined || sys.IsDistributed; // coerce `true` if not defined
    this.systemLocalId = sys.IdLocal;
    // System online/offline map
    this.systemMap.clear();
    sys.Systems.forEach(item => {
      item.IsOnline = item.IsOnline === undefined || item.IsOnline; // coerce `true` if not defined
      if (!this.systemMap.get(item.Id)) {
        this.systemMap.set(item.Id, item);
      }
      if (item.Id === this.systemLocalId) {
        this.systemLocalName = item.Name;
      }
    });
    // Keep a copy of the installed project languages
    if (sys.Languages) {
      this.languageArr = sys.Languages.slice(0);
    }
  }

  private systemIdToName(systemId: number): string {
    let systemName: string;
    const si: SystemInfo = this.systemMap.get(systemId);
    if (si) {
      systemName = si.Name;
    }
    return systemName;
  }

  private systemNameToId(systemName: string): number {
    let systemId: number;
    this.systemMap.forEach(si => {
      if (si.Name === systemName) {
        systemId = si.Id;
      }
    });
    return systemId;
  }

  private setAggregateViews(cnsViewsInput: ViewNode[]): void {
    const cnsViews: ViewNode[] = cnsViewsInput.slice(0);
    this.views = [];
    while (cnsViews.length > 0) {
      const base: ViewNode = cnsViews[0];
      const type: ViewType = ViewTypeConverter.toViewType(base.ViewType);
      if (!isNullOrUndefined(type)) {
        // Collect all cns-views of the same type as the 'base' into an aggregate set
        const cnsViewSet: ViewNode[] = cnsViews.filter(cnsView => AggregateView.isAggregateMatch(cnsView, base));
        const view: AggregateView = new AggregateView(
          this.traceSvc,
          this.systemBrowserService,
          this.locale,
          this.localSystemName,
          cnsViewSet,
          this.isChildOrderByName);
        this.views.push(view);
        // Remove each cns-view in the set from cnsViews array
        cnsViewSet.forEach(cnsView => {
          cnsViews.splice(cnsViews.findIndex(v => v === cnsView), 1);
        });
      } else {
        // Remove unsupported cns-view from cnsViews array
        this.traceSvc.warn('Ignoring CNS view with unrecognized type: %s', WsiTranslator.toStringViewNode(base, true));
        cnsViews.splice(0, 1);
      }
    }
    this.views.sort((a, b) => AggregateView.compare(this.locale, a, b));
  }

  private updateAggregateViews(cnsViews: ViewNode[]): boolean {
    if (!cnsViews || !this.views) {
      return false;
    }
    let viewsAdded = false;
    cnsViews.forEach(cnsView => {
      let view: AggregateView = this.views.find(v => v.isMatch(cnsView));
      if (view) {
        view.addCnsView(cnsView, true);
      } else {
        view = new AggregateView(
          this.traceSvc,
          this.systemBrowserService,
          this.locale,
          this.localSystemName,
          [cnsView],
          this.isChildOrderByName);
        this.views.push(view);
        viewsAdded = true;
      }
    });
    if (viewsAdded) {
      this.views.sort((a, b) => AggregateView.compare(this.locale, a, b));
    }
    return viewsAdded;
  }

  private findViewContaining(systemName: string, cnsViewName: string): AggregateView {
    let view: AggregateView;
    if (this.views) {
      view = this.views.find(v => v.containsCnsView(systemName, cnsViewName));
    }
    return view;
  }

  /**
   * System state change handling.
   */
  private onSystemChange(siArr: SystemInfo[]): void {
    if (!this.views || !siArr) {
      return;
    }
    // Any systems we already know about that are NOT present in the provided array will
    // be treated implicitly as offline.
    this.systemMap.forEach(knownSystem => {
      if (siArr.findIndex(si => si.Id === knownSystem.Id) < 0 && knownSystem.IsOnline) {
        knownSystem.IsOnline = false;
        this.removeViewsForSystem(knownSystem.Id);
      }
    });
    // Iterate over the provided system status array marking each explicitly reported
    // system as online/offline
    siArr.forEach(si => {
      // Coerce the IsOnline flag to true if it is undefined in the object received from the server
      si.IsOnline = (isNullOrUndefined(si.IsOnline) || si.IsOnline);
      const knownSystem: SystemInfo = this.systemMap.get(si.Id);
      if (knownSystem) {
        // Known system; if status has changed, record new status and add/remove views for this system
        if (knownSystem.IsOnline !== si.IsOnline) {
          knownSystem.IsOnline = si.IsOnline;
          if (knownSystem.IsOnline) {
            this.addViewsForSystem(knownSystem.Id);
          } else {
            this.removeViewsForSystem(knownSystem.Id);
          }
        }
      } else {
        // New system; add to map and add views if system is online
        this.systemMap.set(si.Id, si);
        if (si.IsOnline) {
          this.addViewsForSystem(si.Id);
        }
      }
    });
  }

  private addViewsForSystem(systemId: number): void {
    const systemName: string = this.systemIdToName(systemId);
    if (!systemName) {
      return;
    }
    this.systemBrowserService.getViews(systemId)
      .pipe(
        map(cnsViews => this.updateAggregateViews(cnsViews)),
        catchError(err => {
          this.traceSvc.error('Error loading views for system: systemId=%s, %s', systemId, err);
          return of(false);
        }))
      .subscribe(
        viewsAdded => {
          if (viewsAdded) {
            this.notifyViewListModified();
          }
        }
      );
  }

  private removeViewsForSystem(systemId: number): void {
    const systemName: string = this.systemIdToName(systemId);
    if (!systemName) {
      return;
    }
    // Remove all cns-views belonging to specified system from all aggregate-views
    this.views.forEach(v => {
      v.removeCnsViewsForSystem(systemName);
    });
    // Collect a list of now empty aggregate-views and remove them from the view list
    const emptyViews: AggregateView[] = this.views.filter(v => v.cnsViews.length === 0);
    if (emptyViews.length > 0) {
      emptyViews.forEach(vEmpty => {
        const pos: number = this.views.findIndex(v => v === vEmpty);
        this.views[pos].markDeleted();
        this.views.splice(pos, 1);
      });
      this.notifyViewListModified();
    }
  }

  /**
   * CNS change handling.
   *
   * Actions of interest:
   *
   *  action=11|actChangeNodeNames	change=3|chnTreeNameChanged	    node/root modify
   *  action=10|actTreeAdd		      change=5|chnStructureChanged	  node add
   *  action=7|actTreeCreate		    change=5|chnStructureChanged	  root add
   *  action=8|actTreeDelete		    change=5|chnStructureChanged	  node/root delete
   *
   *  action=12|actChangeNodeData   change=4|chnTreeDataChanged     DP modify
   *
   *  action=2|actViewCreate		    change=5|chnStructureChanged	  view add
   *  action=101|actViewChangeType	change=101|chnViewTypeChanged   view type change
   *  action=3|actViewDelete		    change=5|chnStructureChanged	  view delete
   *  action=5|actViewChangeNames 	change=3|chnTreeNameChanged	    view modify
   */
  private onCnsChange(cnsChange: SystemBrowserSubscription): void {
    if (!this.views) {
      return;
    }
    if (!cnsChange) {
      return;
    }
    const cnsChangeAsString: string = WsiTranslator.toStringCnsChange(cnsChange);
    this.traceSvc.debug('Received CNS change indication: %s', cnsChangeAsString);

    try {
      switch (cnsChange.Action) {
        case 2: // view added
          // Too early to process new view indication; view-type has not been set yet!
          break;
        case 101: // view-type update (trigger the view add)
        case 5: // view description modified
          this.onCnsViewAddOrModify(cnsChange.View);
          break;
        case 3: // view deleted
          // View information provided in `Node` (`View` property is undefined!)
          this.onCnsViewDelete(cnsChange.Node);
          break;

        case 11: // node modified
        case 12: // DP modified
        case 10: // node added
        case 7: // root added
          this.onCnsNodeAddOrModify(cnsChange.View, cnsChange.Node);
          break;
        case 8: // node deleted
          this.onCnsNodeDelete(cnsChange.View, cnsChange.Node);
          break;

        default:
          this.traceSvc.debug('Unhandled CNS change indication: %s', cnsChangeAsString);
          break;
      }
    } catch (err) {
      this.traceSvc.error('Error processing CNS change indication: cnsInd=%s, %s', cnsChangeAsString, err);
    }
  }

  private onCnsViewAddOrModify(cnsView: ViewNode): void {
    if (!cnsView) {
      return;
    }
    let agView: AggregateView;
    let listChanged = false;
    const pos: number = this.views.findIndex(v => v.containsCnsView(cnsView.SystemName, cnsView.Name));
    agView = pos >= 0 ? this.views[pos] : undefined;
    // If the cns-view was found in an aggregate and is still a match for that aggregate,
    // simply update the cns-view information and return.
    if (agView?.isMatch(cnsView)) {
      agView.updateCnsView(cnsView);
      return;
    }
    // If the cns-view was found in an aggregate and is no longer a match (view description changed),
    // remove the cns-view from the aggregate; it will then be re-added to a new aggregate.
    if (agView) {
      agView.removeCnsView(cnsView.SystemName, cnsView.Name);
      if (agView.cnsViews.length === 0) {
        this.views.splice(pos, 1); // Aggregate is now empty; remove the aggregate
        listChanged = true;
      }
    }
    // Add (or re-add) the cns-view to its matching aggregate
    // If no matching aggregate-view exists, create a new one
    agView = this.views.find(v => v.isMatch(cnsView));
    if (agView) {
      agView.addCnsView(cnsView);
    } else {
      agView = new AggregateView(
        this.traceSvc,
        this.systemBrowserService,
        this.locale,
        this.localSystemName,
        [cnsView],
        this.isChildOrderByName);
      this.views.push(agView);
      this.views.sort((a, b) => AggregateView.compare(this.locale, a, b));
      listChanged = true;
    }
    if (listChanged) {
      this.notifyViewListModified();
    }
  }

  private onCnsViewDelete(bo: BrowserObject): void {
    if (!bo) {
      return;
    }
    const d: Designation = new Designation(bo.Designation);
    const pos: number = this.views.findIndex(v => v.containsCnsView(d.systemName, d.viewName));
    if (pos >= 0) {
      this.views[pos].removeCnsView(d.systemName, d.viewName);
      if (this.views[pos].cnsViews.length === 0) {
        this.views[pos].markDeleted();
        this.views.splice(pos, 1); // Aggregate is now empty; remove the aggregate
        this.notifyViewListModified();
      }
    }
  }

  private onCnsNodeAddOrModify(cnsView: ViewNode, bo: BrowserObject): void {
    if (!cnsView) {
      return;
    }
    const agView: AggregateView = this.findViewContaining(cnsView.SystemName, cnsView.Name);
    if (agView) {
      agView.updateCnsNode(cnsView, bo);
    }
  }

  private onCnsNodeDelete(cnsView: ViewNode, bo: BrowserObject): void {
    if (!cnsView) {
      return;
    }
    const agView: AggregateView = this.findViewContaining(cnsView.SystemName, cnsView.Name);
    if (agView) {
      agView.removeCnsNode(bo);
    }
  }

  private notifyViewListModified(): void {
    if (this.viewListModifedInd && !this.viewListModifedInd.closed) {
      this.viewListModifedInd.next();
    }
  }
}
