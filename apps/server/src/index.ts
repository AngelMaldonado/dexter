import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initializeDatabase } from '@dexter/db';
import { Orchestrator } from '@dexter/engine';
import { entityRoutes } from './routes/entities.js';
import { taskRoutes } from './routes/tasks.js';
import { organizationRoutes } from './routes/organization.js';
import { activityRoutes } from './routes/activity.js';
import { officeRoutes } from './routes/office.js';
import { setupWebSocket, handleWsOpen, handleWsClose, handleWsMessage } from './ws/handler.js';

// Initialize database
const db = initializeDatabase();

// Initialize orchestrator
const orchestrator = new Orchestrator(db);

// Setup WebSocket event broadcasting
setupWebSocket(orchestrator.eventBus);

// Create Hono app
const app = new Hono();

app.use('*', cors());

// Mount routes
app.route('/api/entities', entityRoutes(orchestrator));
app.route('/api/tasks', taskRoutes(orchestrator));
app.route('/api/org', organizationRoutes(db));
app.route('/api/activity', activityRoutes(orchestrator));
app.route('/api/office', officeRoutes(orchestrator, db));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = parseInt(process.env.PORT ?? '3001', 10);

const server = Bun.serve({
  port,
  fetch: app.fetch,
  websocket: {
    open: handleWsOpen,
    close: handleWsClose,
    message: handleWsMessage,
  },
});

console.log(`Dexter server running on http://localhost:${port}`);
console.log(`WebSocket available on ws://localhost:${port}`);
