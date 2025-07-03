import { CnsHelperService, CnsLabel, CnsLabelEn, ExecuteCommandServiceBase, SiIconMapperService, SystemBrowserServiceBase, SystemBrowserSubscriptionServiceBase,
  ValueServiceBase, ValueSubscription2ServiceBase } from '@gms-flex/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Observer, of } from 'rxjs';

import { VideoManagementService } from '../services/video-management.service';
import { VMSDataService } from '../services/videos';
import { VMSDataSubscriptionService } from '../services/videos-subscriptions';
import { MonitorColorsUtilities, MonitorStatus, SequenceStatus, VMSMonitorData, VMSMonitorWallData } from '../services/videos/vms.data.model';
import { SnapinUtilities } from './control-utilities';
import { NodeType } from './nodes';
import { ObjectManager } from './object-manager';
import { Services, VideoManagementControlComponent } from './video-management-control.component';

/** local types */
type MonitorWallTile = {
  svgobjName: string;
  position: number;
  monitorGroupDescription: string;
  monitorName: string;
  monitorDescription: string;
  monitorTitle: string;
  monitorStatus: MonitorStatus;
  cameraName: string;
  cameraDescription: string;
  cameraTitle: string;
  hasS1Command: boolean; // Sequence 1
  hasSNCommand: boolean; // Sequence N
  hasPlayBack: boolean;
};

