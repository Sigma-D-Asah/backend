import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sigma-D: Predictive Maintenance Copilot API',
      version: '1.0.0',
      description: 'Dokumentasi API untuk Proyek Capstone Asah oleh Tim A25-CS052',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://sigma-backend.raihanpk.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Machine: {
          type: 'object',
          required: ['code', 'name', 'type'],
          properties: {
            machineId: { type: 'string', format: 'uuid' },
            code: { type: 'string', description: 'Kode unik mesin', example: 'MCH-001' },
            name: { type: 'string', description: 'Nama mesin', example: 'Mesin CNC 1' },
            type: { type: 'string', description: "Tipe mesin", example: 'Computer Numerical Control' },
            location: { type: 'string', example: 'Factory Floor 1' },
            status: { type: 'string', example: 'ACTIVE' },
            metadata: { type: 'object', description: 'Field tambahan dalam format JSON' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        MachineInput: {
          type: 'object',
          required: ['code','name','type'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string' },
            metadata: { type: 'object' }
          }
        },
        MachineUpdate: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string' },
            metadata: { type: 'object' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Status response',
            },
            message: {
              type: 'string',
              description: 'Pesan response',
            },
            data: {
              description: 'Data response',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Pesan error',
            },
            error: {
              type: 'string',
              description: 'Detail error',
            },
            errors: {
              type: 'array',
              description: 'Validation errors',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        Success: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path ke file yang mengandung JSDoc comments
};

export const swaggerOptions = options;