import { Request, Response } from 'express';
import * as classroomService from '../services/classroom.service';

/**
 * Get all courses
 * GET /api/classroom/courses
 */
export const getUserCourses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const result = await classroomService.getCourses(userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getUserCourses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch courses',
    });
  }
};

/**
 * Get course details
 * GET /api/classroom/courses/:courseId
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { courseId } = req.params;

    const result = await classroomService.getCourseDetails(userId, courseId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getCourseById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course details',
    });
  }
};

/**
 * Get coursework for a course
 * GET /api/classroom/courses/:courseId/coursework
 */
export const getCourseworkByCourse = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { courseId } = req.params;

    const result = await classroomService.getCoursework(userId, courseId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getCourseworkByCourse:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch coursework',
    });
  }
};

/**
 * Get student submissions for coursework
 * GET /api/classroom/courses/:courseId/coursework/:courseWorkId/submissions
 */
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { courseId, courseWorkId } = req.params;

    const result = await classroomService.getStudentSubmissions(
      userId,
      courseId,
      courseWorkId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error in getSubmissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions',
    });
  }
};

/**
 * Get course materials
 * GET /api/classroom/courses/:courseId/materials
 */
export const getCourseMaterials = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { courseId } = req.params;

    const result = await classroomService.getCourseMaterials(userId, courseId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getCourseMaterials:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course materials',
    });
  }
};

/**
 * Get announcements for a course
 * GET /api/classroom/courses/:courseId/announcements
 */
export const getCourseAnnouncements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { courseId } = req.params;

    const result = await classroomService.getAnnouncements(userId, courseId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getCourseAnnouncements:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch announcements',
    });
  }
};

/**
 * Get Drive file details
 * GET /api/classroom/drive/:fileId
 */
export const getDriveFileDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { fileId } = req.params;

    const result = await classroomService.getDriveFile(userId, fileId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getDriveFileDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch drive file',
    });
  }
};

/**
 * Get all coursework across all courses
 * GET /api/classroom/coursework/all
 */
export const getAllCoursework = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const result = await classroomService.getAllCoursework(userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getAllCoursework:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch all coursework',
    });
  }
};

/**
 * Download a Google Drive file (proxied through backend)
 * GET /api/classroom/files/download/:fileId
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required',
      });
    }

    // Get file stream from Drive
    const result = await classroomService.downloadFile(userId, fileId);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', result.data.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.data.fileName)}"`);
    
    // Stream the file to the client
    result.data.stream.pipe(res);
  } catch (error: any) {
    console.error('Error in downloadFile:', error);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download file',
      });
    }
  }
};
