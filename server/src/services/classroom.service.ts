import { google } from 'googleapis';
import User from '../models/user.model';
import config from '../config/config';

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
