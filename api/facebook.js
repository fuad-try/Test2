const fetch = require('node-fetch');
const cheerio = require('cheerio');

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getMetaFast(html, prop) {
  const $ = cheerio.load(html);
  return (
    $(`meta[property="${prop}"]`).attr('content') ||
    $(`meta[name="${prop}"]`).attr('content') ||
    null
  );
}

module.exports = async function handler(req, res) {
  const url = req.query.url;

  if (!url || !isValidUrl(url)) {
    res.status(400).json({ error: 'Missing or invalid URL' });
    return;
  }

  // Fetch the target URL (first 100 bytes mimic)
  const fetchScraper = fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Node scraper)',
      Range: 'bytes=0-100',
    },
    redirect: 'follow',
    timeout: 10000,
  })
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);

  // Fetch fallback API
  const encodedUrl = encodeURIComponent(url);
  const rapidApiUrl = `https://facebook-profile-picture-viewer.p.rapidapi.com/?fburl=${encodedUrl}`;

  const fetchFallback = fetch(rapidApiUrl, {
    headers: {
      'User-Agent': 'Dart/3.5 (dart:io)',
      'Accept-Encoding': 'gzip',
      'x-rapidapi-host': 'facebook-profile-picture-viewer.p.rapidapi.com',
      'x-rapidapi-key': 'y76eBTWokKmshCLPwQKtW1hkvASip13jtwGjsnHhlrq4pdoJQy',
    },
    timeout: 10000,
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const [scraperHtml, fallbackData] = await Promise.all([
    fetchScraper,
    fetchFallback,
  ]);

  let name = null,
    username = null,
    userid = null,
    profileImage = null;

  if (scraperHtml) {
    name = getMetaFast(scraperHtml, 'og:title');
    const ogUrl = getMetaFast(scraperHtml, 'og:url');
    const androidUrl = getMetaFast(scraperHtml, 'al:android:url');
    const ogImage = getMetaFast(scraperHtml, 'og:image');
    const twitterImg = getMetaFast(scraperHtml, 'twitter:image');

    if (ogUrl) {
      const match = ogUrl.match(/facebook\.com\/([^/?&]+)/i);
      if (match) username = match[1];
    }
    if (androidUrl) {
      const m = androidUrl.match(/fb:\/\/profile\/(\d+)/i);
      if (m) userid = m[1];
    }

    profileImage = ogImage || twitterImg;
    if (profileImage) {
      const dimMatch = profileImage.match(/cstp=mx?(\d+x\d+)/i);
      if (dimMatch) {
        const maxDim = dimMatch[1];
        profileImage = profileImage.replace(
          /ctp=[sp]\d+x\d+/i,
          'ctp=p' + maxDim
        );
      }
    }
  }

  // fallback to fallback API if needed
  if (!profileImage && fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
    profileImage = fallbackData[fallbackData.length - 1];
  }

  res.status(200).json({
    Name: name,
    User_Name: username,
    User_ID: userid,
    Profile_Image: profileImage,
  });
};
