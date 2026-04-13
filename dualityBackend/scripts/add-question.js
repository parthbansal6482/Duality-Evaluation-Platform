require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const readline = require('readline');

// Models
const Admin = require('../src/models/Admin');
const Question = require('../src/models/Question');
const getDualityUser = require('../src/models/duality/DualityUser');
const getDualityQuestion = require('../src/models/duality/DualityQuestion');

const connectDB = require('../src/config/database');
const { connectPracticeDB } = require('../src/config/practiceDatabase');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// ============================================================================
// 👇 EDIT THIS OBJECT TO ADD YOUR OWN QUESTION
// ============================================================================
const questionsToAdd = [
    {
        title: "Two Sum",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
        inputFormat: "An array of integers `nums`, and an integer `target`",
        outputFormat: "An array of two integers representing the indices of the two numbers that add up to `target`",
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists",
        examples: [
            { input: "[2,7,11,15]\n9", output: "[0,1]", explanation: "nums[0] + nums[1] == 2 + 7 == 9, so we return [0, 1]." },
            { input: "[3,2,4]\n6", output: "[1,2]", explanation: "nums[1] + nums[2] == 2 + 4 == 6, so we return [1, 2]." },
            { input: "[1,5,3,7]\n8", output: "[1,2]", explanation: "nums[1] + nums[2] == 5 + 3 == 8, so we return [1, 2]." }
        ],
        testCases: [
            { input: "[3,3]\n6", output: "[0,1]" },
            { input: "[0,4,3,0]\n0", output: "[0,3]" },
            { input: "[-1,-2,-3,-4,-5]\n-8", output: "[2,4]" }
        ],
        boilerplateCode: {
            python: "def twoSum(nums, target):\n    # write your solution here\n    pass\n",
            c: "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // write your solution here\n}\n",
            cpp: "#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // write your solution here\n}\n",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\nimport ast\nimport json\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    inputs = sys.stdin.read().strip().split('\\n')\n    if len(inputs) >= 2:\n        nums = ast.literal_eval(inputs[0])\n        target = int(inputs[1])\n        result = twoSum(nums, target)\n        print(json.dumps(sorted(result)).replace(' ', ''))\n",
            cpp: "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    string line;\n    getline(cin, line);\n    vector<int> nums;\n    // parse array from string like [2,7,11,15]\n    line = line.substr(1, line.size() - 2);\n    stringstream ss(line);\n    string token;\n    while (getline(ss, token, ',')) nums.push_back(stoi(token));\n    int target;\n    cin >> target;\n    vector<int> result = twoSum(nums, target);\n    sort(result.begin(), result.end());\n    cout << \"[\" << result[0] << \",\" << result[1] << \"]\" << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char line[100000];\n    fgets(line, sizeof(line), stdin);\n    int nums[10001], numsSize = 0;\n    char *p = line + 1;\n    while (*p && *p != ']') {\n        nums[numsSize++] = strtol(p, &p, 10);\n        if (*p == ',') p++;\n    }\n    int target;\n    scanf(\"%d\", &target);\n    int returnSize;\n    int *result = twoSum(nums, numsSize, target, &returnSize);\n    int a = result[0], b = result[1];\n    if (a > b) { int tmp = a; a = b; b = tmp; }\n    printf(\"[%d,%d]\\n\", a, b);\n    free(result);\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine().trim();\n        line = line.substring(1, line.length() - 1);\n        String[] parts = line.split(\",\");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());\n        int target = sc.nextInt();\n        Solution sol = new Solution();\n        int[] result = sol.twoSum(nums, target);\n        Arrays.sort(result);\n        System.out.println(\"[\" + result[0] + \",\" + result[1] + \"]\");\n    }\n}\n"
        }
    },
    {
        title: "Best Time to Buy and Sell Stock",
        difficulty: "Easy",
        category: "Arrays",
        description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
        inputFormat: "An array of integers `prices` where `prices[i]` represents the stock price on day `i`",
        outputFormat: "A single integer representing the maximum profit achievable. Return `0` if no profit is possible.",
        constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
        examples: [
            { input: "[7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6). Profit = 6 - 1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell." },
            { input: "[7,6,4,3,1]", output: "0", explanation: "In this case, no transaction is done and the max profit is 0, since the prices are strictly decreasing." },
            { input: "[2,4,1,7]", output: "6", explanation: "Buy on day 3 (price = 1) and sell on day 4 (price = 7). Profit = 7 - 1 = 6." }
        ],
        testCases: [
            { input: "[1,2]", output: "1" },
            { input: "[3,3,3,3]", output: "0" },
            { input: "[10,1,10]", output: "9" }
        ],
        boilerplateCode: {
            python: "def maxProfit(prices):\n    # write your solution here\n    pass\n",
            c: "int maxProfit(int* prices, int pricesSize) {\n    // write your solution here\n}\n",
            cpp: "#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    // write your solution here\n}\n",
            java: "class Solution {\n    public int maxProfit(int[] prices) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\nimport ast\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    prices = ast.literal_eval(line)\n    print(maxProfit(prices))\n",
            cpp: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.size() - 2);\n    vector<int> prices;\n    stringstream ss(line);\n    string token;\n    while (getline(ss, token, ',')) prices.push_back(stoi(token));\n    cout << maxProfit(prices) << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdlib.h>\n\n{{USER_CODE}}\n\nint main() {\n    char line[200000];\n    fgets(line, sizeof(line), stdin);\n    int prices[100001], n = 0;\n    char *p = line + 1;\n    while (*p && *p != ']') {\n        prices[n++] = strtol(p, &p, 10);\n        if (*p == ',') p++;\n    }\n    printf(\"%d\\n\", maxProfit(prices, n));\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine().trim();\n        line = line.substring(1, line.length() - 1);\n        String[] parts = line.split(\",\");\n        int[] prices = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) prices[i] = Integer.parseInt(parts[i].trim());\n        Solution sol = new Solution();\n        System.out.println(sol.maxProfit(prices));\n    }\n}\n"
        }
    },
    {
        title: "Spiral Matrix",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an `m x n` matrix, return all elements of the matrix in spiral order, starting from the top-left and proceeding clockwise (right → down → left → up, repeating inward).",
        inputFormat: "A 2D matrix of integers with `m` rows and `n` columns",
        outputFormat: "A 1D array containing all elements of the matrix in clockwise spiral order",
        constraints: "m == matrix.length\nn == matrix[i].length\n1 <= m, n <= 10\n-100 <= matrix[i][j] <= 100",
        examples: [
            { input: "[[1,2,3],[4,5,6],[7,8,9]]", output: "[1,2,3,6,9,8,7,4,5]", explanation: "Traverse right [1,2,3], down [6,9], left [8,7], up [4], then center [5]." },
            { input: "[[1,2,3,4],[5,6,7,8],[9,10,11,12]]", output: "[1,2,3,4,8,12,11,10,9,5,6,7]", explanation: "Traverse right [1,2,3,4], down [8,12], left [11,10,9], up [5], then right [6,7]." },
            { input: "[[1,2],[3,4]]", output: "[1,2,4,3]", explanation: "Traverse right [1,2], down [4], left [3]. The spiral completes after one loop." }
        ],
        testCases: [
            { input: "[[1]]", output: "[1]" },
            { input: "[[1,2,3]]", output: "[1,2,3]" },
            { input: "[[1],[2],[3]]", output: "[1,2,3]" }
        ],
        boilerplateCode: {
            python: "def spiralOrder(matrix):\n    # write your solution here\n    pass\n",
            c: "int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {\n    // write your solution here\n}\n",
            cpp: "#include <vector>\nusing namespace std;\n\nvector<int> spiralOrder(vector<vector<int>>& matrix) {\n    // write your solution here\n}\n",
            java: "import java.util.*;\n\nclass Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\nimport ast\nimport json\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    matrix = ast.literal_eval(line)\n    result = spiralOrder(matrix)\n    print(json.dumps(result).replace(' ', ''))\n",
            cpp: "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <string>\nusing namespace std;\n\n{{USER_CODE}}\n\nvector<vector<int>> parseMatrix(const string& s) {\n    vector<vector<int>> mat;\n    int i = 1;\n    while (i < (int)s.size()) {\n        if (s[i] == '[') {\n            vector<int> row;\n            i++;\n            while (s[i] != ']') {\n                if (s[i] == ',' || s[i] == ' ') { i++; continue; }\n                int sign = 1;\n                if (s[i] == '-') { sign = -1; i++; }\n                int num = 0;\n                while (i < (int)s.size() && isdigit(s[i])) num = num * 10 + (s[i++] - '0');\n                row.push_back(sign * num);\n            }\n            mat.push_back(row); i++;\n        } else i++;\n    }\n    return mat;\n}\n\nint main() {\n    string line;\n    getline(cin, line);\n    vector<vector<int>> matrix = parseMatrix(line);\n    vector<int> result = spiralOrder(matrix);\n    cout << \"[\";\n    for (int i = 0; i < (int)result.size(); i++) {\n        if (i) cout << \",\";\n        cout << result[i];\n    }\n    cout << \"]\" << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char line[10000];\n    fgets(line, sizeof(line), stdin);\n    int flat[1000], fi = 0, rows = 0, cols = -1;\n    int curRow[100], ci = 0;\n    char *p = line;\n    while (*p) {\n        if (*p == '-' || isdigit(*p)) {\n            curRow[ci++] = strtol(p, &p, 10);\n        } else if (*p == ']' && ci > 0) {\n            if (cols == -1) cols = ci;\n            for (int j = 0; j < ci; j++) flat[fi++] = curRow[j];\n            ci = 0; rows++; p++;\n        } else p++;\n    }\n    int **matrix = (int**)malloc(rows * sizeof(int*));\n    int colSize[100];\n    for (int i = 0; i < rows; i++) {\n        matrix[i] = flat + i * cols;\n        colSize[i] = cols;\n    }\n    int returnSize;\n    int *result = spiralOrder(matrix, rows, colSize, &returnSize);\n    printf(\"[\");\n    for (int i = 0; i < returnSize; i++) { if (i) printf(\",\"); printf(\"%d\", result[i]); }\n    printf(\"]\\n\");\n    free(result); free(matrix);\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine().trim();\n        List<int[]> rows = new ArrayList<>();\n        int i = 0;\n        while (i < line.length()) {\n            if (line.charAt(i) == '[' && i + 1 < line.length() && line.charAt(i+1) != '[') {\n                int end = line.indexOf(']', i);\n                String[] parts = line.substring(i + 1, end).split(\",\");\n                int[] row = new int[parts.length];\n                for (int j = 0; j < parts.length; j++) row[j] = Integer.parseInt(parts[j].trim());\n                rows.add(row); i = end + 1;\n            } else i++;\n        }\n        int[][] matrix = rows.toArray(new int[0][]);\n        Solution sol = new Solution();\n        List<Integer> result = sol.spiralOrder(matrix);\n        StringBuilder sb = new StringBuilder(\"[\");\n        for (int k = 0; k < result.size(); k++) { if (k > 0) sb.append(\",\"); sb.append(result.get(k)); }\n        sb.append(\"]\");\n        System.out.println(sb);\n    }\n}\n"
        }
    },
    {
        title: "Valid Anagram",
        difficulty: "Easy",
        category: "Strings",
        description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word or phrase formed by rearranging the letters of another, using all the original letters exactly once.",
        inputFormat: "Two strings `s` and `t`, each on a separate line",
        outputFormat: "`true` if `t` is a valid anagram of `s`, otherwise `false`",
        constraints: "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters only",
        examples: [
            { input: "anagram\nnagaram", output: "true", explanation: "Both strings contain the same characters with the same frequencies: a×3, n×1, g×1, r×1, m×1." },
            { input: "rat\ncar", output: "false", explanation: "The characters differ: 'rat' has r,a,t while 'car' has c,a,r. 't' ≠ 'c', so it is not an anagram." },
            { input: "listen\nsilent", output: "true", explanation: "Both strings contain l,i,s,t,e,n exactly once each, just rearranged." }
        ],
        testCases: [
            { input: "a\na", output: "true" },
            { input: "ab\nba", output: "true" },
            { input: "abc\nabd", output: "false" }
        ],
        boilerplateCode: {
            python: "def isAnagram(s, t):\n    # write your solution here\n    pass\n",
            c: "#include <stdbool.h>\n\nbool isAnagram(char* s, char* t) {\n    // write your solution here\n}\n",
            cpp: "#include <string>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    // write your solution here\n}\n",
            java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    inputs = sys.stdin.read().strip().split('\\n')\n    s = inputs[0]\n    t = inputs[1]\n    print('true' if isAnagram(s, t) else 'false')\n",
            cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    string s, t;\n    getline(cin, s);\n    getline(cin, t);\n    cout << (isAnagram(s, t) ? \"true\" : \"false\") << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char s[100001], t[100001];\n    scanf(\"%s %s\", s, t);\n    printf(\"%s\\n\", isAnagram(s, t) ? \"true\" : \"false\");\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        String t = sc.nextLine().trim();\n        Solution sol = new Solution();\n        System.out.println(sol.isAnagram(s, t) ? \"true\" : \"false\");\n    }\n}\n"
        }
    },
    {
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "Stacks",
        description: "Given a string `s` containing only the characters `'('`, `')'`, `'{'`, `'}'`, `'['`, and `']'`, determine if the input string is valid. A string is valid if every open bracket is closed by the same type of bracket, every open bracket is closed in the correct order, and no closing bracket is unmatched.",
        inputFormat: "A string `s` consisting only of the characters `(`, `)`, `{`, `}`, `[`, `]`",
        outputFormat: "`true` if the string is valid, otherwise `false`",
        constraints: "1 <= s.length <= 10^4\ns consists of parentheses only: '()[]{}'",
        examples: [
            { input: "()", output: "true", explanation: "A single pair of matching parentheses is valid." },
            { input: "()[]{}", output: "true", explanation: "Three consecutive pairs, each correctly matched and properly ordered." },
            { input: "(]", output: "false", explanation: "The opening '(' is closed by ']', which is the wrong bracket type." }
        ],
        testCases: [
            { input: "{[]}", output: "true" },
            { input: "([)]", output: "false" },
            { input: "((((", output: "false" }
        ],
        boilerplateCode: {
            python: "def isValid(s):\n    # write your solution here\n    pass\n",
            c: "#include <stdbool.h>\n\nbool isValid(char* s) {\n    // write your solution here\n}\n",
            cpp: "#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    // write your solution here\n}\n",
            java: "class Solution {\n    public boolean isValid(String s) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print('true' if isValid(s) else 'false')\n",
            cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    string s;\n    getline(cin, s);\n    cout << (isValid(s) ? \"true\" : \"false\") << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdbool.h>\n\n{{USER_CODE}}\n\nint main() {\n    char s[20001];\n    scanf(\"%s\", s);\n    printf(\"%s\\n\", isValid(s) ? \"true\" : \"false\");\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        Solution sol = new Solution();\n        System.out.println(sol.isValid(s) ? \"true\" : \"false\");\n    }\n}\n"
        }
    },
    {
        title: "Reverse Linked List",
        difficulty: "Easy",
        category: "Linked Lists",
        description: "Given the `head` of a singly linked list, reverse the list and return the reversed list's head. You must reverse the links between nodes in-place without allocating extra space for another list.",
        inputFormat: "A singly linked list represented as an array of node values in order (e.g., `[1,2,3,4,5]` means 1 → 2 → 3 → 4 → 5 → null)",
        outputFormat: "The reversed linked list, represented as an array of node values (e.g., `[5,4,3,2,1]`)",
        constraints: "0 <= number of nodes <= 5000\n-5000 <= Node.val <= 5000",
        examples: [
            { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "The linked list 1 → 2 → 3 → 4 → 5 is reversed to 5 → 4 → 3 → 2 → 1." },
            { input: "[1,2]", output: "[2,1]", explanation: "The two-node list 1 → 2 is reversed to 2 → 1." },
            { input: "[3,1,4,1,5]", output: "[5,1,4,1,3]", explanation: "Duplicate values are handled correctly. The list 3 → 1 → 4 → 1 → 5 is reversed to 5 → 1 → 4 → 1 → 3." }
        ],
        testCases: [
            { input: "[]", output: "[]" },
            { input: "[1]", output: "[1]" },
            { input: "[1,2,3]", output: "[3,2,1]" }
        ],
        boilerplateCode: {
            python: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverseList(head):\n    # write your solution here\n    pass\n",
            c: "struct ListNode {\n    int val;\n    struct ListNode *next;\n};\n\nstruct ListNode* reverseList(struct ListNode* head) {\n    // write your solution here\n}\n",
            cpp: "struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nListNode* reverseList(ListNode* head) {\n    // write your solution here\n}\n",
            java: "class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int x) { val = x; }\n}\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // write your solution here\n    }\n}\n"
        },
        driverCode: {
            python: "import sys\nimport ast\nimport json\n\n{{USER_CODE}}\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    vals = ast.literal_eval(line)\n    head = None\n    for v in reversed(vals):\n        head = ListNode(v, head)\n    result = reverseList(head)\n    output = []\n    while result:\n        output.append(result.val)\n        result = result.next\n    print(json.dumps(output).replace(' ', ''))\n",
            cpp: "#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    string line;\n    getline(cin, line);\n    line = line.substr(1, line.size() - 2);\n    vector<int> vals;\n    if (!line.empty()) {\n        stringstream ss(line);\n        string token;\n        while (getline(ss, token, ',')) vals.push_back(stoi(token));\n    }\n    ListNode* head = nullptr;\n    for (int i = (int)vals.size() - 1; i >= 0; i--) {\n        ListNode* node = new ListNode(vals[i]);\n        node->next = head;\n        head = node;\n    }\n    ListNode* result = reverseList(head);\n    cout << \"[\";\n    bool first = true;\n    while (result) {\n        if (!first) cout << \",\";\n        cout << result->val;\n        first = false;\n        ListNode* tmp = result;\n        result = result->next;\n        delete tmp;\n    }\n    cout << \"]\" << endl;\n    return 0;\n}\n",
            c: "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char line[100000];\n    fgets(line, sizeof(line), stdin);\n    int vals[5001], n = 0;\n    char *p = line + 1;\n    while (*p && *p != ']') {\n        if (*p == ',' || *p == ' ') { p++; continue; }\n        vals[n++] = strtol(p, &p, 10);\n    }\n    struct ListNode *head = NULL;\n    for (int i = n - 1; i >= 0; i--) {\n        struct ListNode *node = (struct ListNode*)malloc(sizeof(struct ListNode));\n        node->val = vals[i]; node->next = head; head = node;\n    }\n    struct ListNode *result = reverseList(head);\n    printf(\"[\");\n    int first = 1;\n    while (result) {\n        if (!first) printf(\",\");\n        printf(\"%d\", result->val);\n        first = 0;\n        struct ListNode *tmp = result;\n        result = result->next;\n        free(tmp);\n    }\n    printf(\"]\\n\");\n    return 0;\n}\n",
            java: "import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine().trim();\n        line = line.substring(1, line.length() - 1).trim();\n        ListNode head = null;\n        if (!line.isEmpty()) {\n            String[] parts = line.split(\",\");\n            for (int i = parts.length - 1; i >= 0; i--) {\n                ListNode node = new ListNode(Integer.parseInt(parts[i].trim()));\n                node.next = head;\n                head = node;\n            }\n        }\n        Solution sol = new Solution();\n        ListNode result = sol.reverseList(head);\n        StringBuilder sb = new StringBuilder(\"[\");\n        boolean first = true;\n        while (result != null) {\n            if (!first) sb.append(\",\");\n            sb.append(result.val);\n            first = false;\n            result = result.next;\n        }\n        sb.append(\"]\");\n        System.out.println(sb);\n    }\n}\n"
        }
    }
];
// ============================================================================

async function run() {
    try {
        console.log("=== EvalHub Question Seeder ===");
        const creatorEmail = await askQuestion("Enter your Admin email (to assign as creator): ");

        await connectPracticeDB();
        const DualityUser = getDualityUser();
        const DualityQuestion = getDualityQuestion();
        
        let user = await DualityUser.findOne({ email: creatorEmail, role: 'admin' });
        if (!user) {
            console.log(`Admin ${creatorEmail} not found. Attributing to first available admin...`);
            user = await DualityUser.findOne({ role: 'admin' });
            if (!user) throw new Error("No admins found in EvalHub DB. Please run add-admin.js to upgrade a user first.");
        }

        for (const newQuestion of questionsToAdd) {
            try {
                // Adapt structural properties for Practice Question Model
                const practiceQuestion = {
                    title: newQuestion.title,
                    difficulty: newQuestion.difficulty,
                    category: newQuestion.category,
                    description: newQuestion.description,
                    constraints: newQuestion.constraints.split('\n').filter(c => c.trim() !== ''), 
                    examples: newQuestion.examples,
                    testCases: newQuestion.testCases, 
                    boilerplate: newQuestion.boilerplateCode, 
                    driverCode: newQuestion.driverCode,
                    createdBy: user._id
                };

                const created = await DualityQuestion.create(practiceQuestion);
                console.log(`\n✅ Successfully added "${created.title}" to EvalHub Assigments!`);
            } catch (e) {
                if (e.code === 11000) {
                    console.error(`\n❌ Error: A question with the title "${newQuestion.title}" already exists.`);
                } else {
                    console.error(`\n❌ Error adding "${newQuestion.title}":`, e.message);
                }
            }
        }
    } catch (e) {
        console.error("\n❌ Fatal Error occurred:", e.message);
        console.error(e);
    } finally {
        rl.close();
        process.exit(0);
    }
}

run();
