import { ComponentFixture } from '@angular/core/testing';
import { ObjectManagerViewModel } from './object-manager-vm';
import { AggregateViewId } from '@gms-flex/snapin-common';
import { NgZone } from '@angular/core';
import { ViewType } from '@gms-flex/services';
import { BehaviorSubject } from 'rxjs';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

describe('ObjectManagerViewModel', () => {

  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  let fixture: ComponentFixture<ObjectManagerViewModel>;
  let comp: ObjectManagerViewModel;
  const mockTraceService = new MockTraceService() as TraceService;
  const mockSvcBlk: any = jasmine.createSpyObj('mockSvcBlk', ['cnsHelperService']);
  const id = 'id';
  const ngZone: NgZone = new NgZone({});
  const mockCore: any = jasmine.createSpyObj('mockCore', ['coreViewListModified']);
  mockCore.coreViewListModified = nullObservable;
  mockSvcBlk.cnsHelperService = nullObservable;

  describe('initialization', () => {
    it('testing setting selected view id', () => {
      const viewModel: ObjectManagerViewModel = new ObjectManagerViewModel(mockTraceService, mockSvcBlk, id, ngZone, mockCore);
      const aggregateViewID = new AggregateViewId(ViewType.Management, 'Management View');
      viewModel.setSelectedView(aggregateViewID);
      expect(viewModel).toBeDefined();
    });

    // it('should set isActive on initialization', () => {
    //   const viewModel: ObjectManagerViewModel = new ObjectManagerViewModel(mockTraceService, mockSvcBlk, id, ngZone, mockCore);
    //   viewModel.active = true;
    //   expect(viewModel.isActive).toEqual(viewModel.active);
    // });
  });
});
