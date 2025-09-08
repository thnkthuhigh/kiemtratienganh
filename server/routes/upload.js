import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create directories if they don't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure multer for file uploads
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const audioDir = path.join(process.cwd(), 'public/audio');
    ensureDirectoryExists(audioDir);
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imageDir = path.join(process.cwd(), 'public/images');
    ensureDirectoryExists(imageDir);
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'image-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadImage = multer({ 
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Audio upload endpoint
router.post('/audio', uploadAudio.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      filename: req.file.filename,
      path: `/audio/${req.file.filename}`
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
});

// Image upload endpoint
router.post('/image', uploadImage.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Copy file to client public folder as well
    const clientImageDir = path.join(process.cwd(), '../public/images');
    const serverImagePath = req.file.path;
    const clientImagePath = path.join(clientImageDir, req.file.filename);
    
    // Ensure client directory exists
    ensureDirectoryExists(clientImageDir);
    
    // Copy file to client public folder
    try {
      fs.copyFileSync(serverImagePath, clientImagePath);
    } catch (copyError) {
      console.warn('Warning: Could not copy to client folder:', copyError.message);
    }

    res.json({
      success: true,
      message: 'Image file uploaded successfully',
      filename: req.file.filename,
      path: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image file' });
  }
});

export default router;
