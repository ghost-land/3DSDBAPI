const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { findTidPath } = require('../utils/pathFinder');

const router = express.Router();

router.get('/:tid/media', async (req, res) => {
  try {
    const tidPath = await findTidPath(req.params.tid);
    if (!tidPath) {
      return res.status(404).json({ error: 'TID not found' });
    }

    const baseUrl = `https://api.ghseshop.cc/${req.params.tid}`;
    const media = {
      metadata: `${baseUrl}`,
      banner: `${baseUrl}/banner`,
      icon: `${baseUrl}/icon`,
      screenshots: {
        compiled: [],
        uncompiled: {
          upper: [],
          lower: []
        }
      },
      thumbnails: []
    };

    // Get compiled screenshots
    try {
      const screensPath = path.join(tidPath, 'screenshots');
      const screenFiles = await fs.readdir(screensPath);
      media.screenshots.compiled = screenFiles
        .filter(file => file.startsWith('screenshot_'))
        .sort()
        .map(file => `${baseUrl}/screen/${file.match(/\d+/)[0]}`);
    } catch (error) {
      // Directory might not exist, continue
    }

    // Get uncompiled screenshots
    try {
      const uncompiledPath = path.join(tidPath, 'screenshots_uncompiled');
      const uncompiledFiles = await fs.readdir(uncompiledPath);
      
      uncompiledFiles.forEach(file => {
        const match = file.match(/screenshot_(\d+)_(upper|lower)\.jpg/);
        if (match) {
          const [, num, screen] = match;
          const type = screen === 'upper' ? 'upper' : 'lower';
          media.screenshots.uncompiled[type].push(
            `${baseUrl}/screen_u/${num}/${type[0]}`
          );
        }
      });
      
      // Sort the arrays
      media.screenshots.uncompiled.upper.sort();
      media.screenshots.uncompiled.lower.sort();
    } catch (error) {
      // Directory might not exist, continue
    }

    // Get thumbnails
    try {
      const thumbsPath = path.join(tidPath, 'thumbnails');
      const thumbFiles = await fs.readdir(thumbsPath);
      media.thumbnails = thumbFiles
        .filter(file => file.startsWith('thumbnail_'))
        .sort()
        .map(file => `${baseUrl}/thumb/${file.match(/\d+/)[0]}`);
    } catch (error) {
      // Directory might not exist, continue
    }

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;