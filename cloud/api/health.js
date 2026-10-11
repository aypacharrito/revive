export default function handler(req, res) {
  res.status(200).json({ name: 'REVIVE cloud', ready: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
}
