'use strict';

// Session.RunControl.LessonPrev — Ctrl+← in lesson mode: the previous lesson
// of the base. The era moves user.LessonNum and restarts (the new Run
// follows in the trace); this records where it moved — the lesson id
// (map_base_lesson). It keeps no counter of its own. The domain router
// (EventHandler) cannot know the id and passes none.

interface LessonPrevSelf {
	lessonId : string | null;
}

module.exports = function LessonPrev(this: LessonPrevSelf, lessonId?: string) {
	this.lessonId = lessonId || null;
};
