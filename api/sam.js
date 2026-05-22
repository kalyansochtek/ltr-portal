export default async function handler(req, res) {
  try {
    const API_KEY = process.env.VITE_SAM_API_KEY;

    console.log("API KEY:", API_KEY);

    const response = await fetch(
      `https://api.sam.gov/opportunities/v2/search?limit=1&api_key=${API_KEY}`
    );

    console.log("STATUS:", response.status);

    const text = await response.text();

    console.log("RAW RESPONSE:", text);

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