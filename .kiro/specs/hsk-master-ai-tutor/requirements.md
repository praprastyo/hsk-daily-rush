# Requirements Document

## Introduction

HSK Master AI is an interactive Mandarin practice tutor embedded in the china-hsk web application. The tutor acts as a certified Mandarin teacher and HSK examiner that delivers HSK practice questions across Levels 1 through 6, evaluates user answers, teaches vocabulary, and tracks each learner's progress across a session.

The defining product constraint is that every question, reading text, and multiple-choice option (A, B, C, D) is rendered 100% in Hanzi characters — no Pinyin or translations appear inside the question body or answer choices — so that learners build native-character reading fluency. Pinyin and Indonesian meanings appear only in supporting material (the Hanzi Vocabulary Table) shown after a question is answered.

The tutor follows a fixed conversational flow: greet and onboard a new learner (collect name and target HSK level), present one question at a time, evaluate the answer, present an explanation, a Hanzi Vocabulary Table, and an updated User Progress Card, then offer to continue, change level, or stop. Questions are drawn from a question bank stored in `src/data/questions.json` and must conform to authentic HSK question formats per level (e.g., Level 3 Listening, Reading, and Writing section types as illustrated by the official H31001 sample exam).

## Glossary

- **Tutor**: The HSK Master AI subsystem responsible for the conversational tutoring experience, including onboarding, question delivery, evaluation, and progress display.
- **Question_Bank**: The collection of HSK practice questions stored in `src/data/questions.json` and loaded by the application.
- **Question_Selector**: The component that selects the next question from the Question_Bank for a given HSK level and avoids repeating already-answered questions within a session.
- **Question_Renderer**: The component that displays a question, its reading text, and its answer choices to the learner.
- **Evaluator**: The component that compares a learner's submitted answer to the correct answer and produces a correctness result and explanation.
- **Vocabulary_Table_Generator**: The component that produces the Hanzi Vocabulary Table for an answered question.
- **Progress_Tracker**: The component that maintains and updates per-learner progress data (name, current level, correct count, wrong count, accuracy, streak).
- **Progress_Card_Renderer**: The component that renders the User Progress Card from the current progress data.
- **Session**: A continuous period of learner interaction with the Tutor, from onboarding until the learner stops.
- **Learner**: The end user practicing HSK questions.
- **HSK_Level**: An integer from 1 to 6 indicating the difficulty tier of HSK content per the current official HSK standard.
- **Hanzi**: Chinese characters used as the sole writing system for question text and answer choices.
- **Pinyin**: The romanized phonetic transcription of Hanzi, shown only in supporting material.
- **User_Progress_Card**: A formatted summary block showing the learner's name, current level, correct count, wrong count, accuracy percentage, and streak.
- **Hanzi_Vocabulary_Table**: A table of key words from an answered question with columns Hanzi, Pinyin, Meaning (Indonesian), and HSK Level.
- **Answer_Choice**: A single multiple-choice option, labeled A, B, C, or D, written entirely in Hanzi.
- **Streak**: The count of consecutive correct answers; reset to zero on a wrong answer.
- **Accuracy**: The percentage of answered questions that were answered correctly within the Session.

## Requirements

### Requirement 1: Learner Onboarding

**User Story:** As a first-time learner, I want the Tutor to greet me and collect my name and target HSK level, so that the practice session is personalized and matched to my ability.

#### Acceptance Criteria

1. WHEN a Session starts and no Learner name is recorded, THE Tutor SHALL display a greeting that contains both Mandarin text and Indonesian text.
2. WHEN a Session starts and no Learner name is recorded, THE Tutor SHALL request the Learner name.
3. WHEN a Session starts and no target HSK_Level is recorded, THE Tutor SHALL request a target HSK_Level in the range 1 to 6.
4. WHEN the Learner provides a name, THE Progress_Tracker SHALL store the provided name as the Learner name for the Session.
5. WHEN the Learner provides an HSK_Level value in the range 1 to 6, THE Progress_Tracker SHALL store the provided value as the current HSK_Level for the Session.
6. IF the Learner provides an HSK_Level value outside the range 1 to 6, THEN THE Tutor SHALL display an error message and request an HSK_Level value in the range 1 to 6 again.
7. WHEN a Session starts and a Learner name is already recorded, THE Tutor SHALL skip the name request and use the recorded name.

### Requirement 2: Full-Hanzi Question Presentation

