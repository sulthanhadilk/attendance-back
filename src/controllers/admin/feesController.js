const { FeeStructure, Student, AuditLog } = require('../../models');
const { Parser } = require('json2csv');
exports.getStructure = async (req, res) => {
  const { departmentId, batch, semester, type } = req.query;
  const fs = await FeeStructure.findOne({ departmentId, batch, semester, type });
  res.json(fs || null);
};
exports.setStructure = async (req, res) => {
  const body = req.body;
  let total = 0; (body.items||[]).forEach(i => total += Number(i.amount||0));
  body.total = total;
  const fs = await FeeStructure.findOneAndUpdate({ departmentId: body.departmentId, batch: body.batch, semester: body.semester, type: body.type }, body, { upsert: true, new: true });
  await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'fee-structure', entityType:'FeeStructure', entityId:fs._id });
  res.json(fs);
};
exports.listDues = async (req, res) => {
  // Placeholder: in real app, we'd store payments
  res.json([]);
};
exports.markPaid = async (req, res) => {
  // Placeholder: mark payment status stored elsewhere
  res.json({ msg:'Marked paid (stub)' });
};
exports.exportFinance = async (req, res) => {
  const list = []; // finance data stub
  const parser = new Parser();
  const csv = parser.parse(list);
  res.header('Content-Type','text/csv');
  res.attachment('finance.csv');
  res.send(csv);
};
