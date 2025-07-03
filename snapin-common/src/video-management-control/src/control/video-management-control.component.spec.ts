import { TestBed } from '@angular/core/testing';
import { FullSnapInId } from '@gms-flex/core';
import { AppContextService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Observer, of } from 'rxjs';
// internationalisation

import { MonitorStatus, SequenceStatus, VMSMonitorData } from '../services/videos/vms.data.model';
import { ObjectManager } from './object-manager';
import { Services, VideoManagementControlComponent } from './video-management-control.component';

/* eslint-disable @typescript-eslint/ban-ts-comment */
describe('VideoManagementControlComponent', () => {
  describe('set name', () => {
    let name = 'name';

    beforeEach(() => {
      name = 'VideoManagementControlComponent';
    });

    it('name should be set', () => {
      expect(name).toBe('VideoManagementControlComponent');
    });
  });

  describe('Test VideoManagementControlComponent class', () => {
    // for stubbing Observables
    const system1Observable: BehaviorSubject<any> = new BehaviorSubject('System1');
    const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);
    /* eslint-disable @typescript-eslint/naming-convention */
    const valueValueObservable: BehaviorSubject<any> = new BehaviorSubject({ Value: { Value: '1' } });
    /* eslint-enable @typescript-eslint/naming-convention */
    const snapshoDataObservable: BehaviorSubject<any> = new BehaviorSubject({ imageData: 'im' });
    const monitorGroupDataObservable: BehaviorSubject<any> = new BehaviorSubject({ objectNotFound: true });
    const selectedNodeDataObservable: BehaviorSubject<any> = new BehaviorSubject('sn');
    const defaultCultureObservable: BehaviorSubject<any> = new BehaviorSubject('defaultCulture');
    const userCultureObservable: BehaviorSubject<any> = new BehaviorSubject('userCulture');

    // variables to instantiate VideoManagementControlComponent instance
    let videoManagementControlComponent: VideoManagementControlComponent;

    const event = new Event('MyEvent');

    const vmsMd1: VMSMonitorData = {
      cameraDescription: '', cameraName: '', hasPlayback: false, id: '', monitorDescription: '',
      monitorStatus: MonitorStatus.ConnectStream, sequenceStatus: SequenceStatus.NoSequenceActive
    };
    const vmsMd2: VMSMonitorData = {
      cameraDescription: '', cameraName: '', hasPlayback: false, id: '', monitorDescription: '',
      monitorStatus: MonitorStatus.ConnectStream, sequenceStatus: SequenceStatus.NoSequenceActive
    };

    // mocks
    const traceService = jasmine.createSpyObj('traceService', ['info', 'debug', 'warn', 'error']);

    const videoManagementService = jasmine.createSpyObj('videoManagementService',
      ['getVideoSystem', 'subscribe', 'unsubscribe', 'registerSystemBrowserClient', 'getApplicationViewDesignation',
        'subscribeSystemBrowserNodeChanges', 'setSelectedObjectData', 'refreshCnsDataCache', 'getConnectionStatus',
        'getAlignmentStatus', 'registerValueSubscription2Client', 'subscribeConnectionStatusNotification',
        'subscribeAlignmentStatusNotification', 'getFrameSpacing', 'unsubscribeSystemBrowserNodeChanges',
        'disposeSystemBrowserClient', 'unsubscribeConnectionStatusNotification', 'unsubscribeAlignmentStatusNotification',
        'disposeValueSubscription2Client', 'connectStream', 'connectStreams', 'startSequence']);
    videoManagementService.getVideoSystem.and.returnValue(system1Observable);
    videoManagementService.getApplicationViewDesignation.and.returnValue(system1Observable);
    videoManagementService.subscribeSystemBrowserNodeChanges.and.returnValue({ changed: nullObservable });
    videoManagementService.refreshCnsDataCache.and.returnValue(nullObservable);
    videoManagementService.getConnectionStatus.and.returnValue(system1Observable);
    videoManagementService.getAlignmentStatus.and.returnValue(system1Observable);
    videoManagementService.getFrameSpacing.and.returnValue(system1Observable);
    videoManagementService.subscribeConnectionStatusNotification.and.returnValue({ changed: valueValueObservable });
    videoManagementService.subscribeAlignmentStatusNotification.and.returnValue({ changed: valueValueObservable });
    videoManagementService.connectStream.and.returnValue(nullObservable);
    videoManagementService.connectStreams.and.returnValue(nullObservable);
    videoManagementService.startSequence.and.returnValue(nullObservable);

    const appContextService = jasmine.createSpyObj('appContextService', ['getBrowserLang']);
    appContextService.defaultCulture = nullObservable;
    appContextService.userCulture = nullObservable;
    appContextService.getBrowserLang.and.returnValue(nullObservable);

    const translateService = jasmine.createSpyObj('translateService', ['get', 'onLangChange', 'getBrowserLang', 'setDefaultLang', 'use']);
    translateService.onLangChange.and.returnValue(of({ lang: 'en' }));
    translateService.get.and.returnValue(of({ key: 'text' }));
    translateService.use.and.returnValue(of({ res: 'text' }));

    const iconMapperService = jasmine.createSpyObj('iconMapperService', ['getGlobalIconSync']);

    const cnsHelperService = jasmine.createSpyObj('CnsHelperService', ['getCnsLabelsOrdered', 'activeCnsLabel']);
    cnsHelperService.getCnsLabelsOrdered.and.returnValue(['label1', 'label2']);
    cnsHelperService.activeCnsLabel = of('');

    const storageService = jasmine.createSpyObj('storageService',
      ['getStateEx', 'setStateEx', 'resetSnapshotCrc', 'getClientUniqueIdentifierFsid', 'getSnapshotCrc',
        'getSnapshotData', 'setSnapshotData']);
    storageService.getStateEx.and.returnValue({ selectedObjectDesignation: 'sod' });

    const messageBroker = jasmine.createSpyObj('messageBroker', ['getMessage', 'sendMessage', 'getPreselectionService', 'getStorageService']);
    messageBroker.getMessage.and.returnValue(nullObservable);
    messageBroker.sendMessage.and.returnValue(nullObservable);
    messageBroker.getPreselectionService.and.returnValue(nullObservable);
    messageBroker.getStorageService.and.returnValue(storageService);

    const vmsDataService = jasmine.createSpyObj('vmsDataService', ['getOperatingMonitorGroupData', 'getSnapshotData', 'getSelectedNodeData']);
    vmsDataService.getOperatingMonitorGroupData.and.returnValue(monitorGroupDataObservable);
    vmsDataService.getSnapshotData.and.returnValue(snapshoDataObservable);
    vmsDataService.getSelectedNodeData.and.returnValue(selectedNodeDataObservable);

    const tilesView = jasmine.createSpyObj('tilesView', ['onBeforeAttach', 'getScrollTop']);

    const objectManager = jasmine.createSpyObj('objectManager', ['buttonClickOM']);

    const style = jasmine.createSpyObj('containerElement', [], { width: '100', height: '200' });
    const htmlImageElementP3 = jasmine.createSpyObj('htmlImageElement', [], { clientWidth: 100, clientHeight: 200 });
    const htmlImageElementP2 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP3 });
    const htmlImageElementP1 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP2 });
    const htmlImageElement = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP1, style });

    const snapinUtilities = jasmine.createSpyObj('snapinUtilities', ['getElementByName', 'executeCommands', 'getMonitorWallObjects'],
      { resizeObserverSubscription: undefined });
    snapinUtilities.getElementByName.and.returnValue(htmlImageElement);
    snapinUtilities.getMonitorWallObjects.and.returnValue(['mntr1', 'mntr2', 'mntr3']);

    const resizeObserver = jasmine.createSpyObj('resizeObserver', ['observe']);
    let step = 0;
    resizeObserver.observe.and.returnValue(
      new Observable((o: Observer<any>) => {
        if (step === 0) {
          step += 1;
          o.next(of('1'));
        }
      }));

    // -----
    const subscr = jasmine.createSpyObj('subscr', {}, { stateChanged: of(true), changed: of(true) });

    const vmsDataSubscriptionService = jasmine.createSpyObj('vmsDataSubscriptionService',
      ['registerClient', 'subscribeVMSDataChange', 'unsubscribeVMSDataChange', 'getVmsChangeSubscription']);
    vmsDataSubscriptionService.subscribeVMSDataChange.and.returnValue([subscr]);
    vmsDataSubscriptionService.getVmsChangeSubscription.and.returnValue(of([true, true, true]));
    // -----

    beforeEach(() => {
      videoManagementControlComponent = new VideoManagementControlComponent(appContextService, translateService,
        traceService, resizeObserver,
        new Services(videoManagementService, vmsDataService, vmsDataSubscriptionService, objectManager, cnsHelperService, iconMapperService,
          undefined, undefined));

      videoManagementControlComponent.snapInId = new FullSnapInId('', '');
      videoManagementControlComponent.messageBroker = messageBroker;
      videoManagementControlComponent.storageService = storageService;
      videoManagementControlComponent.tilesView = tilesView;

      videoManagementControlComponent.monitorWallData =
          {
            cameraDescription: '', maxClientsNumber: false, monitorDescription: '', monitorGroupDescription: '', monitorGroupId: '',
            objectNotFound: false, videoAPINotReachable: false, videoManagerNotReachable: false, vmsNotReachable: false, videoSourceErrorState: '',
            vmsSynchronizing: false, sinks: [vmsMd1, vmsMd2]
          };
    });

    it('should create new VideoManagementControlComponent', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
    });

    it('should be OK: ngOnInit()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.ngOnInit).toBeDefined();
      //   videoManagementControlComponent.monitorWallData.sinks = [vmsMd1, vmsMd2];
      videoManagementControlComponent.ngOnInit();
    });

    it('should be OK: ngOnDestroy()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.ngOnDestroy).toBeDefined();
      videoManagementControlComponent.monitorWallData.sinks = undefined;
      videoManagementControlComponent.ngOnInit();
      videoManagementControlComponent.ngOnDestroy();
    });

    it('should be OK: onAfterDettach()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.onAfterDettach).toBeDefined();
      videoManagementControlComponent.onAfterDettach();
    });

    it('should be OK: onBeforeAttach()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.onBeforeAttach).toBeDefined();
      videoManagementControlComponent.onBeforeAttach();
    });

    it('should be OK: searchChange()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.searchChange).toBeDefined();
      videoManagementControlComponent.searchChange('searchString');
      videoManagementControlComponent.searchChange(null);
    });

    it('should be OK: onScaleToFit()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.onScaleToFit).toBeDefined();
      videoManagementControlComponent.onScaleToFit(event);
    });

    it('should be OK: onZoomIn()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.onZoomIn).toBeDefined();
      videoManagementControlComponent.onZoomIn(event);
    });

    it('should be OK: onZoomOut()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.onZoomOut).toBeDefined();
      videoManagementControlComponent.onZoomOut(event);
    });

    it('should be OK: refreshSnapshotData()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.refreshSnapshotData).toBeDefined();

      videoManagementControlComponent.refreshSnapshotData();

      videoManagementControlComponent.videoConnected = true;
      videoManagementControlComponent.selectedCameraStatus = '1';
      videoManagementControlComponent.refreshSnapshotData();
    });

    it('should be OK: drawRectangles()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.drawRectangles).toBeDefined();

      videoManagementControlComponent.showSnapshot = false;
      videoManagementControlComponent.drawRectangles();

      videoManagementControlComponent.showSnapshot = true;
      videoManagementControlComponent.videoConnected = false;
      videoManagementControlComponent.videoAligned = false;
      videoManagementControlComponent.drawRectangles();

      videoManagementControlComponent.videoConnected = true;
      videoManagementControlComponent.videoAligned = true;
      videoManagementControlComponent.drawRectangles();

      videoManagementControlComponent.showSnapshot = true;
      videoManagementControlComponent.videoConnected = true;
      videoManagementControlComponent.videoAligned = true;
      videoManagementControlComponent.snapshotData.imageData = 'imageData';
      videoManagementControlComponent.drawRectangles();

      videoManagementControlComponent.showSnapshot = true;
      videoManagementControlComponent.clientRunning = true;
      videoManagementControlComponent.snapinUtilities = snapinUtilities;
      videoManagementControlComponent.drawRectangles();
    });

    it('should be OK: forceUIRefresh()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.forceUIRefresh).toBeDefined();

      videoManagementControlComponent.snapinUtilities = snapinUtilities;
      videoManagementControlComponent.forceUIRefresh();
    });

    it('should be OK: refreshMonitorWallData()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.refreshMonitorWallData).toBeDefined();

      videoManagementControlComponent.showSnapshot = true;
      videoManagementControlComponent.refreshMonitorWallData();

      videoManagementControlComponent.selectedObjectOM = 'GMS_VIDEO_Monitor';
      videoManagementControlComponent.refreshMonitorWallData();

      videoManagementControlComponent.selectedObjectOM = 'GMS_VIDEO_Camera';
      videoManagementControlComponent.refreshMonitorWallData();
    });

    it('should be OK: saveToStorageService()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.saveToStorageService).toBeDefined();
      videoManagementControlComponent.saveToStorageService('designation');
    });

    it('should be OK: connectSelectedObjectCom()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.connectSelectedObjectCom).toBeDefined();
      videoManagementControlComponent.connectSelectedObjectCom();
    });

    it('should be OK: isVideoSourceError()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.isVideoSourceError).toBeDefined();
      expect(videoManagementControlComponent.isVideoSourceError()).toBe(false);
    });

    it('should be OK: manageLocalization()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.manageLocalization).toBeDefined();

      appContextService.defaultCulture = defaultCultureObservable;
      appContextService.userCulture = userCultureObservable;
      videoManagementControlComponent.manageLocalization();

      appContextService.defaultCulture = nullObservable;
      appContextService.userCulture = nullObservable;
      videoManagementControlComponent.manageLocalization();
    });

    it('should be OK: buttonClickOM()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      expect(videoManagementControlComponent.buttonClickOM).toBeDefined();

      videoManagementControlComponent.monitorWallTiles.svgobjName = {
        svgobjName: '', position: 0, monitorGroupDescription: 'monitorGroupDescription',
        monitorName: '', monitorDescription: '', monitorStatus: MonitorStatus.ConnectStream,
        monitorTitle: '', cameraName: '', cameraDescription: '', cameraTitle: '', hasS1Command: false, hasSNCommand: false, hasPlayBack: false
      };

      objectManager.buttonClickOM.and.returnValue(of(undefined));
      videoManagementControlComponent.buttonClickOM('name', 'svgobjName');

      objectManager.buttonClickOM.and.returnValue(of('unknown'));
      videoManagementControlComponent.buttonClickOM('name', 'svgobjName');

      objectManager.buttonClickOM.and.returnValue(of(['VC', 'cameraName', 'src2']));
      videoManagementControlComponent.buttonClickOM('name', 'svgobjName');

      objectManager.buttonClickOM.and.returnValue(of(['VCG']));
      videoManagementControlComponent.buttonClickOM('name', 'svgobjName');

      objectManager.buttonClickOM.and.returnValue(of(['SEQ']));
      videoManagementControlComponent.buttonClickOM('name', 'svgobjName');
    });

    it('should be OK: getErrorIcon()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      // @ts-ignore
      expect(videoManagementControlComponent.getErrorIcon).toBeDefined();
      // @ts-ignore
      expect(videoManagementControlComponent.getErrorIcon()).toBe('');

      videoManagementControlComponent.errorMessage = 'errorMessage';
      videoManagementControlComponent.cameraIcon = 'cameraIcon';
      videoManagementControlComponent.monitorIcon = 'monitorIcon';

      videoManagementControlComponent.selectedObjectOM = 'GMS_VIDEO_Monitor';
      // @ts-ignore
      expect(videoManagementControlComponent.getErrorIcon()).toBe('monitorIcon');

      videoManagementControlComponent.selectedObjectOM = 'GMS_VIDEO_Camera';
      // @ts-ignore
      expect(videoManagementControlComponent.getErrorIcon()).toBe('cameraIcon');
    });

    it('should be OK: setErrorMessage()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      // @ts-ignore
      expect(videoManagementControlComponent.setErrorMessage).toBeDefined();

      // @ts-ignore
      expect(videoManagementControlComponent.setErrorMessage(undefined)).toBe(undefined);

      // @ts-ignore
      expect(videoManagementControlComponent.setErrorMessage('errorMessage')).toBe(undefined);
    });

    it('should be OK: init()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      // @ts-ignore
      expect(videoManagementControlComponent.init).toBeDefined();

      // @ts-ignore
      expect(videoManagementControlComponent.init()).toBe(undefined);
    });

    it('should be OK: cleanUp()', () => {
      expect(videoManagementControlComponent instanceof VideoManagementControlComponent).toBe(true);
      expect(videoManagementControlComponent).toBeDefined();
      // @ts-ignore
      expect(videoManagementControlComponent.cleanUp).toBeDefined();

      // @ts-ignore
      expect(videoManagementControlComponent.cleanUp()).toBe(undefined);
    });
  });
});

