import { Express } from 'express';
import { googleOAuthHandler } from './controller/session-controller';
import { authenticate } from './middleware/authenitcate';
import { getPublicContentHandler } from './controller/get-public-content';
import { getPrivateContent } from './controller/get-private-content';

export default function routes(app: Express) {
  // Public routes
  app.get('/sessions/oauth/google', googleOAuthHandler);
  app.get('/api/content/public', getPublicContentHandler)

  // Private routes
  app.get('/api/content/private', authenticate, getPrivateContent);
}
