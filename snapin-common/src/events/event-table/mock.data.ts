/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
import { GridData } from '../event-data.model';
import { EventColors } from '@gms-flex/services';
export const initColsData = `version5.0-eventIcon,true,100;cause,true,300;state,true,120;creationTime,true,170;srcSource,true,100;belongsTo,true,100;timer,true,150;srcPath,true,100;commands,true,201;-state, 0, 2;categoryDescriptor, 0, 2;creationTime, 0, 1;`;

export const fixedCols = [
  'eventIcon',
  undefined,
  'state',
  'creationTime',
  'timer',
  undefined,
  undefined,
  undefined,
  'commands'
];

export const colDataVersion = 'version5.0';
export const colDataOrdering = `eventIcon,true,100;cause,true,300;state,true,120;creationTime,true,170;srcSource,true,100;belongsTo,true,100;timer,true,150;srcPath,true,100;commands,true,201;`;
export const colDataSorting = 'state, 0, 2;categoryDescriptor, 0, 2;creationTime, 0, 1;';

export const colDataOrderingArr: string[] = [
  'eventIcon,true,100',
  'cause,true,300',
  'state,true,120',
  'creationTime,true,170',
  'srcSource,true,100',
  'belongsTo,true,100',
  'timer,true,150',
  'srcPath,true,100',
  'commands,true,201'
];

/**
 * @Inputs
 */

export const fullSnapinID = { frameId: 'event-list', snapInId: 'el', fullId: (): string => 'event' };
export const headerData = [
  {
    'id': 'eventIcon',
    'label': 'Discipline / Category',
    'columnType': 2,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': true,
    'widthPercentage': 100,
    'allowSorting': false,
    'sortingDirection': 0
  },
  {
    'id': 'cause',
    'label': 'Event Cause',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 300,
    'isFixedSize': false,
    'widthPercentage': 300,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'state',
    'label': 'State',
    'columnType': 3,
    'columnVisible': true,
    'minColWidth': 120,
    'isFixedSize': true,
    'widthPercentage': 120,
    'allowSorting': true,
    'sortingDirection': 2
  },
  {
    'id': 'creationTime',
    'label': 'Date/Time',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 170,
    'isFixedSize': true,
    'widthPercentage': 170,
    'allowSorting': true,
    'sortingDirection': 1
  },
  {
    'id': 'srcSource',
    'label': 'Source',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'belongsTo',
    'label': 'Belongs To',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'timer',
    'label': 'Timer',
    'columnVisible': true,
    'minColWidth': 150,
    'isFixedSize': true,
    'widthPercentage': 150,
    'allowSorting': false,
    'sortingDirection': 0
  },
  {
    'id': 'srcPath',
    'label': 'Path',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'commands',
    'label': 'Commands',
    'columnType': 6,
    'columnVisible': true,
    'minColWidth': 238,
    'isFixedSize': true,
    'widthPercentage': 201,
    'allowSorting': false,
    'sortingDirection': 0
  }
];

export const hdrData = [
  {
    'id': 'eventIcon',
    'label': 'Discipline / Category',
    'columnType': 2,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': true,
    'widthPercentage': 100,
    'allowSorting': false,
    'sortingDirection': 0
  },
  {
    'id': 'cause',
    'label': 'Event Cause',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 300,
    'isFixedSize': false,
    'widthPercentage': 300,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'state',
    'label': 'State',
    'columnType': 3,
    'columnVisible': true,
    'minColWidth': 120,
    'isFixedSize': true,
    'widthPercentage': 120,
    'allowSorting': true,
    'sortingDirection': 2
  },
  {
    'id': 'creationTime',
    'label': 'Date/Time',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 170,
    'isFixedSize': true,
    'widthPercentage': 170,
    'allowSorting': true,
    'sortingDirection': 1
  },
  {
    'id': 'timer',
    'label': 'Timer',
    'columnVisible': true,
    'minColWidth': 150,
    'isFixedSize': true,
    'widthPercentage': 150,
    'allowSorting': false,
    'sortingDirection': 0
  },
  {
    'id': 'srcSource',
    'label': 'Source',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'belongsTo',
    'label': 'Belongs To',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'srcPath',
    'label': 'Path',
    'columnType': 1,
    'columnVisible': true,
    'minColWidth': 100,
    'isFixedSize': false,
    'widthPercentage': 100,
    'allowSorting': true,
    'sortingDirection': 0
  },
  {
    'id': 'commands',
    'label': 'Commands',
    'columnType': 6,
    'columnVisible': true,
    'minColWidth': 238,
    'isFixedSize': true,
    'widthPercentage': 201,
    'allowSorting': false,
    'sortingDirection': 0
  }
];

