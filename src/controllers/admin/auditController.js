const { AuditLog } = require('../../models');
const { Parser } = require('json2csv');
exports.list = async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 });
  res.json(logs);
};
exports.exportCsv = async (req, res) => {
  const logs = await AuditLog.find().lean();
  const parser = new Parser();
  const csv = parser.parse(logs);
  res.header('Content-Type','text/csv');
  res.attachment('audit_logs.csv');
  res.send(csv);
};
