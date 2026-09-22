// Generated TypeRegistry for type-safe mnemonica.lookup()
// This file augments mnemonica's TypeRegistry via declaration merging.
//
// Usage:
//   import { lookup } from 'mnemonica';
//   import './.tactica/registry';  // applies the augmentation
//   const MyType = lookup('MyType');
//   // TypeScript knows: MyType is the typed constructor for MyType
//   const instance = new MyType({ /* constructor args */ });
//   // instance has full intellisense for the generated type

import type {
	Program,
	Program_FileDialog,
	Program_FileDialog_DirList,
	Program_FileDialog_FilePick,
	Program_KeyFlash,
	Program_KeyLight,
	Program_LibDialog,
	Program_LibDialog_BookDeleteRequest,
	Program_LibDialog_BookDeleteRequest_BookDeleted,
	Program_LibDialog_BookImport,
	Program_LibDialog_BookMark,
	Program_LibDialog_BookSelect,
	Program_Log,
	Program_ModeDialog,
	Program_ModeDialog_BookPick,
	Program_ModeDialog_LessonPick,
	Program_ModeDialog_ModeSet,
	Program_SettingsDialog,
	Program_SettingsDialog_MapsPairSet,
	Program_SettingsDialog_PrefSet,
	Program_SettingsDialog_SkinPreview,
	Program_UserProfile,
	Program_ViewControl,
	Program_ViewControl_ZoomIn,
	Program_ViewControl_ZoomOut,
	Program_WindowState,
	Session,
	Session_EventHandler,
	Session_KeyStroke,
	Session_KeyStroke_Correct,
	Session_KeyStroke_Correct_StatUpdate,
	Session_KeyStroke_Mistake,
	Session_KeyStroke_Mistake_StatUpdate,
	Session_LetterPick,
	Session_ModeF1,
	Session_ModeF12,
	Session_ModeF2,
	Session_ModeF3,
	Session_ModeF4,
	Session_ModeF5,
	Session_ModeF7,
	Session_ModeF8,
	Session_Run,
	Session_Run_Book,
	Session_Run_Book_Native,
	Session_Run_Book_Paragraph,
	Session_Run_Finish,
	Session_Run_Lesson,
	Session_Run_Lesson_Native,
	Session_Run_Lesson_Paragraph,
	Session_Run_Vocabulary,
	Session_RunControl,
	Session_RunControl_BaseNext,
	Session_RunControl_LessonNext,
	Session_RunControl_LessonPrev,
	Session_RunControl_Pause,
	Session_RunControl_Quit,
	Session_RunControl_Resume,
	Session_WordPick,
	Timer,
	Timer_Tick,
} from './types';

/**
 * Type registry augmenting mnemonica's TypeRegistry interface
 * This enables type-safe lookup() without explicit type arguments
 *
 * Usage: const SomeType = lookup('SomeType'); // Fully typed!
 */
