const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
}

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
    },
    {
        title: 'Merge Two Sorted Lists',
        difficulty: 'Easy',
        category: 'Linked List',
        description: 'You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.',
        constraints: [
            'The number of nodes in both lists is in the range [0, 50].',
            '-100 <= Node.val <= 100',
            'Both list1 and list2 are sorted in non-decreasing order.'
        ],
        examples: [
            {
                input: 'list1 = [1,2,4], list2 = [1,3,4]',
                output: '[1,1,2,3,4,4]'
            }
        ],
        testCases: [
            { input: '[1,2,4]\n[1,3,4]', output: '[1,1,2,3,4,4]' },
            { input: '[]\n[]', output: '[]' },
            { input: '[]\n[0]', output: '[0]' }
        ],
        boilerplate: {
            python: 'class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write your code here\n        pass',
            cpp: 'class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your code here\n        \n    }\n};',
            java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your code here\n        return null;\n    }\n}'
        }
    },
    {
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        category: 'Linked List',
        description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
        constraints: [
            'The number of nodes in the list is the range [0, 5000].',
            '-5000 <= Node.val <= 5000'
        ],
        examples: [
            {
                input: 'head = [1,2,3,4,5]',
                output: '[5,4,3,2,1]'
            }
        ],
        testCases: [
            { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]' },
            { input: '[1,2]', output: '[2,1]' },
            { input: '[]', output: '[]' }
        ],
        boilerplate: {
            python: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write your code here\n        pass',
            cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here\n        \n    }\n};',
            java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your code here\n        return null;\n    }\n}'
        }
    },
    {
        title: 'Binary Search',
        difficulty: 'Easy',
        category: 'Binary Search',
        description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.',
        constraints: [
            '1 <= nums.length <= 10^4',
            '-10^4 < nums[i], target < 10^4',
            'All the integers in nums are unique.',
            'nums is sorted in ascending order.'
        ],
        examples: [
            {
                input: 'nums = [-1,0,3,5,9,12], target = 9',
                output: '4',
                explanation: '9 exists in nums and its index is 4'
            }
        ],
        testCases: [
            { input: '[-1,0,3,5,9,12]\n9', output: '4' },
            { input: '[-1,0,3,5,9,12]\n2', output: '-1' }
        ],
        boilerplate: {
            python: 'class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your code here\n        pass',
            cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
            java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Write your code here\n        return -1;\n    }\n}'
        }
    }
];

async function seed() {
    try {
        console.log('Connecting to EvalHub database...');
        const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
        console.log('Connected.');

        // Define schemas
        const allowedEmailSchema = new mongoose.Schema({ email: { type: String, unique: true, lowercase: true } });
        const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true, lowercase: true }, role: String });
        const questionSchema = new mongoose.Schema({
            title: String, difficulty: String, category: String, description: String,
            constraints: [String], examples: [mongoose.Schema.Types.Mixed],
            testCases: [mongoose.Schema.Types.Mixed], boilerplate: mongoose.Schema.Types.Mixed,
            createdBy: mongoose.Schema.Types.ObjectId
        });
        const submissionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, question: mongoose.Schema.Types.ObjectId });

        const AllowedEmail = conn.model('DualityAllowedEmail', allowedEmailSchema);
        const User = conn.model('DualityUser', userSchema);
        const Question = conn.model('DualityQuestion', questionSchema);
        const Submission = conn.model('DualitySubmission', submissionSchema);

        // 1. Clear temporary data (except the 2 users we just created)
        console.log('Clearing old questions and submissions...');
        await Question.deleteMany({});
        await Submission.deleteMany({});

        // 2. Ensure users are there
        console.log('Ensuring users and allowlist...');
        const adminUser = await User.findOneAndUpdate(
            { email: 'sharman.maheshwari.24cse@bmu.edu.in' },
            { name: 'Sharman Maheshwari', role: 'admin' },
            { upsert: true, new: true }
        );

        await AllowedEmail.findOneAndUpdate({ email: 'sharman.maheshwari.24cse@bmu.edu.in' }, { email: 'sharman.maheshwari.24cse@bmu.edu.in' }, { upsert: true });
        await AllowedEmail.findOneAndUpdate({ email: 'parth.bansal.24cse@bmu.edu.in' }, { email: 'parth.bansal.24cse@bmu.edu.in' }, { upsert: true });

        // 3. Seed questions
        console.log('Seeding 5 DSA questions...');
        for (const q of questions) {
            await Question.create({
                ...q,
                createdBy: adminUser._id
            });
            console.log(`Added question: ${q.title}`);
        }

        console.log('\nSeed successful. database is clean and has 5 questions.');
        await conn.close();
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
