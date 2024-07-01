import express from 'express';
import 'dotenv/config';

import passport from 'passport';
require('./passport');
import auth from './auth';

import healthcheckRoutes from './controllers/healthcheckController';
import bookRoutes from './controllers/bookController';

const port = process.env['PORT'] || 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});

/**
 * Primary app routes.
 */
app.use('/auth', auth);
app.use('/healthcheck', healthcheckRoutes);
app.use('/books', passport.authenticate('jwt', {session: false}), bookRoutes);