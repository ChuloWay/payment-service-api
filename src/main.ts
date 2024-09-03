import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  // Use morgan for HTTP request logging
  app.use(morgan('combined'));

  // Use validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({ stopAtFirstError: true, whitelist: true }),
  );

  // Body parser to handle raw JSON
  app.use(
    bodyParser.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    }),
  );

  // Compression middleware
  app.use(compression());

  // Helmet for security headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: '*',
    preflightContinue: true,
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, XMLHttpRequest',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
    credentials: true,
  });

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payment Service API')
    .setDescription('The Payment Service API documentation')
    .setVersion('1.0')
    .addTag('payment-service')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  // Get port from environment variables or use default
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  // Use the logger to log a message
  logger.log(
    `Payment Service API is listening on: http://localhost:${port} 🚀`,
  );
}

bootstrap();
