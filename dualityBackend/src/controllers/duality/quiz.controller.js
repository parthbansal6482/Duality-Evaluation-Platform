const getQuiz = require('../../models/duality/Quiz');
const getQuizSubmission = require('../../models/duality/QuizSubmission');
const getDualityQuestion = require('../../models/duality/DualityQuestion');
const getDualityUser = require('../../models/duality/DualityUser');
const { runTestCases } = require('../../services/execution.service');

// ─── Quiz CRUD ────────────────────────────────────────────────────────────────

/** POST /api/duality/quiz — Create quiz (admin/professor) */
exports.createQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const { title, description, durationMinutes, startTime, endTime, questions, assignedTo, isLockdown } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'title is required' });
        }
        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: 'End time must be after start time' });
        }
        const quiz = await Quiz.create({
            title,
            description: description || '',
            durationMinutes,
            startTime: startTime || null,
            endTime: endTime || null,
            questions: questions || [],
            assignedTo: assignedTo || [],
            createdBy: req.dualityUser._id,
            status: 'active',
            isLockdown: !!isLockdown,
        });
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        console.error('createQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error creating quiz', error: error.message });
    }
};

/** GET /api/duality/quiz — List all quizzes */
exports.getQuizzes = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const isAdmin = req.dualityUser.role === 'admin';

        // Students only see quizzes assigned to them that are currently within the scheduled window
        const now = new Date();
        const filter = isAdmin ? {} : { 
            assignedTo: req.dualityUser._id,
            $or: [
                { status: 'active' }, // Support legacy active quizzes
                {
                    startTime: { $lte: now },
                    endTime: { $gte: now }
                }
            ]
        };
        const quizzes = await Quiz.find(filter)
            .populate('questions', 'title difficulty category')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        console.error('getQuizzes error:', error);
        res.status(500).json({ success: false, message: 'Error fetching quizzes', error: error.message });
    }
};

/** GET /api/duality/quiz/:id — Get single quiz */
exports.getQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const quiz = await Quiz.findById(req.params.id)
            .populate('questions', 'title difficulty category description constraints examples boilerplate driverCode')
            .populate('createdBy', 'name');

        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        // Students can only access active quizzes assigned to them within the time window
        if (req.dualityUser.role !== 'admin') {
            const now = new Date();
            if (quiz.status !== 'active') {
                return res.status(403).json({ success: false, message: 'This quiz is not currently active' });
            }
            if (!quiz.assignedTo || !quiz.assignedTo.some(userId => userId.toString() === req.dualityUser._id.toString())) {
                return res.status(403).json({ success: false, message: 'You are not assigned to this quiz' });
            }
            if (quiz.startTime && now < new Date(quiz.startTime)) {
                return res.status(403).json({ success: false, message: 'This assignment has not started yet' });
            }
            if (quiz.endTime && now > new Date(quiz.endTime)) {
                return res.status(403).json({ success: false, message: 'This assignment has already ended' });
            }
        }

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error('getQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error fetching quiz', error: error.message });
    }
};

/** PATCH /api/duality/quiz/:id — Update quiz (admin only) */
exports.updateQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('questions', 'title difficulty category');

        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error('updateQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error updating quiz', error: error.message });
    }
};

/** DELETE /api/duality/quiz/:id — Delete quiz (admin only) */
exports.deleteQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        res.status(200).json({ success: true, message: 'Quiz deleted' });
    } catch (error) {
        console.error('deleteQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error deleting quiz', error: error.message });
    }
};

// ─── Quiz Lifecycle ───────────────────────────────────────────────────────────

/** PATCH /api/duality/quiz/:id/activate — Start quiz (admin only) */
exports.activateQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { status: 'active', startTime: new Date() },
            { new: true }
        );
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error('activateQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error activating quiz', error: error.message });
    }
};

/** PATCH /api/duality/quiz/:id/end — End quiz (admin only) */
exports.endQuiz = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { status: 'ended', endTime: new Date() },
            { new: true }
        );
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error('endQuiz error:', error);
        res.status(500).json({ success: false, message: 'Error ending quiz', error: error.message });
    }
};

// ─── Quiz Submission (Students) ───────────────────────────────────────────────

/**
 * POST /api/duality/quiz/:id/submit
 * Student submits/runs code for one question in the quiz.
 */
