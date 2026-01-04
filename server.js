const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      profile_picture TEXT,
      bio TEXT,
      favorite_movies TEXT,
      favorite_shows TEXT,
      favorite_books TEXT,
      favorite_genres TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Media items table (for watchlist, readlist, and logs)
    db.run(`CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'movie', 'tv', 'book', 'comic'
      status TEXT NOT NULL, -- 'watchlist', 'readlist', 'watched', 'read'
      rating REAL,
      review TEXT,
      release_date TEXT,
      pages_read INTEGER DEFAULT 0,
      total_pages INTEGER,
      is_finished BOOLEAN DEFAULT 0,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_completed DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Daily reading progress table
    db.run(`CREATE TABLE IF NOT EXISTS daily_reading (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      pages_read INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, date)
    )`);

    // Annual stats table
    db.run(`CREATE TABLE IF NOT EXISTS annual_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      books_read INTEGER DEFAULT 0,
      comics_read INTEGER DEFAULT 0,
      movies_watched INTEGER DEFAULT 0,
      tv_shows_finished INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, year)
    )`);
  });
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email or username already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }
        
        const token = jwt.sign({ id: this.lastID, email, username }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, email, username } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        profile_picture: user.profile_picture,
        bio: user.bio,
        favorite_movies: user.favorite_movies,
        favorite_shows: user.favorite_shows,
        favorite_books: user.favorite_books,
        favorite_genres: user.favorite_genres
      } 
    });
  });
});

// Profile routes
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, username, profile_picture, bio, favorite_movies, favorite_shows, favorite_books, favorite_genres FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(user);
    }
  );
});

app.put('/api/profile', authenticateToken, (req, res) => {
  const { bio, favorite_movies, favorite_shows, favorite_books, favorite_genres } = req.body;
  
  db.run(
    `UPDATE users SET bio = ?, favorite_movies = ?, favorite_shows = ?, favorite_books = ?, favorite_genres = ? WHERE id = ?`,
    [bio, favorite_movies, favorite_shows, favorite_books, favorite_genres, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

app.post('/api/profile/picture', authenticateToken, upload.single('picture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const pictureUrl = `/uploads/${req.file.filename}`;
  
  db.run(
    'UPDATE users SET profile_picture = ? WHERE id = ?',
    [pictureUrl, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating profile picture' });
      }
      res.json({ profile_picture: pictureUrl });
    }
  );
});

// Media routes
app.post('/api/media', authenticateToken, (req, res) => {
  const { title, type, status, rating, review, release_date, total_pages } = req.body;
  
  db.run(
    `INSERT INTO media_items (user_id, title, type, status, rating, review, release_date, total_pages) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, title, type, status, rating, review, release_date, total_pages],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error adding media item' });
      }
      res.json({ id: this.lastID, message: 'Media item added successfully' });
    }
  );
});

app.get('/api/media', authenticateToken, (req, res) => {
  const { status, type, sort_by = 'date_added', sort_order = 'DESC' } = req.query;
  
  let query = 'SELECT * FROM media_items WHERE user_id = ?';
  const params = [req.user.id];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  const validSortFields = ['date_added', 'release_date', 'rating', 'title'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'date_added';
  const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY ${sortField} ${order}`;
  
  db.all(query, params, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching media items' });
    }
    res.json(items);
  });
});

app.put('/api/media/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, type, status, rating, review, release_date, pages_read, is_finished } = req.body;
  
  // Check if item belongs to user
  db.get('SELECT * FROM media_items WHERE id = ? AND user_id = ?', [id, req.user.id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!item) {
      return res.status(404).json({ error: 'Media item not found' });
    }
    
    const wasNotFinished = !item.is_finished;
    const nowFinished = is_finished;
    const date_completed = nowFinished && wasNotFinished ? new Date().toISOString() : item.date_completed;
    
    db.run(
      `UPDATE media_items SET title = ?, type = ?, status = ?, rating = ?, review = ?, 
       release_date = ?, pages_read = ?, is_finished = ?, date_completed = ? WHERE id = ? AND user_id = ?`,
      [title, type, status, rating, review, release_date, pages_read, is_finished ? 1 : 0, date_completed, id, req.user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating media item' });
        }
        
        // Update annual stats if newly finished
        if (nowFinished && wasNotFinished) {
          updateAnnualStats(req.user.id, item.type);
        }
        
        res.json({ message: 'Media item updated successfully' });
      }
    );
  });
});

app.delete('/api/media/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM media_items WHERE id = ? AND user_id = ?', [id, req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting media item' });
    }
    res.json({ message: 'Media item deleted successfully' });
  });
});

// Daily reading progress
app.post('/api/reading/daily', authenticateToken, (req, res) => {
  const { pages } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  db.run(
    `INSERT INTO daily_reading (user_id, date, pages_read) VALUES (?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET pages_read = pages_read + ?`,
    [req.user.id, today, pages, pages],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating daily reading' });
      }
      res.json({ message: 'Daily reading updated successfully' });
    }
  );
});

// Leaderboard routes
app.get('/api/leaderboard/daily-reading', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT u.username, u.profile_picture, dr.pages_read 
     FROM daily_reading dr
     JOIN users u ON dr.user_id = u.id
     WHERE dr.date = ?
     ORDER BY dr.pages_read DESC`,
    [today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching leaderboard' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/leaderboard/annual/:category', authenticateToken, (req, res) => {
  const { category } = req.params;
  const currentYear = new Date().getFullYear();
  
  const validCategories = ['books_read', 'comics_read', 'movies_watched', 'tv_shows_finished'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  
  db.all(
    `SELECT u.username, u.profile_picture, a.${category} as count
     FROM annual_stats a
     JOIN users u ON a.user_id = u.id
     WHERE a.year = ?
     ORDER BY a.${category} DESC`,
    [currentYear],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching leaderboard' });
      }
      res.json(rows);
    }
  );
});

function updateAnnualStats(userId, mediaType) {
  const currentYear = new Date().getFullYear();
  let column;
  
  switch(mediaType) {
    case 'book':
      column = 'books_read';
      break;
    case 'comic':
      column = 'comics_read';
      break;
    case 'movie':
      column = 'movies_watched';
      break;
    case 'tv':
      column = 'tv_shows_finished';
      break;
    default:
      return;
  }
  
  db.run(
    `INSERT INTO annual_stats (user_id, year, ${column}) VALUES (?, ?, 1)
     ON CONFLICT(user_id, year) DO UPDATE SET ${column} = ${column} + 1`,
    [userId, currentYear]
  );
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
