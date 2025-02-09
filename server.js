import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import cron from 'node-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { logger } from './services/logger.service.js'
logger.info('server.js loaded...')

const app = express()

// Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
  // Express serve static files on production environment
  app.use(express.static(path.resolve(__dirname, 'public')))
  console.log('__dirname: ', __dirname)
} else {
  // Configuring CORS
  const corsOptions = {
    // Make sure origin contains the url your frontend is running on
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true
  }
  app.use(cors(corsOptions))
}

// routes
import { authRoutes } from './api/auth/auth.routes.js'
app.use('/api/auth', authRoutes)


import { userRoutes } from './api/user/user.routes.js'
import { dbService } from './services/db.service.js'
app.use('/api/user', userRoutes)


app.get('/**', (req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

cron.schedule("0 0 * * *", async () => { // run once a day at midnight
  try {
    const db = await dbService.getCollection('user')
    const twentyOneDaysAgo = new Date()
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)


    const result = await db.updateMany(
      { "jobs.status": "pending", "jobs.time": { $lte: twentyOneDaysAgo.getTime() } }, // ✅ Match old pending jobs
      { $set: { "jobs.$[job].status": "Ghosting" } }, // ✅ Only update matching jobs
      { arrayFilters: [{ "job.status": "pending", "job.time": { $lte: twentyOneDaysAgo.getTime() } }] } // ✅ Ensure only old pending jobs are updated
    )

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} jobs to 'ghosting'`)
    } else {
      console.log('⚠️ No jobs older than 21 days found.')
    }
  } catch (error) {
    logger.error('❌ Error updating job statuses:', error)
  }
})


const port = process.env.PORT || 3030

app.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})