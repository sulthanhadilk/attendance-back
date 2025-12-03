// Minimal library stubs; would normally have dedicated models
const { AuditLog } = require('../../models');

let books = [];
let issues = [];

exports.listBooks = async (req, res) => { res.json(books); };
exports.createBook = async (req, res) => { const b = { id: Date.now().toString(), ...req.body }; books.push(b); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'create', entityType:'Book', entityId:b.id }); res.status(201).json(b); };
exports.updateBook = async (req, res) => { const { id } = req.params; const idx = books.findIndex(b => b.id === id); if (idx<0) return res.status(404).json({ msg:'Not found' }); books[idx] = { ...books[idx], ...req.body }; await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'update', entityType:'Book', entityId:id }); res.json(books[idx]); };
exports.deleteBook = async (req, res) => { const { id } = req.params; books = books.filter(b => b.id !== id); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'delete', entityType:'Book', entityId:id }); res.json({ msg:'Deleted' }); };
exports.issueBook = async (req, res) => { const i = { id: Date.now().toString(), ...req.body, status:'issued' }; issues.push(i); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'issue', entityType:'BookIssue', entityId:i.id }); res.status(201).json(i); };
exports.returnBook = async (req, res) => { const { id } = req.body; const idx = issues.findIndex(x => x.id === id); if (idx<0) return res.status(404).json({ msg:'Not found' }); issues[idx].status='returned'; await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'return', entityType:'BookIssue', entityId:id }); res.json(issues[idx]); };
