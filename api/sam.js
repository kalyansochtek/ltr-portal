export default async function handler(req, res) {

  const API_KEY = process.env.VITE_SAM_API_KEY;

  try {

    const response = await fetch(
      `https://api.sam.gov/prod/opportunities/v2/search?api_key=${API_KEY}&limit=5`
    );

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {

    res.status(500).json({
      error: "SAM API failed",
      details: error.message,
    });

  }
}