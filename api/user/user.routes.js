import express from 'express'

import { getJobsByUserId, addJob, deleteJob, updateJob } from './user.controller.js'

export const userRoutes = express.Router()

userRoutes.get('/:id', getJobsByUserId)
userRoutes.put('/:id/addJob', addJob)
userRoutes.put('/:id/deleteJob', deleteJob)
userRoutes.put('/:id/updateJob', updateJob)


