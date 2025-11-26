import { Router } from 'express';
import {
  getUserCourses,
  getCourseById,
  getCourseworkByCourse,
  getSubmissions,
  getCourseMaterials,
  getCourseAnnouncements,
  getDriveFileDetails,
  getAllCoursework,
  downloadFile,
} from '../controllers/classroom.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/classroom/courses
 * @desc    Get all courses for authenticated user
 * @access  Private
 */
router.get('/courses', getUserCourses);

/**
 * @route   GET /api/classroom/courses/:courseId
 * @desc    Get details of a specific course
 * @access  Private
 */
router.get('/courses/:courseId', getCourseById);

/**
 * @route   GET /api/classroom/courses/:courseId/coursework
 * @desc    Get all coursework for a specific course
 * @access  Private
 */
router.get('/courses/:courseId/coursework', getCourseworkByCourse);

/**
 * @route   GET /api/classroom/courses/:courseId/coursework/:courseWorkId/submissions
 * @desc    Get student submissions for a specific coursework
 * @access  Private
 */
router.get('/courses/:courseId/coursework/:courseWorkId/submissions', getSubmissions);

/**
 * @route   GET /api/classroom/courses/:courseId/materials
 * @desc    Get all course materials for a specific course
 * @access  Private
 */
router.get('/courses/:courseId/materials', getCourseMaterials);

/**
 * @route   GET /api/classroom/courses/:courseId/announcements
 * @desc    Get all announcements for a specific course
 * @access  Private
 */
router.get('/courses/:courseId/announcements', getCourseAnnouncements);

/**
 * @route   GET /api/classroom/coursework/all
 * @desc    Get all coursework across all courses
 * @access  Private
 */
router.get('/coursework/all', getAllCoursework);

/**
 * @route   GET /api/classroom/drive/:fileId
 * @desc    Get Drive file details
 * @access  Private
 */
router.get('/drive/:fileId', getDriveFileDetails);

/**
 * @route   GET /api/classroom/files/download/:fileId
 * @desc    Download a Google Drive file (proxied through backend)
 * @access  Private
 */
router.get('/files/download/:fileId', downloadFile);

export default router;
