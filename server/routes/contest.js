const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const Question = require('../models/Question');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET ALL PUBLISHED CONTESTS (Candidates)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contests = await Contest.find({ isPublished: true })
      .populate('questions', 'title type marks')
      .sort({ startTime: -1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contests' });
  }
});

// GET CONTEST BY ID WITH QUESTIONS
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('questions');
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Hide hidden test cases from candidates
    if (req.user.role !== 'admin') {
      const sanitizedQuestions = contest.questions.map(q => {
        const doc = q.toObject();
        if (doc.testCases) {
          doc.testCases = doc.testCases.map(tc => tc.isHidden ? { isHidden: true } : tc);
        }
        return doc;
      });
      const sanitizedContest = contest.toObject();
      sanitizedContest.questions = sanitizedQuestions;
      return res.json(sanitizedContest);
    }

    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contest details' });
  }
});

// CREATE NEW CONTEST (Admin Only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, durationMinutes, startTime, endTime, questions } = req.body;
    
    const questionIds = [];
    if (questions && questions.length > 0) {
      for (const qData of questions) {
        if (typeof qData === 'string') {
          questionIds.push(qData);
        } else {
          const newQ = new Question(qData);
          await newQ.save();
          questionIds.push(newQ._id);
        }
      }
    }

    const newContest = new Contest({
      title,
      description,
      durationMinutes: durationMinutes || 40,
      startTime: startTime || new Date(),
      endTime: endTime || new Date(Date.now() + 7 * 24 * 3600 * 1000),
      questions: questionIds,
      createdBy: req.user.id
    });

    await newContest.save();
    const populated = await Contest.findById(newContest._id).populate('questions');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error creating contest', error: err.message });
  }
});

// EDIT CONTEST (Admin Only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, durationMinutes, questions } = req.body;

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    // Process questions: update existing ones or create new ones
    const updatedQuestionIds = [];
    if (questions && questions.length > 0) {
      for (const qData of questions) {
        if (qData._id) {
          // Update existing question
          await Question.findByIdAndUpdate(qData._id, qData, { new: true });
          updatedQuestionIds.push(qData._id);
        } else {
          // Create new question
          const newQ = new Question(qData);
          await newQ.save();
          updatedQuestionIds.push(newQ._id);
        }
      }
    }

    contest.title = title || contest.title;
    contest.description = description || contest.description;
    contest.durationMinutes = durationMinutes || contest.durationMinutes;
    contest.questions = updatedQuestionIds;

    await contest.save();
    const populated = await Contest.findById(contest._id).populate('questions');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating contest', error: err.message });
  }
});

// DELETE CONTEST (Admin Only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json({ message: 'Contest deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting contest' });
  }
});

module.exports = router;
