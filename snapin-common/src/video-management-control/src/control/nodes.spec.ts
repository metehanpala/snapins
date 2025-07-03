import { MenuItem } from '@gms-flex/core';

import { NodeType, NodeUtilities } from './nodes';

describe('VideoManagementControlComponent', () => {
  const action1: MenuItem = new MenuItem('MenuItem1');
  const action2: MenuItem = new MenuItem('MenuItem2');
  const source: NodeType = {
    name: 'name',
    descriptor: 'descriptor',
    title: 'title',
    source: 'source',
    color: 'color',
    colorX: 'colorX',
    colorPB: 'colorPB',
    colorS1: 'colorS1',
    colorS1N: 'colorS1N',
    tooltip: 'tooltip',
    actions: [action1, action2],
    actionsStatus: 0,
    location: 'location',
    designation: 'designation',
    cameraIcon: 'cameraIcon',
    sequenceIcon: 'sequenceIcon'
  };

  describe('Test NodeUtilities class', () => {
    let dest: NodeType;

    beforeEach(() => {
      dest = {
        name: '',
        descriptor: '',
        title: '',
        source: '',
        color: '',
        colorX: '',
        colorPB: '',
        colorS1: '',
        colorS1N: '',
        tooltip: '',
        actions: [],
        actionsStatus: 0,
        location: '',
        designation: '',
        cameraIcon: '',
        sequenceIcon: ''
      };
    });

    it('should be OK: copyNode() 1', () => {
      dest.actionsStatus = 0;
      NodeUtilities.copyNode(dest, source);

      expect(dest.name === 'name').toBeTrue();
      expect(dest.descriptor === 'descriptor').toBeTrue();
      expect(dest.title === 'title').toBeTrue();
      expect(dest.source === 'source').toBeTrue();
      expect(dest.color === 'color').toBeTrue();
      expect(dest.colorX === 'colorX').toBeTrue();
      expect(dest.colorPB === 'colorPB').toBeTrue();
      expect(dest.colorS1 === 'colorS1').toBeTrue();
      expect(dest.colorS1N === 'colorS1N').toBeTrue();
      expect(dest.tooltip === 'tooltip').toBeTrue();
      expect(dest.actionsStatus === 1).toBeTrue();
      expect(dest.location === 'location').toBeTrue();
      expect(dest.designation === 'designation').toBeTrue();
      expect(dest.cameraIcon === 'cameraIcon').toBeTrue();
      expect(dest.sequenceIcon === 'sequenceIcon').toBeTrue();
      expect(dest.actions.length === 1).toBe(true);
    });

    it('should be OK: copyNode() 2', () => {
      dest.actionsStatus = 1;
      NodeUtilities.copyNode(dest, source);

      expect(dest.name === 'name').toBeTrue();
      expect(dest.descriptor === 'descriptor').toBeTrue();
      expect(dest.title === 'title').toBeTrue();
      expect(dest.source === 'source').toBeTrue();
      expect(dest.color === 'color').toBeTrue();
      expect(dest.colorX === 'colorX').toBeTrue();
      expect(dest.colorPB === 'colorPB').toBeTrue();
      expect(dest.colorS1 === 'colorS1').toBeTrue();
      expect(dest.colorS1N === 'colorS1N').toBeTrue();
      expect(dest.tooltip === 'tooltip').toBeTrue();
      expect(dest.actionsStatus === 1).toBeTrue();
      expect(dest.location === 'location').toBeTrue();
      expect(dest.designation === 'designation').toBeTrue();
      expect(dest.cameraIcon === 'cameraIcon').toBeTrue();
      expect(dest.sequenceIcon === 'sequenceIcon').toBeTrue();
      expect(dest.actions.length === 2).toBe(true);
    });
  });
});
