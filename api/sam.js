export default async function handler(req, res) {
  try {
    const API_KEY = process.env.SAM_API_KEY;

    const response = await fetch(
      `https://api.sam.gov/prod/opportunities/v2/search?api_key=${API_KEY}&limit=1`
    );

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}