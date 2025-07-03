import { LogMessage, OperatorTaskNote } from '@gms-flex/services';
import { TranslateService } from '@ngx-translate/core';

import { OperatorTaskTranslations } from '../shared/operator-task-translations';
import { Utility } from '../shared/utility';
import { OperatorTaskNoteModel } from './operator-task-note-model';

let mockTraceService: any;
let mockDataService: any;

let translateServiceSpy: jasmine.SpyObj<TranslateService>;
const translations: OperatorTaskTranslations = new OperatorTaskTranslations(translateServiceSpy);

describe('OperatorTaskNoteModel', () => {
  mockTraceService = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  mockDataService = jasmine.createSpyObj('OperatorTaskSnapinDataService', ['translations']);

  translations.notesActionStart = "Auftragsstart ausgelöst";
  translations.notesActionRevert = "Wertwiderruf ausgelöst";
  translations.notesActionExpirationChanged = "Auftragsende geändert";
  translations.notesActionClose = "Auftragsabschluss ausgelöst";
  translations.notesActionAbort = "Vorgang abbrechen ausgelöst";

  mockDataService.translations = translations;

  describe('create note', () => {
    const date1 = new Date();
    const conv = new OperatorTaskNoteModel(undefined, 'a', translations, LogMessage.StartTask, date1.toString());

    it('should create a new note with defined properties', () => {
      expect(conv).toBeDefined();
      expect(conv.user).toEqual('a');
      expect(conv.date).toEqual(date1.toString());
      expect(conv.actionDetailsId).toEqual(20);
    });

    translations.notesActionStart = "Auftragsstart ausgelöst";
    translations.notesActionRevert = "Wertwiderruf ausgelöst";
    translations.notesActionExpirationChanged = "Auftragsende geändert";
    translations.notesActionClose = "Auftragsabschluss ausgelöst";
    translations.notesActionAbort = "Vorgang abbrechen ausgelöst";
    const currentLang = Utility.formatLang;
    Utility.formatLang = 'de';

    const notes: OperatorTaskNote[] = [
      {
        Date: "2024-11-12T00:10:29Z",
        User: "d",
        Description: "a",
        ActionDetailsId: 21,
        ActionDetailsText: "Close task command executed."
      },
      {
        Date: "2024-11-12T00:10:18Z",
        User: "d",
        Description: "a",
        ActionDetailsId: 23,
        ActionDetailsText: "Revert action started."
      },
      {
        Date: "2024-11-12T00:09:48Z",
        User: "d",
        Description: "aa",
        ActionDetailsId: 20,
        ActionDetailsText: "Start task command executed."
      }
    ]

    const convertedNotes = [];
    notes.forEach(n => {
      convertedNotes.push(new OperatorTaskNoteModel(n, n.User, translations));
    });

    const getText = (id: number): string => {
      let result;
      switch (id) {
        case LogMessage.StartTask:
          result = translations.notesActionStart;
          break;
        case LogMessage.CloseTask:
          result = translations.notesActionClose;
          break;
        case LogMessage.ChangeExpiration:
          result = translations.notesActionExpirationChanged;
          break;
        case LogMessage.Revert:
          result = translations.notesActionRevert;
          break;
        case LogMessage.Abort:
          result = translations.notesActionAbort;
          break;
        default:
          result = '';
          break;
      }
      return result;
    };

    it('user should be the same', () => {
      for (let i = 0; i < convertedNotes.length; i++) {
        const actual = convertedNotes[i];
        const expected = notes[i];
        expect(actual.user).toEqual(expected.User);
      }
    });

    it('description should be the same', () => {
      for (let i = 0; i < convertedNotes.length; i++) {
        const actual = convertedNotes[i];
        const expected = notes[i];
        expect(actual.description).toEqual(expected.Description);
      }
    });

    it('actiondDetailsId should be the same', () => {
      for (let i = 0; i < convertedNotes.length; i++) {
        const actual = convertedNotes[i];
        const expected = notes[i];
        expect(actual.actionDetailsId).toEqual(expected.ActionDetailsId);
      }
    });

    it('date should be localized', () => {
      for (let i = 0; i < convertedNotes.length; i++) {
        const actual = convertedNotes[i];
        const expected = notes[i];
        const dateLocalized = Utility.decodeDateTimeToString(expected.Date);
        expect(actual.date).toEqual(dateLocalized);
      }
    });

    it('actionDetailsText should be localized', () => {
      for (let i = 0; i < convertedNotes.length; i++) {
        const actual = convertedNotes[i];
        const expected = notes[i];
        expect(actual.actionDetailsText).toEqual(getText(expected.ActionDetailsId));
      }
    });
  });

});