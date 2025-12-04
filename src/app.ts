import express, {urlencoded, json} from 'express';

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

const app = express();

// Konfigurasi
app.use(urlencoded({ extended: true }));
app.use(json());

// Routes
const prefix = '/api/v1';

// Service Routes
app.use(prefix, machinesRouter);
app.use(prefix, ticketsRouter);

// OpenAPI Routes
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', 
    apiReference({
        content: swaggerDocs,
        theme: 'kepler',
        layout: 'modern',
}));

// ... dan lain-lain

// Error Handling Middleware
app.use(notFound);
app.use(error);

const port = appConfig.PORT;
const host = appConfig.HOST;
app.listen(port, host, () => {
    console.log(`Dokumentasi server dapat diakses di http://${host}:${port}/docs`);
});

export default app;