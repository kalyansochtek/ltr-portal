export default async function handler(req, res) {
  try {
    const API_KEY = process.env.VITE_SAM_API_KEY;

    const response = await fetch(
      `https://api.sam.gov/prod/opportunities/v2/search?api_key=${API_KEY}&limit=5&noticeType=Presolicitation`
    );

    const text = await response.text();

    console.log(text);

    try {
      const data = JSON.parse(text);
      res.status(200).json(data);
    } catch {
      res.status(500).json({
        error: "SAM API failed",
        details: text,
      });
    }
  } catch (err) {
    res.status(500).json({
      error: "Server Error",
      details: err.message,
    });
  }
}