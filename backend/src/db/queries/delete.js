import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { predictions } from '../schema.js';

export async function deletePrediction(id) {
  await db.delete(predictions).where(eq(predictions.id, Number(id)));
  return true;
}
