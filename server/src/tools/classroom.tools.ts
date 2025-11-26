/**
 * LangChain tools for Google Classroom integration
 * These tools are used by the ReAct agent to interact with Google Classroom
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as classroomService from '../services/classroom.service';

/**
 * Tool: List all active courses
 */
export const createListCoursesTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'list_courses',
    description: `Lists all active Google Classroom courses that the user is enrolled in. 
    Use this tool to:
    - Get an overview of all courses
    - Find course IDs for further queries
    - Answer questions like "What classes do I have?" or "List my courses"
    Returns: Array of course objects with id, name, section, description, and other metadata.`,
    schema: z.object({}),
    func: async () => {
      try {
        const result = await classroomService.getCourses(userId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Get detailed information about a specific course
 */
export const createGetCourseInfoTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'get_course_info',
    description: `Gets detailed information about a specific Google Classroom course.
    Use this tool to:
    - Get course description, room number, teacher info
    - Find course metadata and settings
    - Answer questions about course details
    Input: Course ID (can be obtained from list_courses tool)
    Returns: Detailed course object with all metadata.`,
    schema: z.object({
      courseId: z.string().describe('The ID of the course to get information about'),
    }),
    func: async ({ courseId }) => {
      try {
        const result = await classroomService.getCourseDetails(userId, courseId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Search and filter assignments
 */
export const createSearchAssignmentsTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'search_assignments',
    description: `Searches and filters assignments (coursework) across all courses or specific courses.
    Use this tool to:
    - Find assignments due on specific dates ("assignments due tomorrow", "homework due this week")
    - Filter assignments by course ("assignments in Math class")
    - Get all pending assignments
    - Answer queries about upcoming deadlines
    
    Filters:
    - courseName: Partial course name to filter by (case-insensitive)
    - courseId: Specific course ID to filter by
    - dueDateStart: ISO date string (YYYY-MM-DD) for earliest due date
    - dueDateEnd: ISO date string (YYYY-MM-DD) for latest due date
    
    Tips:
    - For "due tomorrow", calculate tomorrow's date and use it as both dueDateStart and dueDateEnd
    - For "due this week", use start of week and end of week
    - Leave filters empty to get all assignments
    
    Returns: Array of assignment objects with courseId, courseName, title, description, dueDate, state, etc.`,
    schema: z.object({
      courseName: z.string().optional().describe('Partial course name to filter by (e.g., "Math", "ICC")'),
      courseId: z.string().optional().describe('Specific course ID to filter by'),
      dueDateStart: z.string().optional().describe('ISO date string (YYYY-MM-DD) for earliest due date'),
      dueDateEnd: z.string().optional().describe('ISO date string (YYYY-MM-DD) for latest due date'),
      state: z.enum(['PUBLISHED', 'DRAFT', 'DELETED']).optional().describe('Assignment state filter'),
    }),
    func: async (filters) => {
      try {
        const result = await classroomService.searchAssignments(userId, filters);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Get detailed information about a specific assignment
 */
export const createGetAssignmentDetailsTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'get_assignment_details',
    description: `Gets comprehensive details about a specific assignment including submission status.
    Use this tool to:
    - Get full assignment description and requirements
    - Check submission status (submitted, graded, grade received)
    - View attached materials and files
    - Answer questions like "What do I need to do in this assignment?"
    
    Input: courseId and courseworkId (can be obtained from search_assignments tool)
    Returns: Complete assignment object with description, materials, due date, submission status, grade, etc.`,
    schema: z.object({
      courseId: z.string().describe('The ID of the course'),
      courseworkId: z.string().describe('The ID of the coursework/assignment'),
    }),
    func: async ({ courseId, courseworkId }) => {
      try {
        const result = await classroomService.getAssignmentDetails(userId, courseId, courseworkId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: List course materials
 */
export const createListCourseMaterialsTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'list_course_materials',
    description: `Lists all course materials (non-assignment resources) for a specific course.
    Use this tool to:
    - Find lecture slides, reference materials, readings
    - Get resources shared by teacher
    - Answer questions like "Show me the slides for Lecture 5" or "What materials are in this course?"
    
    Input: courseId (can be obtained from list_courses or search by course name first)
    Returns: Array of course material objects with titles, descriptions, and attached files/links.`,
    schema: z.object({
      courseId: z.string().describe('The ID of the course to get materials from'),
    }),
    func: async ({ courseId }) => {
      try {
        const result = await classroomService.getCourseMaterials(userId, courseId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Get course announcements
 */
export const createGetAnnouncementsTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'get_announcements',
    description: `Gets all announcements for a specific course.
    Use this tool to:
    - Check what's happening in a course
    - Get recent teacher announcements
    - Answer questions like "What's going on in my Math class?" or "Any updates in ICC?"
    
    Input: courseId (can be obtained from list_courses or search by course name first)
    Returns: Array of announcement objects with text, creation time, and any attached materials.`,
    schema: z.object({
      courseId: z.string().describe('The ID of the course to get announcements from'),
    }),
    func: async ({ courseId }) => {
      try {
        const result = await classroomService.getAnnouncements(userId, courseId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Tool: Get all coursework across all courses
 */
export const createGetAllCourseworkTool = (userId: string) => {
  return new DynamicStructuredTool({
    name: 'get_all_coursework',
    description: `Gets all coursework/assignments across ALL enrolled courses.
    Use this tool to:
    - Get a complete overview of all assignments
    - Answer questions like "What assignments do I have?" or "Show me all my homework"
    - Get context for cross-course queries
    
    Note: This returns a lot of data. For filtered queries (by course or date), use search_assignments instead.
    Returns: Array of objects, each containing courseId, courseName, and array of coursework.`,
    schema: z.object({}),
    func: async () => {
      try {
        const result = await classroomService.getAllCoursework(userId);
        return JSON.stringify(result.data, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  });
};

/**
 * Helper function to create all classroom tools at once
 */
export const createAllClassroomTools = (userId: string) => {
  return [
    createListCoursesTool(userId),
    createGetCourseInfoTool(userId),
    createSearchAssignmentsTool(userId),
    createGetAssignmentDetailsTool(userId),
    createListCourseMaterialsTool(userId),
    createGetAnnouncementsTool(userId),
    createGetAllCourseworkTool(userId),
  ];
};
