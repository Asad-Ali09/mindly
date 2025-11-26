import { google } from 'googleapis';
import User from '../models/user.model';
import config from '../config/config';
import { AssignmentFilters, AssignmentDetails } from '../types/agent.types';

const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  config.googleCallbackUrl
);

/**
 * Get OAuth2 client with user's tokens
 */
const getAuthenticatedClient = async (userId: string) => {
  const user = await User.findById(userId).select(
    'googleAccessToken googleRefreshToken googleClassroomConnected'
  );

  if (!user || !user.googleClassroomConnected) {
    throw new Error('Google Classroom not connected');
  }

  if (!user.googleAccessToken) {
    throw new Error('No access token available');
  }

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await User.findByIdAndUpdate(userId, {
        googleAccessToken: tokens.access_token,
      });
    }
    if (tokens.refresh_token) {
      await User.findByIdAndUpdate(userId, {
        googleRefreshToken: tokens.refresh_token,
      });
    }
  });

  return oauth2Client;
};

/**
 * Get list of courses
 */
export const getCourses = async (userId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.list({
      studentId: 'me',
      courseStates: ['ACTIVE'],
    });

    return {
      success: true,
      data: response.data.courses || [],
    };
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    throw new Error(error.message || 'Failed to fetch courses');
  }
};

/**
 * Get course details
 */
export const getCourseDetails = async (userId: string, courseId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.get({
      id: courseId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error fetching course details:', error);
    throw new Error(error.message || 'Failed to fetch course details');
  }
};

/**
 * Get coursework for a specific course
 */
export const getCoursework = async (userId: string, courseId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.courseWork.list({
      courseId: courseId,
    });

    return {
      success: true,
      data: response.data.courseWork || [],
    };
  } catch (error: any) {
    console.error('Error fetching coursework:', error);
    throw new Error(error.message || 'Failed to fetch coursework');
  }
};

/**
 * Get student submissions for a coursework
 */
export const getStudentSubmissions = async (
  userId: string,
  courseId: string,
  courseWorkId: string
) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: courseId,
      courseWorkId: courseWorkId,
      userId: 'me',
    });

    return {
      success: true,
      data: response.data.studentSubmissions || [],
    };
  } catch (error: any) {
    console.error('Error fetching student submissions:', error);
    throw new Error(error.message || 'Failed to fetch student submissions');
  }
};

/**
 * Get course materials
 */
export const getCourseMaterials = async (userId: string, courseId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.courseWorkMaterials.list({
      courseId: courseId,
    });

    return {
      success: true,
      data: response.data.courseWorkMaterial || [],
    };
  } catch (error: any) {
    console.error('Error fetching course materials:', error);
    throw new Error(error.message || 'Failed to fetch course materials');
  }
};

/**
 * Get announcements for a course
 */
export const getAnnouncements = async (userId: string, courseId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.announcements.list({
      courseId: courseId,
    });

    return {
      success: true,
      data: response.data.announcements || [],
    };
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    throw new Error(error.message || 'Failed to fetch announcements');
  }
};

/**
 * Get Drive files (if needed for coursework materials)
 */
export const getDriveFile = async (userId: string, fileId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, iconLink, thumbnailLink',
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error fetching drive file:', error);
    throw new Error(error.message || 'Failed to fetch drive file');
  }
};

/**
 * Get all coursework across all courses (useful for dashboard)
 */
