import express from 'express'
import { login, signup, logout } from './auth.controller.js'
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

export const authRoutes = express.Router()

authRoutes.post('/login', limiter, login)
authRoutes.post('/signup', signup)
authRoutes.post('/logout', logout)