const passport    = require('passport');
const passportJWT = require("passport-jwt");

const ExtractJWT = passportJWT.ExtractJwt;

const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy   = passportJWT.Strategy;

import * as tedious from 'tedious';
import { Query, QueryParameter} from './query';

/// set up the way we give a token to the client
passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    /// the client sends a POST to /login with 'username' and 'password' parameters in the body
    async function (username, password, cb) {
        let sqlStatement = `SELECT * FROM Users WHERE username=@username AND user_password=@password`;
        let loginParameters = new Array(0);
        loginParameters.push(new QueryParameter("username", username, tedious.TYPES.VarChar));
        loginParameters.push(new QueryParameter("password", password, tedious.TYPES.VarChar));
        let login = new Query(sqlStatement, loginParameters);

        try {
            let loginRows = await login.executeStatement();

            if (!loginRows) {
                return cb(null, false, {message: 'Incorrect email or password.'});
            }

            console.log(loginRows);

            return cb(null, loginRows[0], {message: 'Logged In Successfully'});
        } catch {
            console.log("shit");
        }
    }
));

/// set up the way we authenticate the token client sends us
passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : 'your_jwt_secret'
    },
    function (jwtPayload, cb) {
        //find the user in db if needed
        /*return UserModel.findOneById(jwtPayload.id)
            .then(user => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            }); */
    }
));