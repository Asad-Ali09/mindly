/**
 * Agent Types for ReAct Agent with Google Classroom and Drive
 */

/**
 * Represents a single message in the conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/**
 * File attachment returned by the agent
 */
export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
  size?: number;
  courseId?: string;
  courseName?: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * Agent response structure
 */
export interface AgentResponse {
  success: boolean;
  answer: string;
  files?: FileAttachment[];
  thoughts?: string[];
  error?: string;
}

/**
 * Assignment filter options
 */
export interface AssignmentFilters {
  courseId?: string;
  courseName?: string;
  dueDateStart?: string; // ISO date string
  dueDateEnd?: string; // ISO date string
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
}

/**
 * Assignment details
 */
export interface AssignmentDetails {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  state: string;
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  maxPoints?: number;
  workType: string;
  materials?: Array<{
    driveFile?: {
      driveFile: {
        id: string;
        title: string;
        alternateLink: string;
        thumbnailUrl?: string;
      };
    };
    youtubeVideo?: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl?: string;
    };
    link?: {
      url: string;
      title?: string;
      thumbnailUrl?: string;
    };
    form?: {
      formUrl: string;
      title: string;
      thumbnailUrl?: string;
    };
  }>;
  submissionState?: {
    state: string;
    turnedInTimestamp?: string;
    grade?: number;
  };
}

/**
 * Course information
 */
export interface CourseInfo {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: string;
  alternateLink: string;
  teacherFolder?: {
    id: string;
    title: string;
    alternateLink: string;
  };
}

/**
 * Material information
 */
export interface MaterialInfo {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  state: string;
  creationTime: string;
  updateTime: string;
  materials: Array<{
    driveFile?: {
      driveFile: {
        id: string;
        title: string;
        alternateLink: string;
        thumbnailUrl?: string;
      };
    };
    youtubeVideo?: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl?: string;
    };
    link?: {
      url: string;
      title?: string;
      thumbnailUrl?: string;
    };
    form?: {
      formUrl: string;
      title: string;
      thumbnailUrl?: string;
    };
  }>;
}

/**
 * Announcement information
 */
export interface AnnouncementInfo {
  id: string;
  courseId: string;
  courseName?: string;
  text: string;
  state: string;
  creationTime: string;
  updateTime: string;
  creatorUserId: string;
  materials?: Array<{
    driveFile?: {
      driveFile: {
        id: string;
        title: string;
        alternateLink: string;
        thumbnailUrl?: string;
      };
    };
    youtubeVideo?: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl?: string;
    };
    link?: {
      url: string;
      title?: string;
      thumbnailUrl?: string;
    };
    form?: {
      formUrl: string;
      title: string;
      thumbnailUrl?: string;
    };
  }>;
}

/**
 * Drive file information
 */
export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  description?: string;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
}
