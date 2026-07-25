const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { authMiddleware } = require('../middleware/auth');
const { runCodeWandbox } = require('../utils/judgeEngine');

// RUN CODE AGAINST ALL TEST CASES FOR A QUESTION
router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { questionId, code } = req.body;
    if (!questionId || !code) {
      return res.status(400).json({ message: 'Question ID and code are required' });
    }

    const question = await Question.findById(questionId);
    if (!question || question.type !== 'coding') {
      return res.status(404).json({ message: 'Coding question not found' });
    }

    // Auto-prepend standard headers if missing
    let fullCodeToRun = code;
    if (!fullCodeToRun.includes('#include')) {
      fullCodeToRun = `#include <bits/stdc++.h>\nusing namespace std;\n\n${fullCodeToRun}`;
    }
    if (question.driverCode) {
      fullCodeToRun = `${fullCodeToRun}\n\n${question.driverCode}`;
    }

    const testResults = [];
    let compileError = null;

    for (let i = 0; i < question.testCases.length; i++) {
      const tc = question.testCases[i];
      try {
        const result = await runCodeWandbox(fullCodeToRun, tc.input);

        if (result.compileError) {
          compileError = result.compileError;
          testResults.push({
            name: tc.isHidden ? `Hidden Test ${i + 1}` : `Sample Test ${i + 1}`,
            passed: false,
            error: 'Compile Error',
            isHidden: tc.isHidden
          });
          break;
        }

        const got = result.output.trim();
        const expected = tc.expectedOutput.trim();
        const passed = got === expected;

        testResults.push({
          name: tc.isHidden ? `Hidden Test ${i + 1}` : `Sample Test ${i + 1}`,
          passed,
          got: tc.isHidden ? 'Hidden' : got,
          expected: tc.isHidden ? 'Hidden' : expected,
          isHidden: tc.isHidden
        });
      } catch (err) {
        testResults.push({
          name: tc.isHidden ? `Hidden Test ${i + 1}` : `Sample Test ${i + 1}`,
          passed: false,
          error: 'Execution Error',
          isHidden: tc.isHidden
        });
      }
    }

    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = question.testCases.length;

    res.json({
      compileError,
      passedCount,
      totalCount,
      testResults
    });
  } catch (err) {
    res.status(500).json({ message: 'Error running code', error: err.message });
  }
});

module.exports = router;
