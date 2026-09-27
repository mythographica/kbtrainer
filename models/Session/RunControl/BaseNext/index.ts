'use strict';

// Session.RunControl.BaseNext — Ctrl+↑ / Ctrl+↓ in lesson mode: the
// previous / next lesson base, starting at its first lesson. The era moves
// user.LessonNum and restarts (the new Run follows in the trace); this
// records the direction and where it moved — the lesson id
// (map_base_lesson). It keeps no counter of its own. The domain router
// (EventHandler) cannot know the id and passes none.

interface BaseNextSelf {
	direction : string;          // 'prev' | 'next'
	lessonId  : string | null;
}

module.exports = function BaseNext(this: BaseNextSelf, direction: string, lessonId?: string) {
	if (direction !== 'prev' && direction !== 'next') {
		throw new RangeError('unknown base direction: ' + direction);
	}
	this.direction = direction;
	this.lessonId = lessonId || null;
};
