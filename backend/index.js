'use strict';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './src/routes/index.js';
import { createPrediction } from './src/controllers/predictionsController.js';
import errorHandler from './src/middlewares/errorHandler.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Predictive Maintenance Copilot API - Backend');
});

// Mount API routes under /api/v1
app.use('/api/v1', routes);

// Backwards compatible /api/predict: alias to POST /api/predictions
app.post('/api/predict', createPrediction);

// Dummy automatic maintenance ticket endpoint
// in-memory fallback for tickets (used when no DB configured)
let tickets = [];
// Ticket routes moved to /api/tickets via router

// error handler handler should be last
app.use(errorHandler);

app.listen(port, () => {
	console.log(`Express backend listening at http://127.0.0.1:${port}`);
});