describe('Test ObjectManager class', () => {
  let step = 0;

  // for stubbing Observables
  /* eslint-disable @typescript-eslint/naming-convention */
  const objectManagerServiceModalResult1 =
        { action: 2, selection: [{ Attributes: { ObjectModelName: 'GMS_VIDEO_Camera' } }] };
  const objectManagerServiceModalResult2 =
        { action: 2, selection: [{ Attributes: { ObjectModelName: 'GMS_VIDEO_CameraGroup' } }] };
  const objectManagerServiceModalResult3 =
        { action: 2, selection: [{ Attributes: { ObjectModelName: 'GMS_VIDEO_Sequence' } }] };
  const objectManagerServiceModalResult4 =
        { action: 2, selection: [{ Attributes: { ObjectModelName: 'unknown' } }] };
  /* eslint-enable @typescript-eslint/naming-convention */

  // variables to instantiate ObjectManager instance
  let objectManager: ObjectManager;

  // mocks
  const traceService = jasmine.createSpyObj('traceService', ['info', 'debug', 'warn', 'error']);

  const objectManagerService = jasmine.createSpyObj('objectManagerService', ['show']);
  objectManagerService.show.and.returnValue(
    new Observable((o: Observer<any>) => {
      switch (step) {
        case 0:
          o.next(objectManagerServiceModalResult1);
          break;
        case 1:
          o.next(objectManagerServiceModalResult2);
          break;
        case 2:
          o.next(objectManagerServiceModalResult3);
          break;
        case 3:
        default:
          o.next(objectManagerServiceModalResult4);
          break;
      }
      o.complete();
    }));

  beforeEach(() => {
    objectManager = new ObjectManager(traceService);
  });

  it('should create new ObjectManager', () => {
    expect(objectManager instanceof ObjectManager).toBe(true);
    expect(objectManager).toBeDefined();
  });

  it('should be OK: buttonClickOM()', () => {
    expect(objectManager instanceof ObjectManager).toBe(true);
    expect(objectManager).toBeDefined();
    expect(objectManager.buttonClickOM).toBeDefined();

    step = 0;
    objectManager.buttonClickOM(objectManagerService, 'A_CG', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toBeDefined();
        expect(selectedObject.length === 3).toBe(true);
        expect(selectedObject[0] === 'VC').toBe(true);
      });

    step = 1;
    objectManager.buttonClickOM(objectManagerService, 'A_Se', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toBeDefined();
        expect(selectedObject.length === 3).toBe(true);
        expect(selectedObject[0] === 'VCG').toBe(true);
      });

    step = 2;
    objectManager.buttonClickOM(objectManagerService, 'A_Ca', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toBeDefined();
        expect(selectedObject.length === 3).toBe(true);
        expect(selectedObject[0] === 'SEQ').toBe(true);
      });

    step = 3;
    objectManager.buttonClickOM(objectManagerService, 'A', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toThrowError();
      },
      error => {
        expect(error).toBeUndefined();
      });

    step = 4;
    objectManager.buttonClickOM(objectManagerService, 'A_MR', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toThrowError();
      },
      error => {
        expect(error).toBeUndefined();
      });

    step = 5;
    objectManager.buttonClickOM(objectManagerService, 'unknown', 'dialogtitle', 'systemName', 'selectedObjectName').
      subscribe(selectedObject => {
        expect(selectedObject).toThrowError();
      },
      error => {
        expect(error).toBeUndefined();
      });
  });
});

