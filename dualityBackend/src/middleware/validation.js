const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Admin signup validation rules
exports.adminSignupRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

// Admin login validation rules
exports.adminLoginRules = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Team registration validation rules
exports.teamRegisterRules = [
    body('teamName').trim().notEmpty().withMessage('Team name is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('members')
        .isArray({ min: 2, max: 3 })
        .withMessage('Team must have 2 to 3 members'),
    body('members.*.name').trim().notEmpty().withMessage('Member name is required'),
    body('members.*.email')
        .isEmail()
        .withMessage('Please provide valid email for all members'),
];

// Team login validation rules
exports.teamLoginRules = [
    body('teamName').trim().notEmpty().withMessage('Team name is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Question validation middleware
exports.validateQuestion = [
    body('title').trim().notEmpty().withMessage('Question title is required'),
    body('difficulty')
        .isIn(['Easy', 'Medium', 'Hard'])
        .withMessage('Difficulty must be Easy, Medium, or Hard'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('inputFormat').optional().isString().withMessage('Input format must be a string'),
    body('outputFormat').optional().isString().withMessage('Output format must be a string'),
    body('constraints')
        .custom((value) => typeof value === 'string' || Array.isArray(value))
        .withMessage('Constraints must be a string or an array of strings'),
    body('examples')
        .isArray({ min: 1 })
        .withMessage('At least one example is required'),
    body('examples.*.input').trim().notEmpty().withMessage('Example input is required'),
    body('examples.*.output').trim().notEmpty().withMessage('Example output is required'),
    body('testCases')
        .custom((value, { req }) => {
            // New structure: testCases is array.
            // Legacy payload support: hiddenTestCases can carry hidden cases while testCases may be number.
            const hasArrayTestCases = Array.isArray(value);
            const hasLegacyHiddenCases = Array.isArray(req.body.hiddenTestCases);
            return hasArrayTestCases || hasLegacyHiddenCases;
        })
        .withMessage('At least one hidden test case array is required (testCases or hiddenTestCases)'),
    body('testCases.*.input')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Test case input is required'),
    body('testCases.*.output')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Test case output is required'),
    body('hiddenTestCases')
        .optional()
        .isArray()
        .withMessage('Hidden test cases must be an array'),
    body('hiddenTestCases.*.input')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Hidden test case input is required'),
    body('hiddenTestCases.*.output')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Hidden test case output is required'),
    exports.validate,
];

// Round validation middleware
exports.validateRound = [
    body('name').trim().notEmpty().withMessage('Round name is required'),
    body('duration')
        .isInt({ min: 1 })
        .withMessage('Duration must be at least 1 minute'),
    body('questions')
        .optional()
        .isArray()
        .withMessage('Questions must be an array'),
    body('status')
        .optional()
        .isIn(['upcoming', 'active', 'completed'])
        .withMessage('Status must be upcoming, active, or completed'),
    exports.validate,
];
