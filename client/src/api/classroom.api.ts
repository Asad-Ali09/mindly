import apiClient from './axios';

/**
 * Classroom API service for Google Classroom integration
 */
export class ClassroomApi {
  /**
   * Initiate Google OAuth connection
   * Opens a new window for OAuth flow
   */
  connectGoogleClassroom(): void {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Please login first');
    }

    // Open OAuth flow in a popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const authUrl = `${apiClient.defaults.baseURL}/auth/google/connect?state=${encodeURIComponent(token)}`;
    
    const popup = window.open(
      authUrl,
      'Google Classroom Authentication',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Poll for popup close or success
    const pollTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollTimer);
        // Optionally reload or check connection status
        window.location.reload();
      }
    }, 500);
  }

  /**
   * Disconnect Google Classroom
   */
  async disconnectGoogleClassroom() {
    try {
      const response = await apiClient.post('/auth/google/disconnect');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect Google Classroom');
    }
  }

  /**
   * Get Google Classroom connection status
   */
  async getConnectionStatus() {
    try {
      const response = await apiClient.get('/auth/google/status');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get connection status');
    }
  }

  /**
   * Get all courses
   */
  async getCourses() {
    try {
      const response = await apiClient.get('/classroom/courses');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch courses');
    }
  }

  /**
   * Get course details
   */
  async getCourseDetails(courseId: string) {
    try {
      const response = await apiClient.get(`/classroom/courses/${courseId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch course details');
    }
  }

  /**
   * Get coursework for a specific course
   */
  async getCoursework(courseId: string) {
    try {
      const response = await apiClient.get(`/classroom/courses/${courseId}/coursework`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch coursework');
    }
  }

  /**
   * Get student submissions for coursework
   */
  async getSubmissions(courseId: string, courseWorkId: string) {
    try {
      const response = await apiClient.get(
        `/classroom/courses/${courseId}/coursework/${courseWorkId}/submissions`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }

  /**
   * Get course materials
   */
  async getCourseMaterials(courseId: string) {
    try {
      const response = await apiClient.get(`/classroom/courses/${courseId}/materials`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch course materials');
    }
  }

  /**
   * Get announcements for a course
   */
  async getAnnouncements(courseId: string) {
    try {
      const response = await apiClient.get(`/classroom/courses/${courseId}/announcements`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }

  /**
   * Get all coursework across all courses
   */
  async getAllCoursework() {
    try {
      const response = await apiClient.get('/classroom/coursework/all');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all coursework');
    }
  }

  /**
   * Get Drive file details
   */
  async getDriveFile(fileId: string) {
    try {
      const response = await apiClient.get(`/classroom/drive/${fileId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch drive file');
    }
  }
}

// Export singleton instance
export const classroomApi = new ClassroomApi();
export default classroomApi;