export const getAllCoursework = async (userId: string) => {
  try {
    const coursesResult = await getCourses(userId);
    const courses = coursesResult.data;

    if (!courses || courses.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const allCoursework = await Promise.all(
      courses.map(async (course: any) => {
        try {
          const courseworkResult = await getCoursework(userId, course.id!);
          return {
            courseId: course.id,
            courseName: course.name,
            coursework: courseworkResult.data,
          };
        } catch (error) {
          console.error(`Error fetching coursework for course ${course.id}:`, error);
          return {
            courseId: course.id,
            courseName: course.name,
            coursework: [],
          };
        }
      })
    );

    return {
      success: true,
      data: allCoursework,
    };
  } catch (error: any) {
    console.error('Error fetching all coursework:', error);
    throw new Error(error.message || 'Failed to fetch all coursework');
  }
};

/**
 * Search and filter assignments across courses
 * Used by the ReAct agent for intelligent assignment queries
 */
export const searchAssignments = async (userId: string, filters: AssignmentFilters) => {
  try {
    const coursesResult = await getCourses(userId);
    const courses = coursesResult.data;

    if (!courses || courses.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Filter courses if courseId or courseName is provided
    let targetCourses = courses;
    if (filters.courseId) {
      targetCourses = courses.filter((c: any) => c.id === filters.courseId);
    } else if (filters.courseName) {
      const lowerCourseName = filters.courseName.toLowerCase();
      targetCourses = courses.filter((c: any) => 
        c.name?.toLowerCase().includes(lowerCourseName)
      );
    }

    // Fetch coursework from target courses
    const allCoursework: any[] = [];
    for (const course of targetCourses) {
      try {
        const courseworkResult = await getCoursework(userId, course.id!);
        const courseworkWithCourse = (courseworkResult.data || []).map((work: any) => ({
          ...work,
          courseId: course.id,
          courseName: course.name,
        }));
        allCoursework.push(...courseworkWithCourse);
      } catch (error) {
        console.error(`Error fetching coursework for course ${course.id}:`, error);
      }
    }

    // Filter by due date if provided
    let filteredWork = allCoursework;
    if (filters.dueDateStart || filters.dueDateEnd) {
      filteredWork = allCoursework.filter((work: any) => {
        if (!work.dueDate) return false;

        const dueDate = new Date(
          work.dueDate.year,
          work.dueDate.month - 1,
          work.dueDate.day
        );

        if (filters.dueDateStart) {
          const startDate = new Date(filters.dueDateStart);
          if (dueDate < startDate) return false;
        }

        if (filters.dueDateEnd) {
          const endDate = new Date(filters.dueDateEnd);
          if (dueDate > endDate) return false;
        }

        return true;
      });
    }

    // Filter by state if provided
    if (filters.state) {
      filteredWork = filteredWork.filter((work: any) => work.state === filters.state);
    }

    return {
      success: true,
      data: filteredWork,
    };
  } catch (error: any) {
    console.error('Error searching assignments:', error);
    throw new Error(error.message || 'Failed to search assignments');
  }
};

/**
 * Get detailed information about a specific assignment including submission status
 */
export const getAssignmentDetails = async (
  userId: string,
  courseId: string,
  courseworkId: string
): Promise<AssignmentDetails> => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const classroom = google.classroom({ version: 'v1', auth });

    // Get coursework details
    const courseworkResponse = await classroom.courses.courseWork.get({
      courseId: courseId,
      id: courseworkId,
    });

    const coursework = courseworkResponse.data;

    // Get course name
    const courseResponse = await classroom.courses.get({
      id: courseId,
    });

    // Get submission status
    let submissionState;
    try {
      const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: courseworkId,
        userId: 'me',
      });

      const submission = submissionsResponse.data.studentSubmissions?.[0];
      if (submission) {
        submissionState = {
          state: submission.state || 'UNKNOWN',
          turnedInTimestamp: submission.updateTime,
          grade: submission.assignedGrade,
        };
      }
    } catch (error) {
      console.error('Error fetching submission status:', error);
    }

    return {
      id: coursework.id!,
      courseId: courseId,
      courseName: courseResponse.data.name || undefined,
      title: coursework.title!,
      description: coursework.description || undefined,
      state: coursework.state!,
      creationTime: coursework.creationTime!,
      updateTime: coursework.updateTime!,
      dueDate: coursework.dueDate ? {
        year: coursework.dueDate.year || 0,
        month: coursework.dueDate.month || 0,
        day: coursework.dueDate.day || 0,
      } : undefined,
      dueTime: coursework.dueTime ? {
        hours: coursework.dueTime.hours || 0,
        minutes: coursework.dueTime.minutes || 0,
      } : undefined,
      maxPoints: coursework.maxPoints || undefined,
      workType: coursework.workType!,
      materials: coursework.materials as any,
      submissionState: submissionState ? {
        state: submissionState.state,
        turnedInTimestamp: submissionState.turnedInTimestamp || undefined,
        grade: submissionState.grade || undefined,
      } : undefined,
    };
  } catch (error: any) {
    console.error('Error fetching assignment details:', error);
    throw new Error(error.message || 'Failed to fetch assignment details');
  }
};

/**
 * Get file metadata and return backend proxy URL for download
 * Files are downloaded through the backend to comply with Google Drive API changes
 */
export const generateTemporaryFileUrl = async (userId: string, fileId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, description, owners',
    });

    const file = fileResponse.data;

    // Determine export MIME type for Google Workspace files
    const exportMimeType = file.mimeType?.includes('google-apps') 
      ? getExportMimeType(file.mimeType) 
      : null;

    // Return backend proxy URL instead of direct Google URL
    const downloadUrl = `/classroom/files/download/${fileId}`;

    return {
      success: true,
      data: {
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        exportMimeType: exportMimeType || undefined,
        size: file.size,
        downloadUrl: downloadUrl,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        description: file.description,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        owners: file.owners,
      },
    };
  } catch (error: any) {
    console.error('Error getting file metadata:', error);
    throw new Error(error.message || 'Failed to get file metadata');
  }
};

/**
 * Download a Google Drive file (proxied through backend)
 * This method is called by the download endpoint to stream files to the client
 * Uses Authorization header instead of deprecated access_token query parameter
 */
export const downloadFile = async (userId: string, fileId: string) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata to determine type
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType',
    });

    const file = fileResponse.data;
    let response;

    // Handle Google Workspace files (need export)
    if (file.mimeType?.includes('google-apps')) {
      const exportMimeType = getExportMimeType(file.mimeType);
      response = await drive.files.export(
        {
          fileId: fileId,
          mimeType: exportMimeType,
        },
        {
          responseType: 'stream',
        }
      );
    } else {
      // Handle regular files (direct download)
      response = await drive.files.get(
        {
          fileId: fileId,
          alt: 'media',
        },
        {
          responseType: 'stream',
        }
      );
    }

    return {
      success: true,
      data: {
        stream: response.data,
        fileName: file.name!,
        mimeType: file.mimeType?.includes('google-apps') 
          ? getExportMimeType(file.mimeType) 
          : file.mimeType!,
      },
    };
  } catch (error: any) {
    console.error('Error downloading file:', error);
    throw new Error(error.message || 'Failed to download file');
  }
};

/**
 * Helper function to determine export MIME type for Google Workspace files
 */
function getExportMimeType(googleMimeType: string): string {
  const exportMap: { [key: string]: string } = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/pdf',
    'application/vnd.google-apps.drawing': 'application/pdf',
  };
  return exportMap[googleMimeType] || 'application/pdf';
}

