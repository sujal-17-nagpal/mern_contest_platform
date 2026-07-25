const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const Question = require('../models/Question');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { runCodeWandbox } = require('../utils/judgeEngine');

// 1. SAVE OR UPDATE REAL-TIME DRAFT ANSWERS (Auto-save)
router.post('/draft', authMiddleware, async (req, res) => {
  try {
    const { contestId, answers, timeTakenSeconds } = req.body;

    let submission = await Submission.findOne({ contestId, candidateId: req.user.id });

    if (!submission) {
      submission = new Submission({
        contestId,
        candidateId: req.user.id,
        answers: answers || [],
        timeTakenSeconds: timeTakenSeconds || 0,
        status: 'draft'
      });
    } else {
      if (submission.status === 'submitted' || submission.status === 'under_review' || submission.status === 'published') {
        return res.status(400).json({ message: 'Contest already submitted' });
      }
      if (answers) submission.answers = answers;
      if (timeTakenSeconds) submission.timeTakenSeconds = timeTakenSeconds;
    }

    await submission.save();
    res.json({ message: 'Draft auto-saved successfully', submission });
  } catch (err) {
    res.status(500).json({ message: 'Error auto-saving draft', error: err.message });
  }
});

// 2. GET DRAFT SUBMISSION FOR CONTEST (Reload recovery)
router.get('/draft/:contestId', authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      contestId: req.params.contestId,
      candidateId: req.user.id
    });
    res.json(submission || null);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching draft submission' });
  }
});

// 3. FINAL CONTEST SUBMISSION (Puts test into 'under_review' status)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { contestId, answers, timeTakenSeconds } = req.body;

    const contest = await Contest.findById(contestId).populate('questions');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    let totalScore = 0;
    let maxPossibleScore = 0;
    const evaluatedAnswers = [];

    for (const q of contest.questions) {
      maxPossibleScore += q.marks;
      const userAns = (answers || []).find(a => String(a.questionId) === String(q._id)) || {};

      let scoreAwarded = 0;
      let isCorrect = false;
      let testCasesPassed = 0;
      let totalTestCases = 0;

      if (q.type === 'mcq') {
        if (userAns.selectedOption && userAns.selectedOption === q.correctOption) {
          isCorrect = true;
          scoreAwarded = q.marks;
        }
      } else if (q.type === 'bug_hunt') {
        if (userAns.bugFix && userAns.bugFix.trim().length > 0) {
          isCorrect = true;
          scoreAwarded = q.marks;
        }
      } else if (q.type === 'coding') {
        totalTestCases = q.testCases.length;
        if (userAns.code) {
          let fullCodeToRun = userAns.code;
          if (!fullCodeToRun.includes('#include')) {
            fullCodeToRun = `#include <bits/stdc++.h>\nusing namespace std;\n\n${fullCodeToRun}`;
          }
          if (q.driverCode) {
            fullCodeToRun = `${fullCodeToRun}\n\n${q.driverCode}`;
          }
          for (const tc of q.testCases) {
            try {
              const res = await runCodeWandbox(fullCodeToRun, tc.input);
              if (res.output.trim() === tc.expectedOutput.trim()) {
                testCasesPassed++;
              }
            } catch (e) {}
          }
          if (totalTestCases > 0) {
            scoreAwarded = Math.round((testCasesPassed / totalTestCases) * q.marks);
            if (testCasesPassed === totalTestCases) isCorrect = true;
          }
        }
      }

      totalScore += scoreAwarded;

      evaluatedAnswers.push({
        questionId: q._id,
        type: q.type,
        selectedOption: userAns.selectedOption || '',
        bugIdentification: userAns.bugIdentification || '',
        bugFix: userAns.bugFix || '',
        code: userAns.code || '',
        testCasesPassed,
        totalTestCases,
        isCorrect,
        scoreAwarded
      });
    }

    let submission = await Submission.findOne({ contestId, candidateId: req.user.id });
    if (!submission) {
      submission = new Submission({
        contestId,
        candidateId: req.user.id
      });
    }

    submission.answers = evaluatedAnswers;
    submission.totalScore = totalScore;
    submission.maxPossibleScore = maxPossibleScore;
    submission.timeTakenSeconds = timeTakenSeconds || submission.timeTakenSeconds || 0;
    submission.status = 'under_review';
    submission.isResultsPublished = false;
    submission.submittedAt = new Date();

    await submission.save();
    res.json({
      message: 'Your test submission has been received! You will be able to see the result soon after instructor review.',
      submission
    });
  } catch (err) {
    res.status(500).json({ message: 'Error evaluating submission', error: err.message });
  }
});

