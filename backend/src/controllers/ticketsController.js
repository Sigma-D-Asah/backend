import { isDrizzleConfigured } from '../db/index.js';
import * as drizzleInsert from '../db/queries/insert.js';
import * as drizzleSelect from '../db/queries/select.js';

export async function createTicket(req, res) {
  try {
    const { description = '', priority = 'low', source = 'copilot' } = req.body;
    const ticket = { description, priority, source, createdAt: new Date().toISOString() };
    if (isDrizzleConfigured()) {
      const created = await drizzleInsert.createTicket(ticket);
      return res.status(201).json(created || ticket);
    }
    // fallback: store in memory (dummy)
    return res.status(201).json({ ticket, message: 'Ticket created (dummy)' });
  } catch (err) {
    console.error('createTicket error', err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
}

export async function listTickets(req, res) {
  try {
    if (isDrizzleConfigured()) {
      const t = await drizzleSelect.getTickets();
      return res.json(t);
    }
    return res.json({ tickets: [] });
  } catch (err) {
    console.error('listTickets error', err);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
}
