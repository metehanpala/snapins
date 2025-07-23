// the different trace modules used by the textual viewer snapin

export class TvTraceModules {
  public static tv = 'gmsSnapins_TextualViewer';
  public static service = 'gmsSnapins_TextualViewerServices';
}

// these are the ids (strings) used to identify each of the columns
// in the grid. ideally we would make them something informative, but...
// these are the ids used in the 1.0 version, and in order to maintain
// compatibility with existing user settings they must stay the same.
//
// oh: why "user settings?" the state of the columns are stored in the
// IOWA process image, where each column is identified by one of the
// strings below.

export class TvColumnIds {
  public static statusId = 'data1';
  public static descriptorId = 'data2';
  public static nameId = 'data3';
  public static aliasId = 'data4';
  public static valueId = 'data5';
  public static emptyColumnId = 'data6';
  public static currentPriorityId = 'data7';
}
