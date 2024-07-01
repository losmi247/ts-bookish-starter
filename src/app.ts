import express from 'express';
import passport from 'passport';

import 'dotenv/config';

import auth from './authorisation/auth';
import { initPassport } from './authorisation/passport';
import healthcheckRoutes from './controllers/healthcheckController';
import bookRoutes from './controllers/bookController';

const port = process.env['PORT'] || 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});

initPassport(app);

/**
 * Primary app routes.
 */
app.use('/auth', auth);
app.use('/healthcheck', healthcheckRoutes);
/// protect the below route using jwt
app.use('/books', passport.authenticate("jwt", { session: false }), bookRoutes);