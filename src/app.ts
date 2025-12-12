import express, {urlencoded, json} from 'express';
import cors from 'cors';

// Import Swagger Tools
import swaggerJsDoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger';
import { apiReference } from '@scalar/express-api-reference';

// Import Middleware & Environment Config
import { notFound } from './middleware/notFound';
import { error } from './middleware/error';
import { appConfig } from './config/index';

// Import Routes
import { machinesRouter } from './routes/machines.route';
import { ticketsRouter } from './routes/tickets.route';
import { sensorsRouter } from './routes/sensors.route';
import { predictionsRouter } from './routes/predictions.route';
import { jobsRouter } from './routes/jobs.route';
import { chatRouter } from './routes/chat.route';

// Import Background Jobs
import { startBackgroundProcessor } from './services/processor.service';
import { startSensorDataCronJob } from './jobs/sensor-cron';

const app = express();

// CORS Configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://sigma-ml.raihanpk.com',
        'https://sigma-asah.vercel.app',
        /\.raihanpk\.com$/  // Allow all subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Konfigurasi
app.use(urlencoded({ extended: true }));
app.use(json());

// Routes
const prefix = '/api/v1';

// Service Routes
app.use(prefix, machinesRouter);
app.use(prefix, ticketsRouter);
app.use(prefix, sensorsRouter);
app.use(prefix, predictionsRouter);
app.use(prefix, jobsRouter);
app.use(prefix, chatRouter);

// OpenAPI Routes
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', 
    apiReference({
        content: swaggerDocs,
        theme: 'kepler',
        layout: 'modern',
}));

// Error Handling Middleware
app.use(notFound);
app.use(error);

// Server Start
const port = appConfig.PORT;
const host = appConfig.HOST;
app.listen(port, host, () => {
    console.log(`Dokumentasi server dapat diakses di http://${host}:${port}/docs`);
    
    // Start Background Jobs
    console.log('\n=== Starting Background Services ===');
    
    // Sensor Data Generation Cron Job (every 8 hours = 3x per day)
    startSensorDataCronJob(8);
    
    // Background Processor for ML Predictions (every 5 minutes)
    startBackgroundProcessor(5);
    
    console.log('=== All Services Started ===\n');
});

export default app;