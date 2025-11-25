import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import User from '../models/user.model';
import config from '../config/config';
import jwt from 'jsonwebtoken';

// Google Classroom scopes
const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Type for OAuth data
interface GoogleOAuthData {
  accessToken: string;
  refreshToken: string;
  profile: Profile;
}

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
      scope: ['profile', 'email', ...CLASSROOM_SCOPES],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        // This callback is called after successful OAuth
        // Pass OAuth data as 'any' to bypass type checking for the callback
        return done(null, { accessToken, refreshToken, profile } as any);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session (not used in JWT auth, but required by passport)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google/connect
 */
export const connectGoogleClassroom = (req: Request, res: Response, next: any) => {
  // Get JWT token from query parameter
  const jwtToken = req.query.state as string;
  
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email', ...CLASSROOM_SCOPES],
    accessType: 'offline',
    prompt: 'consent',
    state: jwtToken, // Pass JWT token as state to preserve it through OAuth flow
  })(req, res, next);
};

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (err: any, data: any) => {
    try {
      if (err || !data) {
        console.error('Google OAuth error:', err);
        return res.redirect(
          `${config.FRONTEND_URL}/dashboard?error=oauth_failed&message=${encodeURIComponent('Failed to authenticate with Google')}`
        );
      }

      const { accessToken, refreshToken, profile } = data as GoogleOAuthData;

      // Get current user from JWT token (user must be logged in)
      const token = req.query.state as string; // We'll pass the JWT as state parameter
      
      if (!token) {
        return res.redirect(
          `${config.FRONTEND_URL}/dashboard?error=unauthorized&message=${encodeURIComponent('Please login first')}`
        );
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, config.jwtSecret);
      } catch (error) {
        return res.redirect(
          `${config.FRONTEND_URL}/dashboard?error=unauthorized&message=${encodeURIComponent('Invalid session')}`
        );
      }

      // Update user with Google tokens
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        {
          googleId: profile.id,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken || undefined, // Only update if provided
          googleClassroomConnected: true,
        },
        { new: true }
      );

      if (!user) {
        return res.redirect(
          `${config.FRONTEND_URL}/dashboard?error=user_not_found&message=${encodeURIComponent('User not found')}`
        );
      }

      // Redirect to success page
      res.redirect(`${config.FRONTEND_URL}/dashboard?success=google_connected`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(
        `${config.FRONTEND_URL}/dashboard?error=server_error&message=${encodeURIComponent('An error occurred')}`
      );
    }
  })(req, res);
};

/**
 * Disconnect Google Classroom
 * POST /api/auth/google/disconnect
 */
export const disconnectGoogleClassroom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Remove Google OAuth tokens
    await User.findByIdAndUpdate(userId, {
      $unset: {
        googleId: '',
        googleAccessToken: '',
        googleRefreshToken: '',
      },
      googleClassroomConnected: false,
    });

    res.json({
      success: true,
      message: 'Google Classroom disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Google Classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Classroom',
    });
  }
};

/**
 * Get Google Classroom connection status
 * GET /api/auth/google/status
 */
export const getGoogleConnectionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('googleClassroomConnected googleId');

    res.json({
      success: true,
      data: {
        connected: user?.googleClassroomConnected || false,
        hasGoogleId: !!user?.googleId,
      },
    });
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
    });
  }
};
