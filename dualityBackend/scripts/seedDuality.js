const { initDB } = require('./script-db');

const questions = [
    {
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Array',
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9'
        ],
        examples: [
            {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
            }
        ],
        testCases: [
            { input: '[2,7,11,15]\n9', output: '[0,1]' },
            { input: '[3,2,4]\n6', output: '[1,2]' },
            { input: '[3,3]\n6', output: '[0,1]' }
        ],
        boilerplate: {
            python: 'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass',
            cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
            java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[0];\n    }\n}'
        }
    },
    {
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        category: 'Stack',
        description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
        constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only \'()[]{}\'.'
        ],
        examples: [
            {
                input: 's = "()"',
                output: 'true'
            },
            {
                input: 's = "()[]{}"',
                output: 'true'
            },
            {
                input: 's = "(]"',
                output: 'false'
            }
        ],
        testCases: [
            { input: '"()"', output: 'true' },
            { input: '"()[]{}"', output: 'true' },
            { input: '"(]"', output: 'false' },
            { input: '"([)]"', output: 'false' },
            { input: '"{[]}"', output: 'true' }
        ],
        boilerplate: {
            python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your code here\n        pass',
            cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n        \n    }\n};',
            java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n        return false;\n    }\n}'
        }
    }
];

async function seed() {
    try {
        const { mode, models } = await initDB();
        
        const Question = models.Question;
        const User = models.User;
        const AllowedEmail = models.AllowedEmail;

        console.log(`\n=== Seeding [${mode.toUpperCase()}] Environment ===`);

        // 1. Ensure a default admin exists for attribution
        console.log('Ensuring admin user...');
        const adminEmail = 'parth.bansal.24cse@bmu.edu.in';
        
        let admin = await User.findOneAndUpdate(
            { email: adminEmail },
            { role: 'admin' },
            { upsert: true, new: true }
        );

        if (AllowedEmail) {
            console.log('Ensuring allowlist...');
            await AllowedEmail.findOneAndUpdate({ email: adminEmail }, { email: adminEmail }, { upsert: true });
        }

        // 2. Clear current question bank (optional, but standard for seed)
        console.log('Clearing existing questions...');
        await Question.deleteMany({});

        // 3. Insert questions
        console.log('Inserting seed questions...');
        for (const q of questions) {
            await Question.create({
                ...q,
                createdBy: admin._id
            });
            console.log(`✅ Added: ${q.title}`);
        }

        // Trigger real-time dashboard refresh
        try {
            const { broadcastDualityQuestionUpdate } = require('../src/socket');
            broadcastDualityQuestionUpdate();
            console.log('📡 Broadcasted update to dashboards.');
        } catch (err) {
            console.log('⚠️ Could not broadcast update (but questions were added).');
        }

        console.log(`\n🎉 Seed Successful for [${mode.toUpperCase()}] platform!`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed Error:', error.message);
        process.exit(1);
    }
}

seed();
