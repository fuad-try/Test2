// api/facebook.js

export default async function handler(req, res) {
  const { link } = req.query;

  if (!link) {
    return res.status(400).json({ error: "Missing 'link' query parameter." });
  }

  try {
    const apiUrl = \`https://facebook-profile-picture-viewer.p.rapidapi.com/?fburl=\${encodeURIComponent(link)}\`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Dart/3.5 (dart:io)',
        'Accept-Encoding': 'gzip',
        'x-rapidapi-host': 'facebook-profile-picture-viewer.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