**User Story:** As a learner, I want every question and all answer choices written only in Hanzi, so that I practice reading native characters without relying on Pinyin or translation.

#### Acceptance Criteria

1. WHEN the Question_Renderer displays a question body, THE Question_Renderer SHALL render the question body using Hanzi characters only.
2. WHEN the Question_Renderer displays a reading text, THE Question_Renderer SHALL render the reading text using Hanzi characters only.
3. WHEN the Question_Renderer displays the Answer_Choice set, THE Question_Renderer SHALL render each Answer_Choice using Hanzi characters only.
4. THE Question_Renderer SHALL exclude Pinyin from the question body, the reading text, and every Answer_Choice.
5. THE Question_Renderer SHALL exclude Indonesian text and English text from the question body, the reading text, and every Answer_Choice.
6. WHEN the Question_Renderer displays the Answer_Choice set for a multiple-choice question, THE Question_Renderer SHALL label each Answer_Choice with a letter from the ordered set A, B, C, D.

### Requirement 3: Level-Matched Question Selection

**User Story:** As a learner, I want each question to match my chosen HSK level and the authentic HSK format, so that my practice reflects the real exam.

#### Acceptance Criteria

1. WHEN the Tutor presents a question, THE Question_Selector SHALL select a question whose HSK_Level equals the Learner current HSK_Level.
2. WHEN the Tutor presents a question, THE Question_Selector SHALL select a question that has not been answered earlier in the current Session, while at least one unanswered question for the current HSK_Level remains.
3. IF no unanswered question remains for the current HSK_Level, THEN THE Tutor SHALL inform the Learner that all questions for the current HSK_Level have been completed and suggest advancing to the next higher HSK_Level as the primary option, while also offering to change to another HSK_Level or stop.
4. WHEN the Tutor presents a question, THE Tutor SHALL present exactly one question and then wait for the Learner answer.
5. WHERE the selected question is a multiple-choice question, THE Question_Selector SHALL select a question that conforms to an authentic HSK question format for the current HSK_Level as defined in the Question_Bank.

### Requirement 4: Answer Evaluation

**User Story:** As a learner, I want clear feedback on whether my answer was correct along with a short explanation, so that I learn from each question.

#### Acceptance Criteria

1. WHEN the Learner submits an answer for the current question, THE Evaluator SHALL compare the submitted answer to the recorded correct answer for that question.
2. WHEN the submitted answer matches the recorded correct answer, THE Evaluator SHALL report a correct result.
3. WHEN the submitted answer does not match the recorded correct answer, THE Evaluator SHALL report a wrong result and state the correct answer.
4. WHEN the Evaluator reports a result, THE Tutor SHALL display an explanation of the correct answer for the current question.
5. IF the Learner submits an answer that does not correspond to any available Answer_Choice label for the current question, THEN THE Tutor SHALL display an error message and request a valid answer for the current question.

### Requirement 5: Hanzi Vocabulary Table Generation

**User Story:** As a learner, I want a vocabulary table after each answered question, so that I can learn the key words with their Pinyin, meaning, and level.

#### Acceptance Criteria

1. WHEN the Evaluator reports a result for the current question, THE Vocabulary_Table_Generator SHALL display a Hanzi_Vocabulary_Table for that question after the explanation.
2. WHEN the Vocabulary_Table_Generator displays a Hanzi_Vocabulary_Table, THE Vocabulary_Table_Generator SHALL include the columns Hanzi, Pinyin, Meaning in Indonesian, and HSK Level in that order.
3. WHEN the Vocabulary_Table_Generator displays a Hanzi_Vocabulary_Table, THE Vocabulary_Table_Generator SHALL include at least one vocabulary entry from the current question.
4. WHEN the Vocabulary_Table_Generator displays a vocabulary entry, THE Vocabulary_Table_Generator SHALL populate the Hanzi column, the Pinyin column, the Meaning in Indonesian column, and the HSK Level column for that entry.

### Requirement 6: Progress Tracking

**User Story:** As a learner, I want my correct and wrong counts, accuracy, and streak tracked, so that I can see how I am improving during the session.

#### Acceptance Criteria

