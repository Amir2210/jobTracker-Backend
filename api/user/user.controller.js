import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'
import axios from 'axios'
export async function getJobsByUserId(req, res) {
    const nameInputValue = req.query.params.filterBy.txt
    const statusInputValue = req.query.params.filterBy.status
    const jobTypeInputValue = req.query.params.filterBy.jobType
    const sortBySubject = req.query.params.sortBy.subject
    const pageIdxInputValue = req.query.params.filterBy.pageIdx
    try {
        const filterBy = {
            txt: nameInputValue || '',
            status: statusInputValue || '',
            jobType: jobTypeInputValue || '',
            pageIdx: pageIdxInputValue || 0
        }
        const sortBy = {
            subject: sortBySubject
        }
        const user = await userService.getJobsByUserId(req.params.id, filterBy, sortBy)
        // filter here
        res.send(user)
    } catch (err) {
        logger.error('Failed to get user', err)
        res.status(500).send({ err: 'Failed to get user' })
    }
}

export async function deleteJob(req, res) {
    try {
        const data = req.body
        if (!data.jobId) {
            throw new Error('no jobId provided...')
        } else {
            const savedUser = await userService.deleteJob(data)
            res.send(savedUser)
        }
    } catch (error) {
        logger.error('Failed to update user', err)
        res.status(500).send({ err: 'Failed to update user' })
    }

}

export async function updateJob(req, res) {
    try {
        const data = req.body
        if (!data.jobId) {
            throw new Error('no jobId provided...')
        } else {
            const jobToSave = data.jobs.find((job) => job._id === data.jobId)
            const userId = data._id
            const savedUser = await userService.updateJob(jobToSave, userId)
            res.send(savedUser)
        }
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(500).send({ err: 'Failed to update user' })
    }
}

export async function addJob(req, res) {
    const secretKey = process.env.RECAPTCHA_SECRET
    try {
        const data = req.body
        const recaptchaRes = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${data.recaptchaToken}`)
        if (!recaptchaRes.data.success || recaptchaRes.data.score < 0.5) {
            return res.status(403).json({ err: 'reCAPTCHA verification failed' });
        }
        const savedUser = await userService.addJob(data)
        res.send(savedUser)
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(500).send({ err: 'Failed to update user' })
    }
}