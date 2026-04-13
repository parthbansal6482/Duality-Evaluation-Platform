const getDualitySubmission = require('../../models/duality/DualitySubmission');
const getDualityQuestion = require('../../models/duality/DualityQuestion');
const getDualityUser = require('../../models/duality/DualityUser');
const { runTestCases } = require('../../services/execution.service');
const { broadcastDualitySubmissionUpdate } = require('../../socket');

const getRunnableTestCases = (question, limit = null) => {
    const cases = (question.testCases || []).map((tc, i) => ({
        input: tc.input,
        expectedOutput: tc.output,
        id: `test_${i}`,
    }));

    // Backward-compatible fallback if legacy data has no testCases.
    const fallbackCases = (question.examples || []).map((ex, i) => ({
        input: ex.input,
        expectedOutput: ex.output,
        id: `example_${i}`,
    }));

    const runnable = cases.length > 0 ? cases : fallbackCases;
    return typeof limit === 'number' ? runnable.slice(0, limit) : runnable;
};

/**
 * Submit code for a question
 * POST /api/duality/submissions
 */
exports.submitCode = async (req, res) => {
    try {
        const { questionId, code, language } = req.body;
        const userId = req.dualityUser._id;

        if (!questionId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: questionId, code, language',
            });
        }

        const DualityQuestion = getDualityQuestion();
        const question = await DualityQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const DualitySubmission = getDualitySubmission();
        const DualityUser = getDualityUser();

        // Track active usage when student interacts with the judge.
        await DualityUser.findByIdAndUpdate(userId, { lastActiveDate: new Date() });

        // Combine both visible examples and hidden test cases for full evaluation
        const visibleTestCases = (question.examples || []).map((ex, i) => ({
            input: ex.input,
            expectedOutput: ex.output,
            id: `submit_example_${i}`,
        }));
        const hiddenTestCases = (question.testCases || []).map((tc, i) => ({
            input: tc.input,
            expectedOutput: tc.output,
            id: `submit_test_${i}`,
        }));
        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        if (allTestCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No runnable test cases configured for this question',
            });
        }

        // 2. Execute code synchronously
        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, allTestCases, driverCode);

        // 3. Determine status
        let status = 'accepted';
        if (result.passedTests < result.totalTests) {
            status = 'wrong_answer';
        }

        const hasTimeout = result.results.some(r => r.error && r.error.includes('timeout'));
        const hasMLE = result.results.some(r => r.exitCode === 137);

        if (hasTimeout) {
            status = 'time_limit_exceeded';
        } else if (hasMLE) {
            status = 'memory_limit_exceeded';
        }

        const hasRuntimeError = result.results.some(r => r.error && !r.error.includes('timeout') && r.exitCode !== 137);
        if (hasRuntimeError && (status === 'accepted' || status === 'wrong_answer')) {
            status = 'runtime_error';
        }

        const avgTime = result.results.length > 0 ? (result.results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / result.results.length) : 0;
        const maxMem = result.results.length > 0 ? Math.max(...result.results.map(r => r.memoryUsed || 0)) : 0;

        // Ensure we don't save NaN
        const finalAvgTime = isNaN(avgTime) ? 0 : Math.round(avgTime);
        const finalMaxMem = isNaN(maxMem) ? 0 : maxMem;

        // 4. Save to Database
        console.log(`[DualitySubmission] Saving submission for user ${userId}, question ${questionId}, status: ${status}`);
        const submission = await DualitySubmission.create({
            user: userId,
            question: questionId,
            code,
            language,
            status,
            totalTestCases: result.totalTests || 0,
            testCasesPassed: result.passedTests || 0,
            executionTime: finalAvgTime,
            memoryUsed: finalMaxMem,
            testResults: result.results,
        });

        // 5. Update User Stats if Accepted
        if (status === 'accepted') {
            const previousAccepted = await DualitySubmission.findOne({
                user: userId,
                question: questionId,
                status: 'accepted',
                _id: { $ne: submission._id },
            });

            if (!previousAccepted) {
                const difficultyField = {
                    'Easy': 'easySolved',
                    'Medium': 'mediumSolved',
                    'Hard': 'hardSolved',
                }[question.difficulty];

                const update = { $inc: { totalSolved: 1 } };
                if (difficultyField) update.$inc[difficultyField] = 1;

                await DualityUser.findByIdAndUpdate(userId, update);
            }
        }

        // 6. Broadcast Update - Unify field names with frontend service types
        broadcastDualitySubmissionUpdate(userId, {
            submissionId: submission._id,
            status,
            totalTestCases: result.totalTests,
            testCasesPassed: result.passedTests,
            executionTime: finalAvgTime,
            memoryUsed: finalMaxMem,
            results: result.results.map(r => ({
                passed: r.passed,
                input: r.input,
                expectedOutput: r.expectedOutput,
                actualOutput: r.actualOutput,
                error: r.error
            })),
            submittedAt: submission.submittedAt,
            user: { id: userId, name: req.dualityUser.name },
            question: { id: questionId, title: question.title }
        });

        res.status(201).json({
            success: true,
            message: 'Submission evaluated successfully',
            data: {
                submissionId: submission._id,
                status,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                results: result.results.map(r => ({
                    passed: r.passed,
                    input: r.input,
                    expectedOutput: r.expectedOutput,
                    actualOutput: r.actualOutput,
                    error: r.error
                }))
            },
        });
    } catch (error) {
        console.error('Submission error stack:', error.stack);
        console.error('Submission error:', error);
        res.status(500).json({ success: false, message: 'Error processing submission', error: error.message });
    }
};

