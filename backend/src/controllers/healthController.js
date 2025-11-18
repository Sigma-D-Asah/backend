export function health(req, res) {
  res.json({ uptime: process.uptime(), message: 'ok', timestamp: new Date().toISOString() });
}
