import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { predictions } from '../schema.js';

export async function updatePrediction(id, updates) {
  const [row] = await db.update(predictions).set(updates).where(eq(predictions.id, Number(id))).returning();
  return row || null;
}
