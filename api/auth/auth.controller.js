import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'
import axios from 'axios'
export async function login(req, res) {
    const { userName, password, recaptchaToken } = req.body
    const secretKey = process.env.RECAPTCHA_SECRET
    console.log('recaptchaToken:', recaptchaToken)
    console.log('secretKey:', secretKey)
    // Username validation
    if (!userName || !/^[a-zA-Z0-9_]{3,15}$/.test(userName)) {
        return res.status(400).json({ err: 'Username must be 3-15 characters (letters, numbers only).' });
    }

    // Password validation (at least 6 characters, allowing special characters)
    if (!password || password.length < 3) {
        return res.status(400).json({ err: 'Password must be at least 3 characters long.' });
    }
    try {
        const recaptchaRes = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`)

        // ✅ Check if reCAPTCHA was successful
        if (!recaptchaRes.data.success || recaptchaRes.data.score < 0.5) {
            console.log('failololo!!!!!!')
            return res.status(403).json({ err: 'reCAPTCHA verification failed' });
        }
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
export async function demoLogin(req, res) {
    const { userName, password } = req.body
    // Username validation
    if (!userName || !/^[a-zA-Z0-9_]{3,15}$/.test(userName)) {
        return res.status(400).json({ err: 'Username must be 3-15 characters (letters, numbers only).' });
    }
    // Password validation (at least 6 characters, allowing special characters)
    if (!password || password.length < 3) {
        return res.status(400).json({ err: 'Password must be at least 3 characters long.' });
    }

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
    const { userName, password, fullName } = req.body
    try {
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