// 4. ADMIN: GET ALL SUBMISSIONS FOR A CONTEST FOR REVIEW
router.get('/admin/contest/:contestId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({
      contestId: req.params.contestId,
      status: { $ne: 'draft' }
    })
      .populate('candidateId', 'name email')
      .populate('answers.questionId');

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching submissions for review' });
  }
});

// 5. ADMIN: UPDATE / GRADE A CANDIDATE SUBMISSION
router.put('/admin/grade/:submissionId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { answers, instructorFeedback } = req.body;

    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (answers && Array.isArray(answers)) {
      submission.answers = answers;
      let newTotal = 0;
      answers.forEach(a => {
        newTotal += (a.scoreAwarded || 0);
      });
      submission.totalScore = newTotal;
    }

    if (instructorFeedback !== undefined) {
      submission.instructorFeedback = instructorFeedback;
    }

    await submission.save();
    const updated = await Submission.findById(submission._id)
      .populate('candidateId', 'name email')
      .populate('answers.questionId');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error grading submission', error: err.message });
  }
});

// 6. ADMIN: PUBLISH CONTEST RESULTS & LEADERBOARD
router.post('/admin/publish/:contestId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Submission.updateMany(
      { contestId: req.params.contestId, status: { $ne: 'draft' } },
      { isResultsPublished: true, status: 'published' }
    );
    res.json({ message: 'Results published successfully! Candidates can now view their scores and leaderboard.' });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing results' });
  }
});

// 7. CANDIDATE: GET INDIVIDUAL RESULT
router.get('/result/:contestId', authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      contestId: req.params.contestId,
      candidateId: req.user.id
    })
      .populate('contestId', 'title description durationMinutes')
      .populate('answers.questionId', 'title description type marks options correctOption codeSnippet starterCode');

    if (!submission) {
      return res.status(404).json({ message: 'No submission found for this contest' });
    }

    if (!submission.isResultsPublished && req.user.role !== 'admin') {
      return res.json({
        isResultsPublished: false,
        message: 'Your test submission has been received! You will be able to see the result soon after instructor review.',
        submittedAt: submission.submittedAt
      });
    }

    res.json({
      isResultsPublished: true,
      submission
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching submission result' });
  }
});

// 8. GET LEADERBOARD (Only shows if published or for Admin)
router.get('/leaderboard/:contestId', authMiddleware, async (req, res) => {
  try {
    const isPublished = await Submission.exists({ contestId: req.params.contestId, isResultsPublished: true });

    if (!isPublished && req.user.role !== 'admin') {
      return res.json({
        isPublished: false,
        message: 'Leaderboard will be announced soon after instructor reviews all submissions.',
        leaderboard: []
      });
    }

    const submissions = await Submission.find({
      contestId: req.params.contestId,
      status: { $ne: 'draft' }
    })
      .populate('candidateId', 'name email')
      .sort({ totalScore: -1, timeTakenSeconds: 1 });

    const leaderboard = submissions.map((sub, index) => ({
      rank: index + 1,
      candidateName: sub.candidateId?.name || 'Anonymous',
      candidateEmail: sub.candidateId?.email || '',
      score: sub.totalScore,
      maxScore: sub.maxPossibleScore,
      timeTakenSeconds: sub.timeTakenSeconds,
      submittedAt: sub.submittedAt
    }));

    res.json({
      isPublished: true,
      leaderboard
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating leaderboard' });
  }
});

module.exports = router;
