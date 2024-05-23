import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'

export async function getUser(req, res) {
    const nameInputValue = req.query.params.filterBy.txt
    const statusInputValue = req.query.params.filterBy.status
    const jobTypeInputValue = req.query.params.filterBy.jobType
    const sortBySubject = req.query.params.sortBy.subject
    try {
        const filterBy = {
            txt: nameInputValue || '',
            status: statusInputValue || '',
            jobType: jobTypeInputValue || ''
        }
        const sortBy = {
            subject: sortBySubject
        }
        const user = await userService.getById(req.params.id, filterBy, sortBy)
        // console.log(user)
        // filter here
        res.send(user)
    } catch (err) {
        logger.error('Failed to get user', err)
        res.status(500).send({ err: 'Failed to get user' })
    }
}

export async function updateUser(req, res) {
    try {
        const user = req.body
        console.log('user:', user)
        const savedUser = await userService.update(user)
        res.send(savedUser)
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(500).send({ err: 'Failed to update user' })
    }
}