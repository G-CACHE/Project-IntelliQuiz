# Tournament Flow Fix Plan

## Date: 2026-03-09

## Issues Identified

### Issue 1: Answer Grading Always Wrong (Score Always 0)
**Root Cause:** The database stores `correct_key` as a **letter** (e.g., `"B"`), but the frontend submits the **option text** (e.g., `"2"`). The backend grading compares `"B".equalsIgnoreCase("2")` — always `false`.

**Data flow:**
| Layer | Value | Example |
|---|---|---|
| DB `correct_key` | Letter index | `"B"` |
| Frontend selection | Option text | `"2"` |
| Backend `Submission.grade()` | Compares submitted answer vs correctKey | `"2" vs "B"` → always false |
| Answer reveal `correctAnswer` sent to frontend | Letter | `"B"` |
| Frontend highlight comparison | `selectedOption === correctAnswer` | `"2" === "B"` → always false |

**Fix:** Convert the letter-based `correct_key` to the actual option text in the backend before grading and before sending answer reveals. This is the correct approach because:
- The frontend already works correctly with option text
- Changing the frontend to send letters would break the submission model
- Resolving at the backend keeps the source of truth clean

**Files to change:**
1. `QuestionInfoDto` — needs to expose the resolved correct answer text (not just the letter)
2. `GameFlowService.calculateAndRevealResults()` — resolve letter → option text for grading
3. `AnswerRevealPayload` — send resolved option text as `correctAnswer`
4. `QuestionPayload.fromDto()` — (optional) include correctAnswer text for reveal states

### Issue 2: Cannot Change Answer After Selection (LINEAR Mode)
**Root Cause:** The current implementation immediately submits and sets `submitted = true` on first click. Once `submitted` is `true`, the UI disables further option selection.

**Fix:** In LINEAR mode, allow changing selection without locking. The answer that counts is the one selected when the timer expires (auto-submitted). The click should update `selectedOption` but NOT immediately submit. Submission happens only on timer expiry.

**Files to change:**
1. `PlayerGame.tsx` — Remove immediate submit on click. Allow reselection until timer expires. Auto-submit final selection on timer expiry.

### Issue 3: "Answer Locked" Shows on New Question
**Root Cause:** The `submitted` state is not properly reset when a new question starts. The `useEffect` that resets on `questionNumber` change may fire after the one that auto-submits, or the QUESTION state arrives before questionNumber increments.

**Fix:** Ensure `submitted` and `selectedOption` are reset whenever `gameState` transitions to `'QUESTION'` (not just on `questionNumber` change).

**Files to change:**
1. `PlayerGame.tsx` — Reset `submitted`/`selectedOption`/`isCorrect` on gameState becoming QUESTION.

### Issue 4: End Quiz UI Enhancement
**Current state:** Basic scoreboard with single gold entry. No visual celebration or clear finality.

**Fix:** Enhance the FINAL_RESULTS view on both HostGame and PlayerGame with:
- Confetti/celebration header
- Podium display for top 3
- Clear "Quiz Completed" messaging
- Player's own result highlighted
- Return to lobby / exit button

**Files to change:**
1. `PlayerGame.tsx` — Enhanced FINAL_RESULTS rendering
2. `HostGame.tsx` — Enhanced FINAL_RESULTS rendering
3. `ScoreboardDisplay.tsx` — Already has podium for `isFinal=true`, verify it works

---

## Implementation Order

1. **Fix answer key mismatch** (Issue 1) — Most critical, scoring is completely broken
2. **Fix answer change flow** (Issue 2) — Core UX for participants  
3. **Fix submitted state reset** (Issue 3) — Prevents ghost "Answer Locked" state
4. **Enhance end quiz UI** (Issue 4) — Visual polish

## Testing Checklist

- [ ] Select correct answer → grading marks it correct + awards points
- [ ] Select wrong answer → grading marks it incorrect + 0 points
- [ ] Change answer before timer expires → last selection is submitted
- [ ] Timer expires with selection → auto-submits correctly
- [ ] Timer expires without selection → no submission, "No Answer" shown
- [ ] New question arrives → no stale "Answer Locked" state
- [ ] End quiz → final scoreboard shows with podium, correct scores
- [ ] Scores accumulate across questions
- [ ] Answer reveal highlights correct option in green
