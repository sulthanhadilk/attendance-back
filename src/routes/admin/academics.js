const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/academicsController');

router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

router.get('/courses', ctrl.listCourses);
router.post('/courses', ctrl.createCourse);
router.put('/courses/:id', ctrl.updateCourse);
router.delete('/courses/:id', ctrl.deleteCourse);

router.get('/classes', ctrl.listClasses);
router.post('/classes', ctrl.createClass);
router.put('/classes/:id', ctrl.updateClass);
router.delete('/classes/:id', ctrl.deleteClass);

router.post('/assign/teacher-course', ctrl.assignTeacherCourse);
router.post('/assign/class-course', ctrl.assignClassCourse);
router.post('/timetable', ctrl.setTimetable);
router.post('/exam-template', ctrl.createExamTemplate);

module.exports = router;
