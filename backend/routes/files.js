const express = require('express');

const auth = require('../middleware/auth');

const File = require('../models/File');

const multer = require('multer');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const router = express.Router();

router.post('/upload', auth, upload.single('file'), async (req, res) => {

  try {

    const { file } = req;

    if (!file) return res.status(400).json({ message: 'No file' });

    const fileData = new File({

      uploaderId: req.user.userId,

      fileName: file.originalname,

      fileType: file.mimetype,

      fileSize: file.size + ' bytes',

      fileURL: `/uploads/${file.filename}`

    });

    await fileData.save();

    res.json(fileData);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});

module.exports = router;