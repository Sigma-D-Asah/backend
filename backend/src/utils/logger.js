export function log(...args) {
  if (process.env.NODE_ENV === 'test') return;
  console.log(...args);
}
