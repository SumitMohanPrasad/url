const mongoose = require('mongoose');
const express = require('express');
const app = express();

const urlMappingSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, expires: '20d', default: Date.now() + 20 * 24 * 60 * 60 * 1000 }, 
});

const UrlMapping = mongoose.model('UrlMapping', urlMappingSchema);

function generateShortUrl() {
  const length = 7; 
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortUrl = 'www.ppa.in/';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    shortUrl += characters.charAt(randomIndex);
  }
  return shortUrl;
}

async function shortenUrl(originalUrl) {
  try {
    let shortUrl = generateShortUrl();
    const urlMapping = new UrlMapping({originalUrl,shortUrl});
    await urlMapping.save();
    return shortUrl;
  } catch (error) {
    throw new Error('Error on shortening the URL');
  }
}

async function updateShortUrl(shortUrl, newDestinationUrl) {
  try {
    const updatedUrlMapping = await UrlMapping.findOneAndUpdate(
      { shortUrl },
      { originalUrl: newDestinationUrl },
      { new: true }
    );
    return updatedUrlMapping !== null;
  } catch (error) {
    throw new Error('Error on updating the URL');
  }
}

async function getDestinationUrl(shortUrl) {
  try {
    const urlMapping = await UrlMapping.findOne({ shortUrl });
    return urlMapping ? urlMapping.originalUrl : null;
  } catch (error) {
    throw new Error('Error on getting the destination URL');
  }
}

async function updateExpiry(shortUrl, daysToAdd) {
  try {
    await UrlMapping.updateOne({ shortUrl }, { $set: { expiresAt: Date.now() + daysToAdd * 24 * 60 * 60 * 1000 } });
    return true;
  } catch (error) {
    throw new Error('Error on updating the expiry of the URL');
  }
}

app.post('/shorten', async (req, res) => {
  const originalUrl = req.body.originalUrl; 
  try {
    const shortUrl = await shortenUrl(originalUrl);
    res.status(200).json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

app.get('/:shortUrl', async (req, res) => {
  const shortUrl = 'www.ppa.in/' + req.params.shortUrl;
  try {
    const originalUrl = await getDestinationUrl(shortUrl);
    if (originalUrl) {
      res.redirect(originalUrl);
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to redirect' });
  }
});

const port = 3001; 
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
