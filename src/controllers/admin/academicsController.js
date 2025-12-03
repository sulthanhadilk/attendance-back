const { Department, Course, Class, Subject, Teacher, Exam, AuditLog } = require('../../models');

exports.listDepartments = async (req, res) => { res.json(await Department.find()); };
exports.createDepartment = async (req, res) => { const d = await Department.create(req.body); await AuditLog.create({ actorUserId: req.user._id, actorRole:'admin', action:'create', entityType:'Department', entityId:d._id}); res.status(201).json(d); };
exports.updateDepartment = async (req, res) => { const {id}=req.params; const d=await Department.findByIdAndUpdate(id, req.body, {new:true}); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'update', entityType:'Department', entityId:id}); res.json(d); };
exports.deleteDepartment = async (req, res) => { const {id}=req.params; await Department.findByIdAndDelete(id); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'delete', entityType:'Department', entityId:id}); res.json({msg:'Deleted'}); };

exports.listCourses = async (req, res) => { res.json(await Course.find()); };
exports.createCourse = async (req, res) => { const c=await Course.create(req.body); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'create', entityType:'Course', entityId:c._id}); res.status(201).json(c); };
exports.updateCourse = async (req, res) => { const {id}=req.params; const c=await Course.findByIdAndUpdate(id, req.body, {new:true}); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'update', entityType:'Course', entityId:id}); res.json(c); };
exports.deleteCourse = async (req, res) => { const {id}=req.params; await Course.findByIdAndDelete(id); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'delete', entityType:'Course', entityId:id}); res.json({msg:'Deleted'}); };

exports.listClasses = async (req, res) => { res.json(await Class.find()); };
exports.createClass = async (req, res) => { const cls=await Class.create(req.body); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'create', entityType:'Class', entityId:cls._id}); res.status(201).json(cls); };
exports.updateClass = async (req, res) => { const {id}=req.params; const cls=await Class.findByIdAndUpdate(id, req.body, {new:true}); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'update', entityType:'Class', entityId:id}); res.json(cls); };
exports.deleteClass = async (req, res) => { const {id}=req.params; await Class.findByIdAndDelete(id); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'delete', entityType:'Class', entityId:id}); res.json({msg:'Deleted'}); };

exports.assignTeacherCourse = async (req, res) => { const { teacherId, courseId }=req.body; const t=await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { subjects: courseId } }, {new:true}); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'assign', entityType:'TeacherCourse', entityId:teacherId, details:{courseId}}); res.json(t); };
exports.assignClassCourse = async (req, res) => { const { classId, courseId }=req.body; const cls=await Class.findByIdAndUpdate(classId, { courseId }, {new:true}); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'assign', entityType:'ClassCourse', entityId:classId, details:{courseId}}); res.json(cls); };
exports.setTimetable = async (req, res) => { res.json({ msg:'Timetable update stub' }); };
exports.createExamTemplate = async (req, res) => { const { name, date, class_id, subject_id } = req.body; const e=await Exam.create({ name, date: new Date(date), class_id, subject_id, created_by: req.user._id }); await AuditLog.create({ actorUserId:req.user._id, actorRole:'admin', action:'create', entityType:'ExamTemplate', entityId:e._id}); res.status(201).json(e); };