1. WHEN the Evaluator reports a correct result, THE Progress_Tracker SHALL increment the correct count by one.
2. WHEN the Evaluator reports a wrong result, THE Progress_Tracker SHALL increment the wrong count by one.
3. WHEN the Evaluator reports a correct result, THE Progress_Tracker SHALL increment the Streak by one.
4. WHEN the Evaluator reports a wrong result, THE Progress_Tracker SHALL reset the Streak to zero.
5. WHEN the correct count or wrong count changes, THE Progress_Tracker SHALL set Accuracy to the correct count divided by the sum of the correct count and wrong count, expressed as a percentage.
6. WHILE no question has been answered in the Session, THE Progress_Tracker SHALL report Accuracy as zero percent.
7. WHEN the Learner selects a new HSK_Level, THE Progress_Tracker SHALL update the current HSK_Level to the selected value.

### Requirement 7: Progress Persistence

**User Story:** As a learner, I want my progress retained across reloads within the application, so that I do not lose my counts if the page refreshes.

#### Acceptance Criteria

1. WHEN the Progress_Tracker updates any progress value, THE Progress_Tracker SHALL persist the Learner name, current HSK_Level, correct count, wrong count, and Streak to client-side storage.
2. WHEN a Session starts and persisted progress exists for the Learner, THE Progress_Tracker SHALL load the persisted name, current HSK_Level, correct count, wrong count, and Streak.
3. WHEN the Progress_Tracker loads persisted progress, THE Progress_Tracker SHALL compute Accuracy from the loaded correct count and wrong count.
4. IF persisted progress data is missing or cannot be read, THEN THE Progress_Tracker SHALL initialize correct count, wrong count, and Streak to zero.

### Requirement 8: User Progress Card Display

**User Story:** As a learner, I want a progress card at the end of every response, so that my progress is always visible and not lost in the chat history.

#### Acceptance Criteria

1. WHEN the Tutor completes any response, THE Progress_Card_Renderer SHALL display a User_Progress_Card at the end of that response.
2. WHEN the Progress_Card_Renderer displays a User_Progress_Card, THE Progress_Card_Renderer SHALL include the Learner name, current HSK_Level, correct count, wrong count, Accuracy percentage, and Streak.
3. WHEN the Progress_Card_Renderer displays a User_Progress_Card, THE Progress_Card_Renderer SHALL present the values using the labels Name, Current Level, Correct, Wrong, Accuracy, and Streak.
4. WHEN the Progress_Card_Renderer displays the Accuracy value, THE Progress_Card_Renderer SHALL display the value as a percentage.

### Requirement 9: Conversational Quiz Flow

**User Story:** As a learner, I want the tutor to guide me through a clear question-by-question flow with choices to continue, change level, or stop, so that I stay in control of my practice session.

#### Acceptance Criteria

1. WHEN onboarding completes and a target HSK_Level is recorded, THE Tutor SHALL present one question matching the current HSK_Level.
2. WHEN the Tutor presents a question, THE Tutor SHALL wait for the Learner answer before presenting evaluation content.
3. WHEN the Evaluator reports a result, THE Tutor SHALL display the result, then the explanation, then the Hanzi_Vocabulary_Table, then the User_Progress_Card, in that order.
4. WHEN the Tutor finishes displaying evaluation content for a question, THE Tutor SHALL offer the Learner the options to continue to the next question, change HSK_Level, or stop.
5. WHEN the Learner chooses to continue, THE Tutor SHALL present the next question matching the current HSK_Level.
6. WHEN the Learner chooses to change HSK_Level, THE Tutor SHALL request a new HSK_Level in the range 1 to 6 and then present a question matching the newly selected HSK_Level.
7. WHEN the Learner chooses to stop, THE Tutor SHALL end the question flow and display a closing message with the User_Progress_Card.

### Requirement 10: Question Bank Data Source

**User Story:** As a maintainer, I want questions stored in a structured data source with the data needed for full-Hanzi rendering, evaluation, and vocabulary tables, so that the tutor can serve authentic questions per level.

#### Acceptance Criteria

1. THE Question_Bank SHALL store each question with an HSK_Level value in the range 1 to 6.
2. THE Question_Bank SHALL store each question with a question format identifier that corresponds to an authentic HSK question type.
3. THE Question_Bank SHALL store for each multiple-choice question a set of Answer_Choice values written in Hanzi only and a recorded correct answer.
4. THE Question_Bank SHALL store for each question the explanation text and the vocabulary entries required to build the Hanzi_Vocabulary_Table.
5. THE Question_Bank SHALL store for each vocabulary entry a Hanzi value, a Pinyin value, an Indonesian meaning value, and an HSK_Level value.
6. IF a question record is missing a required field, THEN THE Tutor SHALL exclude that question from selection.
