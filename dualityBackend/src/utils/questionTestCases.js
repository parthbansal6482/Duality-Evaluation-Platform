const toExecutionCase = (tc) => ({
    input: tc.input,
    expectedOutput: tc.output,
});

const getVisibleCases = (question) => (question.examples || []).map(toExecutionCase);

const getHiddenCases = (question) => {
    // New unified schema
    if (Array.isArray(question.testCases) && question.testCases.length > 0) {
        return question.testCases.map(toExecutionCase);
    }

    // Legacy fallback for old competition docs
    if (Array.isArray(question.hiddenTestCases) && question.hiddenTestCases.length > 0) {
        return question.hiddenTestCases.map(toExecutionCase);
    }

    return [];
};

const getAllCases = (question) => [...getVisibleCases(question), ...getHiddenCases(question)];

module.exports = {
    getVisibleCases,
    getHiddenCases,
    getAllCases,
};
