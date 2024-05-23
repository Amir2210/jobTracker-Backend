import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

import mongodb from 'mongodb'
const { ObjectId } = mongodb

export const userService = {
    getById,
    getByuserName,
    update,
    add
}

async function getById(userId, filterBy = { txt: '', status: '', jobType: '' }, sortBy = { subject: '' }) {
    try {
        const collection = await dbService.getCollection('user')

        // Construct the criteria for filtering jobs
        const jobFilters = []
        if (filterBy.txt) {
            jobFilters.push({
                $regexMatch: {
                    input: "$$job.position",
                    regex: filterBy.txt,
                    options: 'i' // Case-insensitive search
                }
            })
        }
        if (filterBy.status) {
            jobFilters.push({
                $eq: ["$$job.status", filterBy.status]
            })
        }
        if (filterBy.jobType) {
            jobFilters.push({
                $eq: ["$$job.jobType", filterBy.jobType]
            })
        }

        // Build the initial pipeline stages
        // The pipeline array is a sequence of stages that process documents in a collection. Each stage transforms the documents as they pass through the pipeline.
        const pipeline = [
            { $match: { _id: new ObjectId(userId) } }, // equivalent to collection.findOne({ _id: new ObjectId(userId) })
            {
                $project: {
                    _id: 1,
                    userName: 1,
                    fullName: 1,
                    jobs: {
                        $filter: {
                            input: "$jobs",
                            as: "job",
                            cond: { $and: jobFilters.length > 0 ? jobFilters : [{}] }
                            //combine all the filters together
                        }
                    }
                }
            }
        ]
        // Add the $sortArray stage if sortBy.subject is specified
        if (sortBy.subject) {
            const sortField = sortBy.subject.startsWith('-') ? sortBy.subject.slice(1) : sortBy.subject
            const sortOrder = sortBy.subject.startsWith('-') ? -1 : 1
            pipeline.push({
                $project: {
                    _id: 1,
                    userName: 1,
                    fullName: 1,
                    jobs: {
                        $sortArray: {
                            input: "$jobs",
                            sortBy: { [sortField]: sortOrder }
                        }
                    }
                }
            })
        }
        // Execute the aggregation pipeline and convert the result to an array.
        const [user] = await collection.aggregate(pipeline).toArray()
        if (!user) {
            throw new Error(`User with ID ${userId} not found`)
        }

        return user
    } catch (err) {
        logger.error(`while finding user ${userId}`, err)
        throw err
    }
}












async function getByuserName(userName) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ userName })
        return user
    } catch (err) {
        logger.error(`while finding user ${userName}`, err)
        throw err
    }
}



async function update(user) {
    try {
        // pick only updatable fields!
        const userToSave = {
            _id: new ObjectId(user._id),
            jobs: user.jobs,
            fullName: user.fullName,
            userName: user.userName
        }

        const collection = await dbService.getCollection('user')
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        // Validate that there are no such user:
        const existUser = await getByuserName(user.userName)
        if (existUser) throw new Error('userName taken')

        // peek only updatable fields!
        const userToAdd = {
            userName: user.userName,
            password: user.password,
            fullName: user.fullName,
            jobs: user.jobs || []
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot insert user', err)
        throw err
    }
}