exports.submitQuizAnswer = async (req, res) => {
    try {
        const Quiz = getQuiz();
        const QuizSubmission = getQuizSubmission();
        const DualityQuestion = getDualityQuestion();
        const DualityUser = getDualityUser();

        const { questionId, code, language, isRunOnly = false } = req.body;
        const quizId = req.params.id;
        const userId = req.dualityUser._id;

        if (!questionId || !code || !language) {
            return res.status(400).json({ success: false, message: 'questionId, code, and language are required' });
        }

        // Validate quiz is active and within time window
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        
        const now = new Date();
        if (quiz.status !== 'active') {
            return res.status(400).json({ success: false, message: 'This quiz is not active' });
        }
        if (quiz.startTime && now < new Date(quiz.startTime)) {
            return res.status(400).json({ success: false, message: 'This assignment hasn\'t started yet' });
        }
        if (quiz.endTime && now > new Date(quiz.endTime)) {
            return res.status(400).json({ success: false, message: 'This assignment has ended. Submissions are closed.' });
        }

        // Validate question belongs to quiz
        const questionInQuiz = quiz.questions.some(q => q.toString() === questionId);
        if (!questionInQuiz) {
            return res.status(400).json({ success: false, message: 'Question does not belong to this quiz' });
        }

        // Fetch question for test cases
        const question = await DualityQuestion.findById(questionId);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

        await DualityUser.findByIdAndUpdate(userId, { lastActiveDate: new Date() });

        // Build test cases: visible examples + hidden test cases
        const visibleCases = (question.examples || []).map((ex, i) => ({
            input: ex.input,
            expectedOutput: ex.output,
            id: `quiz_example_${i}`,
        }));
        
        let casesToRun = [];
        if (isRunOnly) {
            casesToRun = visibleCases;
        } else {
            const hiddenCases = (question.testCases || []).map((tc, i) => ({
                input: tc.input,
                expectedOutput: tc.output,
                id: `quiz_test_${i}`,
            }));
            casesToRun = [...visibleCases, ...hiddenCases];
        }

        if (casesToRun.length === 0) {
            return res.status(400).json({ success: false, message: 'No test cases configured for this question' });
        }

        // Execute code
        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, casesToRun, driverCode);

        // Determine status
        let status = 'accepted';
        if (result.passedTests < result.totalTests) status = 'wrong_answer';
        if (result.results.some(r => r.error && r.error.includes('timeout'))) status = 'time_limit_exceeded';
        else if (result.results.some(r => r.exitCode === 137)) status = 'memory_limit_exceeded';
        const hasRTE = result.results.some(r => r.error && !r.error.includes('timeout') && r.exitCode !== 137);
        if (hasRTE && (status === 'accepted' || status === 'wrong_answer')) status = 'runtime_error';

        // If it's just a run, return immediately without saving
        if (isRunOnly) {
            return res.status(200).json({
                success: true,
                message: 'Run complete',
                data: {
                    status,
                    results: result.results.map(r => ({
                        passed: r.passed,
                        input: r.input,
                        expectedOutput: r.expectedOutput,
                        actualOutput: r.actualOutput,
                        error: r.error,
                        executionTime: r.executionTime,
                    })),
                },
            });
        }

        // Points based on difficulty
        const pointsMap = { Easy: 100, Medium: 200, Hard: 300 };
        const score = status === 'accepted' ? (pointsMap[question.difficulty] || 100) : 0;

        // Upsert quiz submission (one per student per quiz)
        let submission = await QuizSubmission.findOne({ quiz: quizId, student: userId });
        if (!submission) {
            submission = await QuizSubmission.create({
                quiz: quizId,
                student: userId,
                answers: [],
                totalScore: 0,
                startedAt: new Date(),
            });
        }

        // Update or insert answer for this specific question
        const existingIdx = submission.answers.findIndex(a => a.question.toString() === questionId);
        const answerRecord = {
            question: questionId,
            code,
            language,
            status,
            score,
            submittedAt: new Date(),
        };

        if (existingIdx >= 0) {
            // Replace only if better score
            if (score >= submission.answers[existingIdx].score) {
                submission.answers[existingIdx] = answerRecord;
            }
        } else {
            submission.answers.push(answerRecord);
        }

        // Recompute total score
        submission.totalScore = submission.answers.reduce((sum, a) => sum + (a.score || 0), 0);
        await submission.save();

        res.status(200).json({
            success: true,
            message: 'Answer evaluated and saved',
            data: {
                status,
                score,
                totalScore: submission.totalScore,
                results: result.results.map(r => ({
                    passed: r.passed,
                    input: r.input,
                    expectedOutput: r.expectedOutput,
                    actualOutput: r.actualOutput,
                    error: r.error,
                    executionTime: r.executionTime,
                })),
            },
        });
    } catch (error) {
        console.error('submitQuizAnswer error:', error);
        res.status(500).json({ success: false, message: 'Error evaluating answer', error: error.message });
    }
};

// ─── Results ──────────────────────────────────────────────────────────────────

/** GET /api/duality/quiz/:id/results — Professor sees all student results */
exports.getQuizResults = async (req, res) => {
    try {
        const QuizSubmission = getQuizSubmission();
        const results = await QuizSubmission.find({ quiz: req.params.id })
            .populate('student', 'name email avatar')
            .populate('answers.question', 'title difficulty')
            .sort({ totalScore: -1 });
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('getQuizResults error:', error);
        res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
    }
};

/** GET /api/duality/quiz/:id/my-result — Student sees their own result */
exports.getMyQuizResult = async (req, res) => {
    try {
        const QuizSubmission = getQuizSubmission();
        const submission = await QuizSubmission.findOne({
            quiz: req.params.id,
            student: req.dualityUser._id,
        }).populate('answers.question', 'title difficulty category');

        if (!submission) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        console.error('getMyQuizResult error:', error);
        res.status(500).json({ success: false, message: 'Error fetching result', error: error.message });
    }
};
