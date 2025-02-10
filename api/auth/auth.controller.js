import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'

export async function login(req, res) {
    const { userName, password } = req.body
    try {
        const user = await authService.login(userName, password)
        const loginToken = authService.getLoginToken(user)

        logger.info('User login: ', user)
        // Prevents XSS attacks by making the cookie inaccessible to JavaScript.
        // secure: true ensures cookies are only sent over HTTPS in production.
        // sameSite: 'strict' mitigates CSRF attacks.
        res.cookie('loginToken', loginToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
            sameSite: 'strict'
        });

        res.json(user)
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

export async function signup(req, res) {
    try {
        const { userName, password, fullName } = req.body

        // IMPORTANT!!! 
        // Never write passwords to log file!!!
        // logger.debug(fullName + ', ' + userName + ', ' + password)

        const account = await authService.signup(userName, password, fullName)
        logger.debug(`auth.route - new account created: ` + JSON.stringify(account))

        const user = await authService.login(userName, password)
        const loginToken = authService.getLoginToken(user)

        res.cookie('loginToken', loginToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
            sameSite: 'strict'
        });
        res.json(user)
        console.log('ccc', loginToken, user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}