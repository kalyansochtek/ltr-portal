export default async function handler(req, res) {
  try {
    const apiKey = process.env.SAM_API_KEY;

    const postedFrom = "01/01/2025";
    const postedTo = "12/31/2025";

    const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${apiKey}&limit=5&postedFrom=${postedFrom}&postedTo=${postedTo}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}