const { Student, ExamResult, Course } = require('../../models');
/**
 * GET /api/student/assessment/results
 * Get all exam results for student
 */
exports.getResults = async (req, res) => {
  try {
    const { examType, semester } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const query = { 
      studentId: student._id,
      published: true  // Only show published results
    };
    if (examType) query.examType = examType;
    const results = await ExamResult.find(query)
      .populate('courseId', 'name code type')
      .populate('classId', 'name section')
      .populate('enteredByTeacherId', 'user_id')
      .populate({
        path: 'enteredByTeacherId',
        populate: { path: 'user_id', select: 'name' }
      })
      .sort({ createdAt: -1 });
    // Calculate stats
    const stats = {
      total: results.length,
      passed: results.filter(r => r.grade !== 'F').length,
      failed: results.filter(r => r.grade === 'F').length,
      averagePercentage: 0
    };
    if (results.length > 0) {
      const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
      stats.averagePercentage = Math.round(totalPercentage / results.length);
    }
    res.json({
      success: true,
      results,
      stats
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/assessment/internal
 * Get internal assessment results
 */
exports.getInternalResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const results = await ExamResult.find({
      studentId: student._id,
      internalOrExternal: 'internal',
      published: true
    })
      .populate('courseId', 'name code type')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Internal results error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/assessment/external
 * Get external assessment results
 */
exports.getExternalResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const results = await ExamResult.find({
      studentId: student._id,
      internalOrExternal: 'external',
      published: true
    })
      .populate('courseId', 'name code type')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('External results error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/assessment/by-course/:courseId
 * Get results for a specific course
 */
exports.getResultsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const results = await ExamResult.find({
      studentId: student._id,
      courseId,
      published: true
    })
      .populate('courseId', 'name code type')
      .sort({ createdAt: -1 });
    const course = await Course.findById(courseId);
    res.json({
      success: true,
      course,
      results
    });
  } catch (error) {
    console.error('Results by course error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * GET /api/student/assessment/summary
 * Get overall assessment summary
 */
exports.getAssessmentSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }
    const results = await ExamResult.find({
      studentId: student._id,
      published: true
    }).populate('courseId', 'name type');
    // Group by exam type
    const schoolResults = results.filter(r => r.examType === 'school');
    const islamicResults = results.filter(r => r.examType === 'islamic');
    const calculateStats = (resultSet) => {
      if (resultSet.length === 0) return { total: 0, average: 0, passed: 0, failed: 0 };
      const total = resultSet.length;
      const passed = resultSet.filter(r => r.grade !== 'F').length;
      const failed = total - passed;
      const totalPercentage = resultSet.reduce((sum, r) => sum + (r.percentage || 0), 0);
      const average = Math.round(totalPercentage / total);
      return { total, average, passed, failed };
    };
    const summary = {
      school: calculateStats(schoolResults),
      islamic: calculateStats(islamicResults),
      overall: calculateStats(results)
    };
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Assessment summary error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
module.exports = exports;
