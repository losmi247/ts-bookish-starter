import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = express.Router();
// user POSTs 'username' and 'password' on /login 
router.post('/login', function (req, res, next) {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Something is not right', user: user });
        }

        // generate a signed son web token with the contents of user object and return it in the response
        let userObj: Object = { 'username' : user[1].value, 'password' : user[2].value };
        try {
            const token = jwt.sign(userObj, 'your_jwt_secret');
            return res.status(200).json({ message: 'Successfull login!', token, user: user });
        } catch (e) {
            console.log(e);
        }

    }) (req, res, next);
});

export default router;