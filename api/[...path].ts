import { app } from '../server/index';

// Vercel serverless function handler
export default async function handler(req: Request) {
  return app.fetch(req);
}
