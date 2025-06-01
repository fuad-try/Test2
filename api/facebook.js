export default async function handler(req, res) {
  const { link } = req.query;

  if (!link) {
    return res.status(400).json({ error: "Missing 'link' query parameter." });
  }

  try {
    const apiUrl = `https://facebook-profile-picture-viewer.p.rapidapi.com/?fburl=${encodeURIComponent(link)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Dart/3.5 (dart:io)',
        'Accept-Encoding': 'gzip',
        'x-rapidapi-host': 'facebook-profile-picture-viewer.p.rapidapi.com',
        'x-rapidapi-key': 'y76eBTWokKmshCLPwQKtW1hkvASip13jtwGjsnHhlrq4pdoJQy'
      }
    });

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      // Pick the last item (usually the best quality image)
      const lastImage = data[data.length - 1];
      res.status(200).json({ profile_picture_url: lastImage });
    } else {
      res.status(200).json({ profile_picture_url: null, raw_response: data });
    }

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
