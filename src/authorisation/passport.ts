import passport from 'passport';
import passportJWT from 'passport-jwt';

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
import {Strategy as LocalStrategy} from 'passport-local';

import * as tedious from 'tedious';
import { Express } from "express";
import { Query, QueryParameter} from '../sql/query';

export function initPassport(app: Express) {
    /// set up the way we give a token to the client
    passport.use(
        new LocalStrategy(
            { usernameField: 'username', passwordField: 'password' },
            /// the client sends a POST to /login with 'username' and 'password' parameters in the body
            /// done is a function that takes us to next middleware
            async function (username, password, done) {
                let sqlStatement = `SELECT * FROM Users WHERE username=@username AND user_password=@password`;
                let loginParameters = [
                    new QueryParameter("username", username, tedious.TYPES.VarChar),
                    new QueryParameter("password", password, tedious.TYPES.VarChar)
                ];
                let login = new Query(sqlStatement, loginParameters);

                try {
                    let loginRows = await login.executeStatement();

                    if (!loginRows) {
                        return done(null, false, {message: 'Incorrect email or password.'});
                    }

                    return done(null, loginRows[0], {message: 'Logged In Successfully'});
                } catch(e) {
                    done(e);
                }
            }
        )
    );

    /// then in each subsequent request user includes 
    /// parameter 'Authorization: Bearer <token>' in the HTTP request
    passport.use(
        /// this strategy decodes the token the client sent into e.g. { username: 'milospuric', password: 'password1', iat: 1719868175 }
        new JWTStrategy(
            {
                jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
                secretOrKey: 'your_jwt_secret'
            },
            async function (jwtPayload, done) {
                /// jwtPayload is e.g. { username: 'milospuric', password: 'password1', iat: 1719868175 }

                /// verify decoded credentials
                let sqlStatement = `SELECT * FROM Users WHERE username=@username AND user_password=@password`;
                let loginParameters = [
                    new QueryParameter("username", jwtPayload.username, tedious.TYPES.VarChar),
                    new QueryParameter("password", jwtPayload.password, tedious.TYPES.VarChar)
                ];
                let verifyUser = new Query(sqlStatement, loginParameters);

                try {
                    let loginRows = await verifyUser.executeStatement();

                    if (!loginRows) {
                        return done(null, false, {message: 'Incorrect email or password.'});
                    }

                    return done(null, loginRows[0], {message: 'User recognised.'});
                } catch(e) {
                    done(e);
                }
            }
        )
    );
}