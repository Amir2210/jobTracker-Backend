import express from 'express'
import { login, signup, logout } from './auth.controller.js'
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute
  max: 5, // Limit each IP to 100 requests per windowMs
  message: 'Too many login attempts. Please try again in 5 minutes.'
});

export const authRoutes = express.Router()

authRoutes.post('/login', limiter, login)
authRoutes.post('/signup', signup)
authRoutes.post('/logout', logout)