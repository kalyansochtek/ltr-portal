export default async function handler(req, res) {
  try {
    const API_KEY = process.env.VITE_SAM_API_KEY;

    const url =
      `https://api.sam.gov/prod/opportunities/v2/search?api_key=${API_KEY}&limit=5&offset=0`;

    const response = await fetch(url);

    const text = await response.text();

    res.status(200).json({
      status: response.status,
      raw: text,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}