declare module 'mnemonica' {
	interface TypeRegistry {
		'Program': new (opts?: { version?: string; screen?: any }) => Program;
		'Program.FileDialog': new () => Program_FileDialog;
		'Program.FileDialog.DirList': new (dirPath: string, entries: any) => Program_FileDialog_DirList;
		'Program.FileDialog.FilePick': new (filePath: string) => Program_FileDialog_FilePick;
		'Program.KeyFlash': new (key: string) => Program_KeyFlash;
		'Program.KeyLight': new (char: string) => Program_KeyLight;
		'Program.LibDialog': new () => Program_LibDialog;
		'Program.LibDialog.BookDeleteRequest': new (name: string) => Program_LibDialog_BookDeleteRequest;
		'Program.LibDialog.BookDeleteRequest.BookDeleted': new () => Program_LibDialog_BookDeleteRequest_BookDeleted;
		'Program.LibDialog.BookImport': new (name: string) => Program_LibDialog_BookImport;
		'Program.LibDialog.BookMark': new (name: string) => Program_LibDialog_BookMark;
		'Program.LibDialog.BookSelect': new (name: string) => Program_LibDialog_BookSelect;
		'Program.Log': new (text: string, source: string) => Program_Log;
		'Program.ModeDialog': new () => Program_ModeDialog;
		'Program.ModeDialog.BookPick': new (name: string, text: string) => Program_ModeDialog_BookPick;
		'Program.ModeDialog.LessonPick': new (lessonId: string, title: string, text: string) => Program_ModeDialog_LessonPick;
		'Program.ModeDialog.ModeSet': new (mode: string) => Program_ModeDialog_ModeSet;
		'Program.SettingsDialog': new () => Program_SettingsDialog;
		'Program.SettingsDialog.MapsPairSet': new (layoutA: string, layoutB: string) => Program_SettingsDialog_MapsPairSet;
		'Program.SettingsDialog.PrefSet': new (name: string, value: any) => Program_SettingsDialog_PrefSet;
		'Program.SettingsDialog.SkinPreview': new (skinName: string) => Program_SettingsDialog_SkinPreview;
		'Program.UserProfile': new () => Program_UserProfile;
		'Program.ViewControl': new () => Program_ViewControl;
		'Program.ViewControl.ZoomIn': new () => Program_ViewControl_ZoomIn;
		'Program.ViewControl.ZoomOut': new () => Program_ViewControl_ZoomOut;
		'Program.WindowState': new (rect: { width: number; height: number; x?: number; y?: number }) => Program_WindowState;
		'Session': new (program: { profile: any }) => Session;
		'Session.EventHandler': new () => Session_EventHandler;
		'Session.KeyStroke': new (key: string) => Session_KeyStroke;
		'Session.KeyStroke.Correct': new () => Session_KeyStroke_Correct;
		'Session.KeyStroke.Correct.StatUpdate': new () => Session_KeyStroke_Correct_StatUpdate;
		'Session.KeyStroke.Mistake': new () => Session_KeyStroke_Mistake;
		'Session.KeyStroke.Mistake.StatUpdate': new () => Session_KeyStroke_Mistake_StatUpdate;
		'Session.LetterPick': new () => Session_LetterPick;
		'Session.ModeF1': new () => Session_ModeF1;
		'Session.ModeF12': new () => Session_ModeF12;
		'Session.ModeF2': new () => Session_ModeF2;
		'Session.ModeF3': new () => Session_ModeF3;
		'Session.ModeF4': new () => Session_ModeF4;
		'Session.ModeF5': new () => Session_ModeF5;
		'Session.ModeF7': new () => Session_ModeF7;
		'Session.ModeF8': new () => Session_ModeF8;
		'Session.Run': new (title: string, text: string) => Session_Run;
		'Session.Run.Book': new () => Session_Run_Book;
		'Session.Run.Book.Native': new (name: string) => Session_Run_Book_Native;
		'Session.Run.Book.Paragraph': new (name: string) => Session_Run_Book_Paragraph;
		'Session.Run.Finish': new () => Session_Run_Finish;
		'Session.Run.Lesson': new () => Session_Run_Lesson;
		'Session.Run.Lesson.Native': new (lessonId: string) => Session_Run_Lesson_Native;
		'Session.Run.Lesson.Paragraph': new (lessonId: string) => Session_Run_Lesson_Paragraph;
		'Session.Run.Vocabulary': new () => Session_Run_Vocabulary;
		'Session.RunControl': new () => Session_RunControl;
		'Session.RunControl.BaseNext': new (direction: string) => Session_RunControl_BaseNext;
		'Session.RunControl.LessonNext': new () => Session_RunControl_LessonNext;
		'Session.RunControl.LessonPrev': new () => Session_RunControl_LessonPrev;
		'Session.RunControl.Pause': new () => Session_RunControl_Pause;
		'Session.RunControl.Quit': new () => Session_RunControl_Quit;
		'Session.RunControl.Resume': new () => Session_RunControl_Resume;
		'Session.WordPick': new () => Session_WordPick;
		'Timer': new (session: { stats: any }) => Timer;
		'Timer.Tick': new () => Timer_Tick;
	}
}

import type { TypeRegistry } from 'mnemonica';
export type { TypeRegistry };