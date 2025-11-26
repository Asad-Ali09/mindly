// Export all API clients
export { default as aiApi } from './ai.api';
export * from './ai.api';

export { default as authApi } from './auth.api';
export * from './auth.api';

export { quizApi } from './quiz.api';
export * from './quiz.api';

export { default as documentApi } from './document.api';
export * from './document.api';

// Export axios instance for custom requests if needed
export { default as apiClient } from './axios';
