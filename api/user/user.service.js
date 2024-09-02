import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

import mongodb from 'mongodb'
const { ObjectId } = mongodb

const PAGE_SIZE = 10

export const userService = {
    getById,
    getByuserName,
    addJob,
    deleteJob,
    updateJob,
    add
}

// async function getById(userId, filterBy = { txt: '', status: '', jobType: '', pageIdx: 0 }, sortBy = { subject: '' }) {
//     const skip = filterBy.pageIdx * PAGE_SIZE
//     const limit = PAGE_SIZE
//     try {
//         const collection = await dbService.getCollection('user')
//         // Construct the criteria for filtering jobs
//         const jobFilters = []
//         if (filterBy.txt) {
//             jobFilters.push({
//                 $or: [
//                     {
//                         $regexMatch: {
//                             input: "$$job.position",
//                             regex: filterBy.txt,
//                             options: 'i' // Case-insensitive search
//                         }
//                     },
//                     {
//                         $regexMatch: {
//                             input: "$$job.company",
//                             regex: filterBy.txt,
//                             options: 'i' // Case-insensitive search
//                         }
//                     }
//                 ]
//             })
//         }
//         if (filterBy.status) {
//             jobFilters.push({
//                 $eq: ["$$job.status", filterBy.status]
//             })
//         }
//         if (filterBy.jobType) {
//             jobFilters.push({
//                 $eq: ["$$job.jobType", filterBy.jobType]
//             })
//         }
//         const pipeline = [
//             { $match: { _id: new ObjectId(userId) } },
//             {
//                 $project: {
//                     _id: 1,
//                     userName: 1,
//                     fullName: 1,
//                     jobs: {
//                         $slice: [
//                             {
//                                 $filter: {
//                                     input: "$jobs",
//                                     as: "job",
//                                     cond: jobFilters.length > 0 ? { $and: jobFilters } : {}
//                                 }
//                             },
//                             skip, // skip indicates how many jobs to skip
//                             limit // limit indicates how many jobs to return
//                         ]
//                     }
//                 }
//             },

//             // Apply sorting if necessary
//             ...(sortBy.subject
//                 ? [{
//                     $project: {
//                         _id: 1,
//                         userName: 1,
//                         fullName: 1,
//                         totalFilteredJobs: 1,
//                         jobs: {
//                             $sortArray: {
//                                 input: "$jobs",
//                                 sortBy: { [sortBy.subject.replace(/^-/, '')]: sortBy.subject.startsWith('-') ? -1 : 1 }
//                             }
//                         }
//                     }
//                 }]
//                 : [])
//         ]
//         // Execute the aggregation pipeline and convert the result to an array.
//         const [user] = await collection.aggregate(pipeline).toArray()
//         if (!user) {
//             throw new Error(`User with ID ${userId} not found`)
//         }

//         // return user
//         return {
//             ...user,
//             totalFilteredJobs: user.totalFilteredJobs,
//             jobs: user.jobs,
//         };
//     } catch (err) {
//         logger.error(`while finding user ${userId}`, err)
//         throw err
//     }
// }

async function getById(userId, filterBy = { txt: '', status: '', jobType: '', pageIdx: 0 }, sortBy = { subject: '' }) {
    const skip = filterBy.pageIdx * PAGE_SIZE;
    const limit = PAGE_SIZE;

    try {
        const collection = await dbService.getCollection('user');

        // Construct the criteria for filtering jobs
        const jobFilters = [];
        if (filterBy.txt) {
            jobFilters.push({
                $or: [
                    {
                        $regexMatch: {
                            input: "$$job.position",
                            regex: filterBy.txt,
                            options: 'i' // Case-insensitive search
                        }
                    },
                    {
                        $regexMatch: {
                            input: "$$job.company",
                            regex: filterBy.txt,
                            options: 'i' // Case-insensitive search
                        }
                    }
                ]
            });
        }
        if (filterBy.status) {
            jobFilters.push({
                $eq: ["$$job.status", filterBy.status]
            });
        }
        if (filterBy.jobType) {
            jobFilters.push({
                $eq: ["$$job.jobType", filterBy.jobType]
            });
        }

        const pipeline = [
            { $match: { _id: new ObjectId(userId) } },
            {
                $project: {
                    _id: 1,
                    userName: 1,
                    fullName: 1,
                    jobs: {
                        $filter: {
                            input: "$jobs",
                            as: "job",
                            cond: jobFilters.length > 0 ? { $and: jobFilters } : {}
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalFilteredJobs: { $size: "$jobs" }, // Calculate total filtered jobs
                }
            },
            // Apply sorting if necessary
            ...(sortBy.subject
                ? [{
                    $addFields: {
                        jobs: {
                            $sortArray: {
                                input: "$jobs",
                                sortBy: { [sortBy.subject.replace(/^-/, '')]: sortBy.subject.startsWith('-') ? -1 : 1 }
                            }
                        }
                    }
                }]
                : []),
            {
                $project: {
                    _id: 1,
                    userName: 1,
                    fullName: 1,
                    totalFilteredJobs: 1,
                    jobs: { $slice: ["$jobs", skip, limit] } // Apply pagination
                }
            }
        ];

        // Execute the aggregation pipeline and convert the result to an array.
        const [user] = await collection.aggregate(pipeline).toArray();
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Return the user along with the totalFilteredJobs and paginated jobs
        return {
            ...user,
            totalFilteredJobs: user.totalFilteredJobs,
            jobs: user.jobs,
        };
    } catch (err) {
        logger.error(`while finding user ${userId}`, err);
        throw err;
    }
}

async function deleteJob(data) {
    try {
        const collection = await dbService.getCollection('user');
        // Update the first job in the array
        await collection.updateOne(
            { _id: new ObjectId(data._id) },
            { $pull: { "jobs": { _id: data.jobId } } } // Update the first element
        )
        return { data };
    } catch (err) {
        logger.error(`cannot update user ${data._id}`, err);
        throw err;
    }
}

async function updateJob(jobToSave, userId) {
    try {
        const collection = await dbService.getCollection('user');

        // Update the first job in the array
        await collection.updateOne(
            { _id: new ObjectId(userId), "jobs._id": (jobToSave._id) },
            { $set: { "jobs.$": jobToSave } } // Update the first element
        );
        return { jobToSave };
    } catch (err) {
        logger.error(`cannot update user ${jobToSave._id}`, err);
        throw err;
    }
}

async function addJob(data) {
    try {
        const collection = await dbService.getCollection('user');
        await collection.updateOne(
            { _id: new ObjectId(data._id) },
            {
                $push: {
                    jobs: {
                        $each: [data.newJob],
                        $position: 0
                    }
                }
            }
        )
        return { data };
    } catch (err) {
        logger.error(`cannot update user ${data._id}`, err);
        throw err;
    }
}



//add new user
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