/**
 * Run code against test cases without saving a submission
 * POST /api/duality/submissions/run
 */
exports.runCode = async (req, res) => {
    try {
        const { questionId, code, language } = req.body;
        const userId = req.dualityUser._id;

        if (!questionId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: questionId, code, language',
            });
        }

        const DualityQuestion = getDualityQuestion();
        const question = await DualityQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // Run code should test against visible examples to provide expected feedback.
        const testCasesToRun = (question.examples || []).map((ex, i) => ({
            input: ex.input,
            expectedOutput: ex.output,
            id: `example_${i}`,
        }));

        if (testCasesToRun.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No runnable test cases configured for this question',
            });
        }

        const DualityUser = getDualityUser();
        await DualityUser.findByIdAndUpdate(userId, { lastActiveDate: new Date() });

        // Execute code
        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, testCasesToRun, driverCode);

        res.status(200).json({
            success: true,
            data: {
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                results: result.results.map(r => ({
                    passed: r.passed,
                    input: r.input,
                    expectedOutput: r.expectedOutput,
                    actualOutput: r.actualOutput,
                    error: r.error
                }))
            }
        });
    } catch (error) {
        console.error('Run code error:', error);
        res.status(500).json({ success: false, message: 'Error running code', error: error.message });
    }
};

/**
 * Get submission by ID
 * GET /api/duality/submissions/:id
 */
exports.getSubmission = async (req, res) => {
    try {
        const DualitySubmission = getDualitySubmission();
        const submission = await DualitySubmission.findById(req.params.id)
            .populate('question', 'title difficulty category');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        // Access control: user can only see their own submissions
        if (req.dualityUser.role !== 'admin' && submission.user.toString() !== req.dualityUser._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({ success: false, message: 'Error fetching submission', error: error.message });
    }
};

/**
 * Get all submissions for the logged-in user
 * GET /api/duality/submissions/user/me
 */
exports.getUserSubmissions = async (req, res) => {
    try {
        const DualitySubmission = getDualitySubmission();
        const submissions = await DualitySubmission.find({ user: req.dualityUser._id })
            .populate('question', 'title difficulty category')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Get user submissions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
    }
};

/**
 * Get submissions for a specific question by the logged-in user
 * GET /api/duality/submissions/question/:questionId
 */
exports.getQuestionSubmissions = async (req, res) => {
    try {
        const DualitySubmission = getDualitySubmission();
        const submissions = await DualitySubmission.find({
            user: req.dualityUser._id,
            question: req.params.questionId,
        })
            .populate('question', 'title difficulty category')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Get question submissions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
    }
};

/**
 * Get all submissions (Admin only)
 * GET /api/duality/submissions/all
 */
exports.getAllSubmissions = async (req, res) => {
    try {
        const DualitySubmission = getDualitySubmission();
        const submissions = await DualitySubmission.find({})
            .populate('user', 'name email avatar')
            .populate('question', 'title difficulty category')
            .sort({ submittedAt: -1 })
            .limit(100);

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Get all submissions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
    }
};