describe('Localization Test manageLocalization - TODO', () => {
  const tString = 'Camera';

  const mockTranslateService: any = jasmine.createSpyObj('TranslateService', ['get', 'onLangChange', 'getBrowserLang', 'setDefaultLang']);
  mockTranslateService.onLangChange.and.returnValue(of({ lang: 'en' }));
  mockTranslateService.setDefaultLang('en');
  mockTranslateService.get.and.returnValue(of('Camera'));

  const mockAppContextService: any = jasmine.createSpyObj('AppContextService', ['setDefaultCulture', 'setUserCulture']);

  // TO DO
  // copy from: ...\gms-snapins\projects\graphics-viewer\src\snapin\graphics-viewer-snapin.component.spec.ts
  // const mockTranslateService: any = jasmine.createSpyObj("mockTranslateService", ["get", "onLangChange","getBrowserLang", "setDefaultLang"]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VideoManagementControlComponent,
        // internationalisation
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: AppContextService, useValue: mockAppContextService }
      ]
    });
  });

  describe('Mock Translated service', () => {
    it('Translated CAMERA should be set', () => {
      mockTranslateService.get().subscribe(translatedString => {
        expect(translatedString).toBeDefined();
        // three different ways to compare the translatedString with tString
        expect(translatedString === tString).toBeTrue();
        expect(translatedString === tString).toBeTrue();
        expect(translatedString).toEqual(tString);
      });
    });
  });

  describe('Mock appContextService', () => {
    it('xxxxxx', () => {
      mockTranslateService.get().subscribe(translatedString => {
        expect(translatedString).toBeDefined();
        // three different ways to compare the translatedString with tString
        expect(translatedString === tString).toBeTrue();
        expect(translatedString === tString).toBeTrue();
        expect(translatedString).toEqual(tString);
      });
    });
  });
});
