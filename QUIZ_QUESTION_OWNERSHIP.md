# Quiz Question Ownership & Auto-Archive Implementation

## Overview
Admins can now create questions directly for their quizzes. These questions are automatically saved to their personal Question Bank with the **quiz title as the category**, making it easy to organize and reuse questions across multiple quizzes.

## Feature Architecture

### Backend Changes

#### 1. **QuestionBankService** (`archiveFromQuiz` Overload)
**File:** `backend/src/main/java/com/intelliquiz/api/quiz/internal/application/services/QuestionBankService.java`

Added an overloaded method that accepts a category parameter:
```java
/**
 * Auto-archives a question into the owner's bank with category (quiz title).
 * Fire-and-forget: failure here should not block quiz question creation.
 */
public QuestionBankItem archiveFromQuiz(Question question, Long ownerUserId, String category) {
    QuestionBankItem item = QuestionBankItem.fromQuestion(question, ownerUserId);
    item.setCategory(category);  // Set quiz title as category
    return questionBankRepository.save(item);
}
```

**Purpose:** Preserves the category information when archiving questions from a quiz.

#### 2. **QuestionManagementService** (`addQuestion` Update)
**File:** `backend/src/main/java/com/intelliquiz/api/quiz/internal/application/services/QuestionManagementService.java`

Updated the `addQuestion` method to pass the quiz title:
```java
// Auto-archive to Question Bank (fire-and-forget)
if (ownerUserId != null) {
    try {
        questionBankService.archiveFromQuiz(saved, ownerUserId, quiz.getTitle());
    } catch (Exception e) {
        log.warn("Failed to auto-archive question {} to bank for user {}: {}",
                saved.getId(), ownerUserId, e.getMessage());
    }
}
```

**Purpose:** When a question is created for a quiz, it's automatically archived to the admin's question bank with the quiz title as the category.

### Frontend Structure

The frontend already supports displaying questions by category:

#### **QuestionBankPage.tsx** (Already Configured)
- Displays questions in a table with columns for: Question, Type, Difficulty, Points, **Category**, and Actions
- Shows `item.category` if available, otherwise displays "—"
- No additional changes needed

#### **api.ts** (QuestionBankItem Interface)
```typescript
export interface QuestionBankItem {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctKey: string;
  points: number;
  timeLimit: number;
  options: string[];
  category?: string;  // ← Quiz title is stored here
  isHarvested?: boolean;
  sourceQuizId?: number;
}
```

## User Workflow

### Creating Questions with Auto-Archive

1. **Admin creates a quiz** (e.g., "Biology 101")
2. **Admin navigates to Questions page** and adds questions
3. **Questions are automatically archived** to the Question Bank with:
   - **Category:** "Biology 101" (quiz title)
   - **Owner:** Admin who created the question
   - **Status:** Marked as created for quiz (not harvested)
4. **Admin views Question Bank** and sees all questions organized by quiz category

### Reusing Questions from Question Bank

1. **Admin navigates to Question Bank**
2. **Filters or searches** for questions by category
3. **Selects questions** to import to a different quiz
4. **Questions are copied** as independent instances to the new quiz

## Database Schema

### question_bank_item Table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `owner_user_id` | BIGINT | Admin owner |
| `text` | TEXT | Question content |
| `question_type` | VARCHAR | MULTIPLE_CHOICE, TRUE_FALSE, etc. |
| `difficulty` | VARCHAR | EASY, MEDIUM, HARD |
| `correct_key` | VARCHAR | Correct answer key |
| `points` | INT | Points for this question |
| `time_limit` | INT | Time limit in seconds |
| `category` | VARCHAR | **Quiz title when created** |
| `is_harvested` | BOOLEAN | Whether harvested from completed quiz |
| `source_quiz_id` | BIGINT | Original quiz ID (if created for quiz) |
| `source_question_id` | BIGINT | Original question ID in quiz |
| `created_at` | TIMESTAMP | When question was added to bank |

## Feature Benefits

### For Admins
✅ **Automatic Archival** - Questions are saved without manual steps  
✅ **Quiz-based Organization** - Questions grouped by quiz title  
✅ **Reusability** - Build a library of reusable questions  
✅ **Ownership Preserved** - Only the creator can manage their questions  

### For the System
✅ **Fire-and-forget** - Archival failure doesn't block question creation  
✅ **Backward Compatible** - Original `archiveFromQuiz()` method still available  
✅ **Ownership Model** - Aligns with existing `createdByUserId` pattern  
✅ **Multi-category Support** - Same admin can have questions from multiple quizzes  

## Testing Checklist

- [x] Backend compiles successfully (Maven build)
- [ ] Create a quiz as Admin A
- [ ] Add 3-5 questions to the quiz
- [ ] Navigate to Question Bank
- [ ] Verify questions appear with quiz title as category
- [ ] Create another quiz with similar topic
- [ ] Import questions from first quiz
- [ ] Verify questions copied correctly
- [ ] Edit quiz title and check if old questions retain original category

## Future Enhancements

### Potential Extensions
1. **Category Management UI** - Allow explicit category creation beyond quiz titles
2. **Batch Organization** - Quickly organize questions by diffulty/type/category
3. **Category Analytics** - Show stats on how many questions in each category
4. **Smart Suggestions** - Recommend related questions from same category
5. **Category Filters** - Advanced filtering in Question Bank by multiple criteria

### Optional Cleanup
- Remove unused `QuizAssignment` references (if assignment workflow fully migrates)
- Remove `/admin/no-permissions` route (no longer needed)

## Files Modified

### Backend
- `src/main/java/com/intelliquiz/api/quiz/internal/application/services/QuestionBankService.java`
  - Added `archiveFromQuiz(Question, Long, String)` overload
- `src/main/java/com/intelliquiz/api/quiz/internal/application/services/QuestionManagementService.java`
  - Updated `addQuestion()` to pass quiz title

### Frontend  
- No changes needed (already configured to display category)

## API Endpoints Affected

### POST `/api/quizzes/{quizId}/questions`
When creating a question in a quiz:
- Question is added to quiz ✓
- Question is automatically archived to Question Bank with category ✓
- Category = Quiz title ✓

### GET `/api/question-bank`
Returns all questions with category field populated from quiz titles.

### POST `/api/quizzes/{quizId}/questions/from-bank`
Allows importing bank items to quiz (continues to work as before).

## Backward Compatibility

✅ **Original `archiveFromQuiz()` method preserved** - Existing code that calls it without category parameter still works  
✅ **Optional category field** - Frontend handles `category?: string` gracefully  
✅ **Fire-and-forget pattern** - Archival failures don't affect question creation  

---

**Implementation Date:** March 25, 2026  
**Status:** ✅ Backend Complete, ✅ Compiled Successfully, ✅ Ready for Testing