describe('Test SnapinUtilities class', () => {
  let snapinUtilities: SnapinUtilities;

  // isSameData variables
  const d1: VMSMonitorWallData = {
    cameraDescription: 'cam1',
    monitorDescription: 'mon1',
    monitorGroupDescription: 'mngr1',
    monitorGroupId: '1',
    videoSourceErrorState: 'NoError',
    objectNotFound: false,
    videoAPINotReachable: false,
    videoManagerNotReachable: false,
    vmsNotReachable: false,
    vmsSynchronizing: false,
    maxClientsNumber: false,
    sinks: [
      { monitorDescription: 'mon1', monitorStatus: MonitorStatus.NotDefined, cameraName: '1', cameraDescription: 'cam1',
        hasPlayback: false, id: '1', sequenceStatus: SequenceStatus.NoSequenceActive },
      { monitorDescription: 'mon2', monitorStatus: MonitorStatus.ConnectStream, cameraName: '2', cameraDescription: 'cam2',
        hasPlayback: false, id: '2', sequenceStatus: SequenceStatus.NoSequenceActive }
    ]
  };
  const d2: VMSMonitorWallData = {
    cameraDescription: 'cam2',
    monitorDescription: 'mon2',
    monitorGroupDescription: 'mngr2',
    monitorGroupId: '2',
    videoSourceErrorState: 'NoError',
    objectNotFound: false,
    videoAPINotReachable: false,
    videoManagerNotReachable: false,
    vmsNotReachable: false,
    vmsSynchronizing: false,
    maxClientsNumber: false,
    sinks: [
      { monitorDescription: 'mon1', monitorStatus: MonitorStatus.NotDefined, cameraName: '1', cameraDescription: 'cam1',
        hasPlayback: false, id: '1', sequenceStatus: SequenceStatus.NoSequenceActive },
      { monitorDescription: 'mon2', monitorStatus: MonitorStatus.ConnectStream, cameraName: '2', cameraDescription: 'cam2',
        hasPlayback: false, id: '2', sequenceStatus: SequenceStatus.NoSequenceActive }
    ]
  };

  let translateService: TranslateService;
  let videoManagementService: VideoManagementService;
  let vmsDataService: VMSDataService;
  let vmsDataSubscriptionService: VMSDataSubscriptionService;
  let objectManager: ObjectManager;
  let cnsHelperService: CnsHelperService;
  let iconMapperService: SiIconMapperService;
  let executeCommandService: ExecuteCommandServiceBase;
  let valueService: ValueServiceBase;
  let valueSubscription2Service: ValueSubscription2ServiceBase;
  let systemBrowserService: SystemBrowserServiceBase;
  let systemBrowserSubscriptionService: SystemBrowserSubscriptionServiceBase;

  const mockTraceService = jasmine.createSpyObj('mocktraceService', ['debug', 'info']);
  let videoManagementControlComp: VideoManagementControlComponent;

  const defaultFrameSpacing = 500;

  // isMatch variables
  const t1 = 'tile1';
  const t2 = 'tile2';
  const filter = 'tile';
  const filter2 = 'cam';
  const d1ToStringArray = ['Video', 'mntr1', 'mntr2', 'mngr1'];
  const mon1ToStringArray = ['Video', 'mntr1'];
  const mockTranslateService: any = jasmine.createSpyObj('TranslateService', ['get', 'onLangChange', 'getBrowserLang', 'setDefaultLang']);
  mockTranslateService.onLangChange.and.returnValue(of({ lang: 'en' }));
  mockTranslateService.setDefaultLang('en');
  mockTranslateService.get.and.returnValue(of('Camera'));

  const mockProductService = jasmine.createSpyObj('mockProductService', ['getProductSettings']);
  const appContextService = jasmine.createSpyObj('appContextService', {}, { defaultCulture: of('english') });

  const httpPost = new Observable<boolean>();
  const httpRequest = new Observable<boolean>();
  let httpGet: any;
  const httpClient = jasmine.createSpyObj('httpClient', ['post', 'request', 'get']);
  httpClient.post.and.returnValue(httpPost);
  httpClient.request.and.returnValue(httpRequest);
  httpClient.get.and.returnValue(httpGet);

  const notReachable = '*NotReachable';

  beforeEach(() => {
    const mockResizeObserver = jasmine.createSpyObj('mockResizeObserver', ['observe']);
    let step = 0;
    mockResizeObserver.observe.and.returnValue(
      new Observable((o: Observer<any>) => {
        if (step === 0) {
          step += 1;
          o.next(of('1'));
        }
      }));

    videoManagementService = new VideoManagementService(
      executeCommandService, valueService, valueSubscription2Service, systemBrowserService, systemBrowserSubscriptionService,
      null, // US2167680
      mockTraceService);

    videoManagementControlComp = new VideoManagementControlComponent(
      appContextService, translateService, mockTraceService, mockResizeObserver,
      new Services(videoManagementService, vmsDataService, vmsDataSubscriptionService,
        objectManager, cnsHelperService, iconMapperService, undefined, undefined));

    videoManagementControlComp.entries = ['mntr1'];

    videoManagementControlComp.monitorWallTiles.mntr1 = {
      svgobjName: 'mntr1',
      position: 1,
      monitorGroupDescription: 'mngr1Descr',
      monitorName: '1',
      monitorDescription: 'mon1Descr',
      monitorTitle: 'mon1Title',
      monitorStatus: MonitorStatus.StreamNotAvailable,
      cameraName: 'src1',
      cameraDescription: 'cam1Descr',
      cameraTitle: 'cam1Title',
      hasS1Command: false, // Sequence 1
      hasSNCommand: false, // Sequence N
      hasPlayBack: false
    };

    snapinUtilities = videoManagementControlComp.snapinUtilities;
    videoManagementControlComp.selectedObjectName = 'mntr1';
    // videoManagementControlComp.manageLocalization();
  });

  describe('Test showSnapshotImage and executeCommands methods', () => {

    let htmlImageElement: HTMLImageElement;
    let htmlImageElementP1: HTMLImageElement;
    let htmlImageElementP2: HTMLImageElement;
    let htmlImageElementP3: HTMLImageElement;
    let htmlImageElementP4: HTMLImageElement;
    let htmlImageElementP5: HTMLImageElement;
    let htmlImageElementP6: HTMLImageElement;
    let htmlImageElementP7: HTMLImageElement;

    let htmlImageElement2: HTMLImageElement;
    let htmlImageElementP12: HTMLImageElement;
    let htmlImageElementP22: HTMLImageElement;
    let htmlImageElementP32: HTMLImageElement;

    let button: HTMLElement;
    beforeEach(() => {

      const style = jasmine.createSpyObj('containerElement', [], { width: '100', height: '200', bottom: '300' });

      htmlImageElementP7 = jasmine.createSpyObj('htmlImageElement', [], { clientWidth: 100, clientHeight: 200 });
      htmlImageElementP6 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP7 });
      htmlImageElementP5 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP6 });
      htmlImageElementP4 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP5 });
      htmlImageElementP3 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP4 });
      htmlImageElementP2 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP3 });
      htmlImageElementP1 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP2, style });
      htmlImageElement = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP1, style });

      htmlImageElementP32 = jasmine.createSpyObj('htmlImageElement', [], { clientWidth: 100, clientHeight: 200 });
      htmlImageElementP22 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP32 });
      htmlImageElementP12 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP22, style });
      htmlImageElement2 = jasmine.createSpyObj('htmlImageElement', [], { parentElement: htmlImageElementP12, style });

      button = jasmine.createSpyObj('button', [], { style });
      spyOn(snapinUtilities, 'getElementByName').withArgs('Snapshot').and.returnValue(htmlImageElement)
        .withArgs('SnapshotButtons').and.returnValue(button)
        .withArgs('videoTilesViewControl').and.returnValue(htmlImageElement2)
        .withArgs('SnapshotDiv').and.returnValue(htmlImageElement2)
        .withArgs('hfw-panel-navigation').and.returnValue(htmlImageElement2);
    });

    it('should be called: showSnapshotImage', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();
      expect(snapinUtilities.startRefreshSnapshot).toBeDefined();

      snapinUtilities.showSnapshotImage();
    });

    it('should be OK: executeXCommand', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      // videoManagementControlComp.monitorWallTiles.mntr1;
      snapinUtilities.executeXCommand('mntr1');
    });

    it('should be OK: executeOCommand', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      snapinUtilities.executeOCommand('mntr1');
    });

    it('should be OK: executeA_CaCommand', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      snapinUtilities.executeCommand('A_Ca', 'mntr1');
    });

    it('should be OK: executeA_CGCommand', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      snapinUtilities.executeCommand('A_CG', 'mntr1');
    });

    it('should be OK: executeSeCommand', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      snapinUtilities.executeCommand('A_Se', 'mntr1');
    });

    it('should be OK: setActions and executeCommands', () => {
      expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
      expect(snapinUtilities).toBeDefined();

      const monitorStatus = videoManagementControlComp.monitorWallTiles.mntr1.monitorStatus;
      const hasS1Command = videoManagementControlComp.monitorWallTiles.mntr1.hasS1Command;
      const hasSNCommand = videoManagementControlComp.monitorWallTiles.mntr1.hasSNCommand;
      const hasOCommand = hasS1Command || hasSNCommand;
      const hasPlayBack = videoManagementControlComp.monitorWallTiles.mntr1.hasPlayBack && (monitorStatus !== MonitorStatus.DisconnectStream);
      const color = MonitorColorsUtilities.getMonitorColor(monitorStatus);
      const colorX = MonitorColorsUtilities.getCommandColor(color !== 'black', monitorStatus);
      const colorO = MonitorColorsUtilities.getCommandColor(hasOCommand, monitorStatus);
      const colorPB = MonitorColorsUtilities.getCommandColor(hasPlayBack, monitorStatus);

      const name = videoManagementControlComp.monitorWallTiles.mntr1.monitorName;
      const descriptor = videoManagementControlComp.monitorWallTiles.mntr1.monitorDescription;
      const title = videoManagementControlComp.monitorWallTiles.mntr1.monitorTitle;
      const source = color !== 'black' ? videoManagementControlComp.monitorWallTiles.mntr1.cameraTitle : '';
      const sequenceRunning = (hasS1Command || hasSNCommand) && color !== 'black';
      const connected = color !== 'black';

      const node: NodeType = {
        name,
        descriptor,
        title,
        source,
        color,
        colorX,
        colorPB: hasPlayBack ? colorPB : color,
        colorS1: hasS1Command && sequenceRunning ? colorO : color,
        colorS1N: sequenceRunning ? colorO : color,
        tooltip: '',
        actions: [],
        actionsStatus: 1,
        location: 'here',
        designation: 'there',
        cameraIcon: '',
        sequenceIcon: ''
      };

      snapinUtilities.setActions(node, name, descriptor, connected, sequenceRunning);
      snapinUtilities.executeCommands();
    });
  });

  // manageLocalization

  it('should be called: startRefreshSnapshot', () => {
    expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
    expect(snapinUtilities).toBeDefined();
    expect(snapinUtilities.startRefreshSnapshot).toBeDefined();
    snapinUtilities.startRefreshSnapshot();
  });

  it('should be called: startRefreshSnapshot and stopRefreshSnapshot', () => {
    expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
    expect(snapinUtilities).toBeDefined();
    expect(snapinUtilities.stopRefreshSnapshot).toBeDefined();
    snapinUtilities.startRefreshSnapshot();
    snapinUtilities.stopRefreshSnapshot();
  });

  it('should be called: showSnapshotImage', () => {
    expect(snapinUtilities instanceof SnapinUtilities).toBe(true);
    expect(snapinUtilities).toBeDefined();
    expect(snapinUtilities.showSnapshotImage).toBeDefined();
    snapinUtilities.showSnapshotImage();
  });

  it('should be OK: isSameData() is true', () => {
    expect(snapinUtilities.isSameData(d1, d1)).toBeTrue();
  });

  it('should be OK: isSameData() is false', () => {
    expect(snapinUtilities.isSameData(d1, d2)).not.toBeTrue();
  });

  it('should match be true: isMatch', () => {
    expect(snapinUtilities.isMatch(t1, t2, filter)).toBeTrue();
  });

  it('should match be false: isMatch', () => {
    expect(snapinUtilities.isMatch(t1, t2, filter2)).not.toBeTrue();
  });

  it('should be OK: getObjectNames', () => {
    const sinkGroupMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    sinkGroupMap.set('mngr1', new Map<string, string>());
    sinkGroupMap.set('mntr1', new Map<string, string>());
    sinkGroupMap.set('src1', new Map<string, string>());
    sinkGroupMap.set('mntr2', new Map<string, string>());
    sinkGroupMap.set('src2', new Map<string, string>());

    expect(snapinUtilities.getObjectNames(d1)).toEqual(sinkGroupMap);
  });

  it('should be OK: setObjectNames', () => {
    const sinkGroupMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    const map1 = new Map<string, string>();
    const map2 = new Map<string, string>();
    const map3 = new Map<string, string>();
    map1.set('System1.Application View:Applications.Video.Monitor Groups.Gruppo_001.mngr1', 'mngr1');
    map2.set('System1.Application View:Applications.Video.Monitor Groups.Gruppo_001.mngr1.mon1', 'mon1');
    map3.set('System1.Application View:Applications.Video.Monitor Groups.Gruppo_001.mngr2', 'mngr2');

    sinkGroupMap.set('mngr1', map1);
    sinkGroupMap.set('mntr1', map2);
    sinkGroupMap.set('src1', new Map<string, string>());
    sinkGroupMap.set('mntr2', map3);
    sinkGroupMap.set('src2', new Map<string, string>());

    expect(snapinUtilities.setObjectNames(d1, sinkGroupMap)).toEqual('mngr1');
  });

  it('should be OK: assignHeading', () => {
    snapinUtilities.assignHeading(undefined);

    expect(videoManagementControlComp.entries.length).toBeGreaterThan(0);
    videoManagementControlComp.entries.forEach(entry => {
      expect(videoManagementControlComp.monitorWallTiles[entry].monitorTitle === videoManagementControlComp.monitorWallTiles[entry].monitorName).toBeTrue();
    });

    snapinUtilities.assignHeading(new CnsLabel(CnsLabelEn.Description, null, null));

    expect(videoManagementControlComp.entries.length).toBeGreaterThan(0);
    videoManagementControlComp.entries.forEach(entry => {

      expect(videoManagementControlComp.monitorWallTiles[entry].monitorTitle ===
             videoManagementControlComp.monitorWallTiles[entry].monitorDescription
      ).toBeTrue();

      expect(videoManagementControlComp.monitorWallTiles[entry].cameraTitle ===
             videoManagementControlComp.monitorWallTiles[entry].cameraDescription
      ).toBeTrue();
    });

    snapinUtilities.assignHeading(new CnsLabel(CnsLabelEn.Name, null, null));

    expect(videoManagementControlComp.entries.length).toBeGreaterThan(0);
    videoManagementControlComp.entries.forEach(entry => {

      expect(videoManagementControlComp.monitorWallTiles[entry].monitorTitle ===
             videoManagementControlComp.monitorWallTiles[entry].monitorName
      ).toBeTrue();

      expect(videoManagementControlComp.monitorWallTiles[entry].cameraTitle ===
             videoManagementControlComp.monitorWallTiles[entry].cameraName
      ).toBeTrue();
    });
  });

  it('should be OK: getFrameSpacing with valid frame spacing value', () => {

    // --------------------------------------------------------------------
    // FIRST MODE: CLONE VideoManagementService
    // --------------------------------------------------------------------
    /*
    const mockVideoManagementService = jasmine.createSpyObj('videoManagementService', ['getFrameSpacing']);

    const mockResizeObserver = jasmine.createSpyObj('mockResizeObserver', ['observe']);
    let step = 0;
    mockResizeObserver.observe.and.returnValue(
      new Observable((o: Observer<any>) => {
        if (step === 0) {
          step += 1;
          o.next(of('1'));
        }
      }));

    const localVideoManagementControlComponent = new VideoManagementControlComponent(
      appContextService, translateService, mockVideoManagementService, vmsDataService, vmsDataSubscriptionService,
      objectManager, cnsHelperService, iconMapperService, mockTraceService, mockResizeObserver);

    mockVideoManagementService.getFrameSpacing.and.returnValue(of('123'));

    localVideoManagementControlComponent.snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(localVideoManagementControlComponent.snapinUtilities.frameSpacing === 123).toBeTrue();
    });

    mockVideoManagementService.getFrameSpacing.and.returnValue(of('0'));
    // spyOn(localVideoManagementControlComponent, 'getFrameSpacing').and.returnValue(of('0'));
    localVideoManagementControlComponent.snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(localVideoManagementControlComponent.snapinUtilities.frameSpacing === defaultFrameSpacing).toBeTrue();
    });

    mockVideoManagementService.getFrameSpacing.and.returnValue(of('badvalue'));
    // spyOn(localVideoManagementControlComponent, 'getFrameSpacing').and.returnValue(of('badvalue'));
    localVideoManagementControlComponent.snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(localVideoManagementControlComponent.snapinUtilities.frameSpacing === defaultFrameSpacing).toBeTrue();
    });
  */

    // --------------------------------------------------------------------
    // SECOND MODE: CLONE VideoManagementService
    // --------------------------------------------------------------------

    spyOn(videoManagementService, 'getFrameSpacing').and.returnValue(of('123'));
    snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(snapinUtilities.frameSpacing === 123).toBeTrue();
    });

    /*
    //spyOn(videoManagementService, 'getFrameSpacing').and.returnValue(mockedValue);
    snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(snapinUtilities.frameSpacing === defaultFrameSpacing).toBeTrue();
    });

    spyOn(videoManagementService, 'getFrameSpacing').and.returnValue(of('badvalue'));
    snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(snapinUtilities.frameSpacing).toBeNaN();
    });
    */
  });

  it('should be OK: getFrameSpacing with out-of-range frame spacing value ', () => {

    spyOn(videoManagementService, 'getFrameSpacing').and.returnValue(of('0'));
    snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(snapinUtilities.frameSpacing === defaultFrameSpacing).toBeTrue();
    });

  });

  it('should be OK: getFrameSpacing with invalid frame spacing value ', () => {

    spyOn(videoManagementService, 'getFrameSpacing').and.returnValue(of('badvalue'));
    snapinUtilities.getFrameSpacing().subscribe(observable => {
      expect(snapinUtilities.frameSpacing === defaultFrameSpacing).toBeTrue();
    });

  });

  it('should be OK: getVideosourceErrorMsg', () => {

    expect(snapinUtilities.getVideosourceErrorMsg(notReachable) === '').toBeTrue();
    expect(snapinUtilities.getVideosourceErrorMsg('')).toBeUndefined();

  });

  describe('Test getMonitorWallObjects method', () => {

    beforeEach(() => {
      videoManagementControlComp.monitorWallData = d1;
    });

    it('should get a string with sinks data defined: getMonitorWallObjects', () => {
      expect(snapinUtilities.getMonitorWallObjects()).toEqual(d1ToStringArray);
    });
  });

  describe('Test getMonitorWallObjects method', () => {
    beforeEach(() => {
      const monitorData: any = new VMSMonitorData();
      monitorData.id = '1';
      videoManagementControlComp.monitorWallData = monitorData;
    });

    it('should get a string with sinks data undefined: getMonitorWallObjects', () => {
      expect(snapinUtilities.getMonitorWallObjects()).toEqual(mon1ToStringArray);
    });
  });
});
