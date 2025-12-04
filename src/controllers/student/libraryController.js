const { Student, LibraryBook, LibraryIssue } = require('../../models');

/**
 * GET /api/student/library/books
 * Get all available library books
 */
exports.getBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const books = await LibraryBook.find(query).sort({ title: 1 });

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/library/my-issues
 * Get student's issued books
 */
exports.getMyIssues = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const issues = await LibraryIssue.find({ studentId: student._id })
      .populate('bookId', 'title author isbn')
      .sort({ issuedAt: -1 });

    const activeIssues = issues.filter(i => i.status === 'issued');
    const overdueIssues = issues.filter(i => i.status === 'overdue');

    res.json({
      success: true,
      issues,
      stats: {
        active: activeIssues.length,
        overdue: overdueIssues.length,
        returned: issues.filter(i => i.status === 'returned').length
      }
    });
  } catch (error) {
    console.error('Get my issues error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/library/history
 * Get complete library issue history
 */
exports.getHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const history = await LibraryIssue.find({ studentId: student._id })
      .populate('bookId', 'title author isbn')
      .sort({ issuedAt: -1 });

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

module.exports = exports;
