import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import config from '../config/config';

class UserController {
  /**
   * User Signup
   * POST /api/users/signup
   * Body: { name: string, email: string, password: string }
   */
  async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Error in signup:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * User Login
   * POST /api/users/login
   * Body: { email: string, password: string }
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user by email (including password field)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get User Profile
   * GET /api/users/profile/:userId
   * Protected Route - requires authentication
   */
  async getProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get Current Authenticated User
   * GET /api/users/me
   * Protected Route - requires authentication
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      // User is already attached to request by authMiddleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new UserController();