export const currentEvent: any = {
  'groupedEvents': [],
  'categoryDescriptor': 'Fault',
  'categoryId': 9,
  'cause': 'Services running properly',
  'commands': [
    {
      'Id': 'Select',
      'EventId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value~637775812823940000~0~4583',
      'Configuration': 0,
      'ValidationRules': {
        'CommentRule': 'Optional',
        'ReAuthentication': 'NoNeed',
        'Configuration': 0,
        'IsFourEyesEnabled': false,
        '_links': []
      },
      '_links': [
        {
          'Rel': 'command',
          'Href': 'api/eventscommands',
          'IsTemplated': false
        }
      ]
    },
    {
      'Id': 'Ack',
      'EventId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value~637775812823940000~0~4583',
      'Configuration': 0,
      'ValidationRules': {
        'CommentRule': 'Optional',
        'ReAuthentication': 'NoNeed',
        'Configuration': 0,
        'IsFourEyesEnabled': false,
        '_links': []
      },
      '_links': [
        {
          'Rel': 'command',
          'Href': 'api/eventscommands',
          'IsTemplated': false
        }
      ]
    }
  ],
  'creationTime': '1/12/2022, 10:48:02 .394 AM',
  'originalCreationTime': '2022-01-12T09:48:02.394Z',
  'deleted': false,
  'descriptionList': [
    {
      'ViewId': 9,
      'Descriptor': 'Main Server.Services running properly'
    }
  ],
  'descriptionLocationsList': [
    {
      'ViewId': 9,
      'Descriptor': 'Project.Management System.Servers'
    }
  ],
  'designationList': [
    {
      'ViewId': 9,
      'Descriptor': 'System1.ManagementView:ManagementView.ManagementSystem.Servers.Server'
    }
  ],
  'direction': 'None',
  'eventId': 4583,
  'id': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value~637775812823940000~0~4583',
  'infoDescriptor': 'At least one Desigo CC manager not running properly',
  'messageText': [],
  'messageTextToDisplay': 'Services running properly',
  'nextCommand': 'Acknowledge',
  'sourceDesignationList': [
    {
      'ViewId': 9,
      'Descriptor': 'Server.Services running properly'
    }
  ],
  'srcDescriptor': 'Main Server.Services running properly',
  'srcDesignation': 'System1.ManagementView:ManagementView.ManagementSystem.Servers.Server',
  'srcDisciplineDescriptor': 'Management System',
  'srcDisciplineId': 0,
  'srcLocation': 'Project.Management System.Servers',
  'srcName': 'Server.Services running properly',
  'srcObservedPropertyId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value',
  'srcPropertyId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value',
  'srcState': 'Quiet',
  'srcSubDisciplineId': 4,
  'srcSystemId': 1,
  'srcViewDescriptor': 'Management View',
  'srcViewName': 'ManagementView',
  'state': 'Unprocessed',
  'suggestedAction': 'Acknowledge',
  'srcSystemName': 'System1',
  'informationalText': '',
  'timerUtc': '0001-01-01T00:00:00Z',
  'belongsTo': 'System1:ManagementView_ManagementSystem_Servers_Server',
  'belongsToFltr': 'Servers',
  'suggestedActionId': 0,
  'statePriority': 0,
  'stateId': 0,
  'srcStateId': 1,
  'category': {
    'id': 9,
    'descriptor': 'Fault',
    'colors': new Map<EventColors, string>([
      [1, '0, 0, 0'],
      [2, '255, 255, 255'],
      [3, '0, 0, 0'],
      [4, '0, 0, 0'],
      [5, '0, 0, 0'],
      [6, '237, 231, 234'],
      [7, '189, 189, 196'],
      [8, '152, 150, 154'],
      [9, '90, 93, 96'],
      [10, '152, 150, 154'],
      [11, '90, 93, 96'],
      [12, '213, 214, 217'],
      [13, '238, 234, 237']
    ])
  },
  'icon': 'element-settings',
  'groupId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:9',
  'sourceFltr': 'SERVERSERVICESRUNNINGPROPERLY',
  'srcSource': [
    'Server.Services running properly',
    null
  ]
};

export const cellData: CellDataObj[] = [
  {
    'key': 'recursation'
  },
  {
    'key': 'messageText',
    'value': 'Services running properly'
  },
  {
    'key': 'cause',
    'value': 'Services running properly'
  },
  {
    'key': 'creationTime',
    'value': '1/12/2022, 10:48:02 AM'
  },
  {
    'key': 'commands',
    'value': [
      'ack'
    ]
  },
  {
    'key': 'state',
    'value': [
      'Unprocessed',
      'element-alarm',
      'element-ui-3'
    ]
  },
  {
    'key': 'srcState',
    'value': 'Quiet'
  },
  {
    'key': 'categoryDescriptor',
    'value': 'Fault'
  },
  {
    'key': 'srcPath',
    'value': 'ManagementView.ManagementSystem.Servers'
  },
  {
    'key': 'srcSource',
    'value': [
      'Server.Services running properly',
      null
    ]
  },
  {
    'key': 'belongsTo',
    'value': [
      'Servers'
    ]
  },
  {
    'key': 'timer',
    'value': '0001-01-01T00:00:00Z'
  }
];

interface CellDataObj {
  key: string;
  value?: string | number | any[];
}

export const toMapCellData = (objectsArr: CellDataObj[]): Map<string, string> => {
  const cellsMap = new Map();
  objectsArr.forEach((cell: CellDataObj) => {
    cellsMap.set(cell.key, cell.value);
  });

  return cellsMap;
};

export const currentRow: GridData = {
  'cellData': (toMapCellData(cellData)),
  'customData': {
    'rowStyle': '',
    'rowStyleClass': 'hfw-grid-cell-style1',
    'cellStyle': new Map([]),
    'eventItem': currentEvent,
    'srcSystemId': 1,
    'srcSystemName': 'System1',
    'srcPropertyId': 'System1:ManagementView_ManagementSystem_Servers_Server.SoftwareRunning:_alert_hdl.2._value',
    'isGroupExpanded': false
  },
  'isDisabled': false
};

const commandTextsObjects = [
  {
    'key': 'ack',
    'value': 'Acknowledge'
  },
  {
    'key': 'reset',
    'value': 'Reset'
  },
  {
    'key': 'silence',
    'value': 'Silence'
  },
  {
    'key': 'unsilence',
    'value': 'Unsilence'
  },
  {
    'key': 'close',
    'value': 'Close'
  }
];

export const commandTexts = toMapCellData(commandTextsObjects);
