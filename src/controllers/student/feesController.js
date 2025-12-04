const { Student, Fine, FeeStructure, FeePayment } = require('../../models');

/**
 * GET /api/student/fees/structure
 * Get applicable fee structure for student
 */
exports.getFeeStructure = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('departmentId');
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const feeStructures = await FeeStructure.find({
      $or: [
        { departmentId: student.departmentId },
        { semester: student.semester },
        { batch: student.batch }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feeStructures
    });
  } catch (error) {
    console.error('Fee structure error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/fees/payments
 * Get student's fee payment history
 */
exports.getFeePayments = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const payments = await FeePayment.find({ studentId: student._id })
      .populate('structureId', 'title type semester')
      .sort({ date: -1 });

    const totalPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      payments,
      totalPaid
    });
  } catch (error) {
    console.error('Fee payments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/fees/due
 * Get pending fees/dues
 */
exports.getDueFees = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('departmentId');
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Get applicable fee structures
    const feeStructures = await FeeStructure.find({
      $or: [
        { departmentId: student.departmentId },
        { semester: student.semester }
      ]
    });

    // Get paid amounts
    const payments = await FeePayment.find({
      studentId: student._id,
      status: 'success'
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = feeStructures.reduce((sum, f) => sum + (f.total || f.amount), 0);
    const due = totalFees - totalPaid;

    res.json({
      success: true,
      totalFees,
      totalPaid,
      due: due > 0 ? due : 0,
      structures: feeStructures,
      payments
    });
  } catch (error) {
    console.error('Due fees error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/fines
 * Get student's fines
 */
exports.getFines = async (req, res) => {
  try {
    const { status } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const query = { student_id: student._id };
    if (status) query.status = status;

    const fines = await Fine.find(query)
      .populate('teacher_id', 'user_id')
      .populate({
        path: 'teacher_id',
        populate: { path: 'user_id', select: 'name' }
      })
      .sort({ createdAt: -1 });

    const totalUnpaid = fines
      .filter(f => f.status === 'unpaid')
      .reduce((sum, f) => sum + f.amount, 0);

    res.json({
      success: true,
      fines,
      totalUnpaid
    });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * GET /api/student/fees/history
 * Complete financial history
 */
exports.getFeesHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const query = { studentId: student._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [payments, fines] = await Promise.all([
      FeePayment.find(query)
        .populate('structureId', 'title type')
        .sort({ date: -1 }),
      Fine.find({ student_id: student._id })
        .populate('teacher_id', 'user_id')
        .populate({
          path: 'teacher_id',
          populate: { path: 'user_id', select: 'name' }
        })
        .sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      payments,
      fines
    });
  } catch (error) {
    console.error('Fees history error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

module.exports = exports;
