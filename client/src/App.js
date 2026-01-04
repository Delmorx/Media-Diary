import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

// Auth Context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Login/Register Component
function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { email, password, username };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}

// Main Menu Component
function MainMenu() {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Media Diary</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.username}!</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '800px' }}>
        <Link to="/settings" style={{ padding: '40px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Settings</h3>
          <p>Update your profile</p>
        </Link>
        <Link to="/diary" style={{ padding: '40px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>The Diary</h3>
          <p>Your watchlists & logs</p>
        </Link>
        <Link to="/leaderboards" style={{ padding: '40px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Leaderboards</h3>
          <p>See rankings</p>
        </Link>
      </div>
    </div>
  );
}

// Settings Component
function Settings() {
  const { user, token, fetchProfile } = React.useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [favoriteMovies, setFavoriteMovies] = useState('');
  const [favoriteShows, setFavoriteShows] = useState('');
  const [favoriteBooks, setFavoriteBooks] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState('');
  const [picture, setPicture] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setFavoriteMovies(user.favorite_movies || '');
      setFavoriteShows(user.favorite_shows || '');
      setFavoriteBooks(user.favorite_books || '');
      setFavoriteGenres(user.favorite_genres || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio, favorite_movies: favoriteMovies, favorite_shows: favoriteShows, favorite_books: favoriteBooks, favorite_genres: favoriteGenres })
      });

      if (res.ok) {
        setMessage('Profile updated!');
        fetchProfile();
      }
    } catch (err) {
      setMessage('Error updating profile');
    }
  };

  const handlePictureUpload = async (e) => {
    e.preventDefault();
    if (!picture) return;

    const formData = new FormData();
    formData.append('picture', picture);

    try {
      const res = await fetch(`${API_URL}/api/profile/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setMessage('Picture updated!');
        fetchProfile();
      }
    } catch (err) {
      setMessage('Error uploading picture');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link to="/">← Back to Menu</Link>
      <h2>Settings</h2>
      {message && <div style={{ color: 'green', marginBottom: '10px' }}>{message}</div>}
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Profile Picture</h3>
        {user?.profile_picture && (
          <img src={`${API_URL}${user.profile_picture}`} alt="Profile" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
        )}
        <form onSubmit={handlePictureUpload} style={{ marginTop: '10px' }}>
          <input type="file" accept="image/*" onChange={(e) => setPicture(e.target.files[0])} />
          <button type="submit">Upload</button>
        </form>
      </div>

      <form onSubmit={handleProfileUpdate}>
        <div style={{ marginBottom: '15px' }}>
          <label>Bio / Favorite Rankings:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your bio and rankings..."
            style={{ width: '100%', height: '100px', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Favorite Movies (comma separated):</label>
          <input
            type="text"
            value={favoriteMovies}
            onChange={(e) => setFavoriteMovies(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Favorite Shows (comma separated):</label>
          <input
            type="text"
            value={favoriteShows}
            onChange={(e) => setFavoriteShows(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Favorite Books (comma separated):</label>
          <input
            type="text"
            value={favoriteBooks}
            onChange={(e) => setFavoriteBooks(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Favorite Genres (comma separated):</label>
          <input
            type="text"
            value={favoriteGenres}
            onChange={(e) => setFavoriteGenres(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}

// Diary Menu Component
function DiaryMenu() {
  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Back to Menu</Link>
      <h2>The Diary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', marginTop: '20px' }}>
        <Link to="/diary/watchlist" style={{ padding: '30px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Watchlist</h3>
        </Link>
        <Link to="/diary/readlist" style={{ padding: '30px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Readlist</h3>
        </Link>
        <Link to="/diary/watchlog" style={{ padding: '30px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Watch Log</h3>
        </Link>
        <Link to="/diary/readlog" style={{ padding: '30px', border: '1px solid #ccc', textAlign: 'center', textDecoration: 'none', color: 'black' }}>
          <h3>Reading Log</h3>
        </Link>
      </div>
    </div>
  );
}

// Media List Component (reusable for all lists)
function MediaList({ status, types, title }) {
  const { token } = React.useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState(types[0]);
  const [formRating, setFormRating] = useState('');
  const [formReview, setFormReview] = useState('');
  const [formReleaseDate, setFormReleaseDate] = useState('');
  const [formTotalPages, setFormTotalPages] = useState('');
  const [formPagesRead, setFormPagesRead] = useState('');
  const [formIsFinished, setFormIsFinished] = useState(false);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams({ status, sort_by: sortBy, sort_order: sortOrder });
      const res = await fetch(`${API_URL}/api/media?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.filter(item => types.includes(item.type)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          type: formType,
          status,
          rating: formRating ? parseFloat(formRating) : null,
          review: formReview,
          release_date: formReleaseDate,
          total_pages: formTotalPages ? parseInt(formTotalPages) : null
        })
      });

      if (res.ok) {
        resetForm();
        fetchItems();
        setShowAddForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/media/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          type: formType,
          status,
          rating: formRating ? parseFloat(formRating) : null,
          review: formReview,
          release_date: formReleaseDate,
          pages_read: formPagesRead ? parseInt(formPagesRead) : 0,
          is_finished: formIsFinished
        })
      });

      if (res.ok) {
        resetForm();
        fetchItems();
        setEditingItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await fetch(`${API_URL}/api/media/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormRating(item.rating || '');
    setFormReview(item.review || '');
    setFormReleaseDate(item.release_date || '');
    setFormTotalPages(item.total_pages || '');
    setFormPagesRead(item.pages_read || '');
    setFormIsFinished(item.is_finished === 1);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormType(types[0]);
    setFormRating('');
    setFormReview('');
    setFormReleaseDate('');
    setFormTotalPages('');
    setFormPagesRead('');
    setFormIsFinished(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/diary">← Back to Diary</Link>
      <h2>{title}</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>Sort by: </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginRight: '10px' }}>
          <option value="date_added">Date Added</option>
          <option value="release_date">Release Date</option>
          <option value="rating">Rating</option>
          <option value="title">Title</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="DESC">Descending</option>
          <option value="ASC">Ascending</option>
        </select>
      </div>

      <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: '20px' }}>
        {showAddForm ? 'Cancel' : 'Add New'}
      </button>

      {(showAddForm || editingItem) && (
        <form onSubmit={editingItem ? handleEdit : handleAdd} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
          <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Rating (0-5)"
              value={formRating}
              onChange={(e) => setFormRating(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Review (optional)"
              value={formReview}
              onChange={(e) => setFormReview(e.target.value)}
              style={{ width: '100%', padding: '8px', height: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="date"
              placeholder="Release Date"
              value={formReleaseDate}
              onChange={(e) => setFormReleaseDate(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          {types.includes('book') || types.includes('comic') ? (
            <>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="number"
                  placeholder="Total Pages"
                  value={formTotalPages}
                  onChange={(e) => setFormTotalPages(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              {editingItem && (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="number"
                      placeholder="Pages Read"
                      value={formPagesRead}
                      onChange={(e) => setFormPagesRead(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formIsFinished}
                        onChange={(e) => setFormIsFinished(e.target.checked)}
                      />
                      {' '}Finished
                    </label>
                  </div>
                </>
              )}
            </>
          ) : editingItem && (
            <div style={{ marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={formIsFinished}
                  onChange={(e) => setFormIsFinished(e.target.checked)}
                />
                {' '}Finished
              </label>
            </div>
          )}
          <button type="submit">{editingItem ? 'Update' : 'Add'}</button>
          {editingItem && (
            <button type="button" onClick={() => { setEditingItem(null); resetForm(); }} style={{ marginLeft: '10px' }}>
              Cancel
            </button>
          )}
        </form>
      )}

      <div>
        {items.length === 0 ? (
          <p>No items yet.</p>
        ) : (
          items.map(item => (
            <div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
              <h3>{item.title}</h3>
              <p><strong>Type:</strong> {item.type}</p>
              {item.rating && <p><strong>Rating:</strong> {item.rating} / 5</p>}
              {item.review && <p><strong>Review:</strong> {item.review}</p>}
              {item.release_date && <p><strong>Release Date:</strong> {item.release_date}</p>}
              {item.total_pages && <p><strong>Pages:</strong> {item.pages_read || 0} / {item.total_pages}</p>}
              {item.is_finished === 1 && <p><strong>Status:</strong> Finished</p>}
              <button onClick={() => startEdit(item)}>Edit</button>
              <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '10px' }}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Leaderboards Component
function Leaderboards() {
  const { token } = React.useContext(AuthContext);
  const [dailyReading, setDailyReading] = useState([]);
  const [booksRead, setBooksRead] = useState([]);
  const [comicsRead, setComicsRead] = useState([]);
  const [moviesWatched, setMoviesWatched] = useState([]);
  const [tvShows, setTvShows] = useState([]);

  useEffect(() => {
    fetchLeaderboards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const [daily, books, comics, movies, tv] = await Promise.all([
        fetch(`${API_URL}/api/leaderboard/daily-reading`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/leaderboard/annual/books_read`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/leaderboard/annual/comics_read`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/leaderboard/annual/movies_watched`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/leaderboard/annual/tv_shows_finished`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]);

      setDailyReading(daily);
      setBooksRead(books);
      setComicsRead(comics);
      setMoviesWatched(movies);
      setTvShows(tv);
    } catch (err) {
      console.error(err);
    }
  };

  const LeaderboardSection = ({ title, data, label }) => (
    <div style={{ marginBottom: '30px' }}>
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Rank</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>User</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>{label}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{index + 1}</td>
                <td style={{ padding: '10px' }}>{item.username}</td>
                <td style={{ textAlign: 'right', padding: '10px' }}>{item.pages_read || item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/">← Back to Menu</Link>
      <h2>Leaderboards</h2>
      
      <LeaderboardSection title="Pages Read Today (Resets Daily)" data={dailyReading} label="Pages" />
      <LeaderboardSection title="Books Read This Year" data={booksRead} label="Books" />
      <LeaderboardSection title="Comics Read This Year" data={comicsRead} label="Comics" />
      <LeaderboardSection title="Movies Watched This Year" data={moviesWatched} label="Movies" />
      <LeaderboardSection title="TV Shows Finished This Year" data={tvShows} label="Shows" />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { token } = React.useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><MainMenu /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><DiaryMenu /></ProtectedRoute>} />
          <Route path="/diary/watchlist" element={<ProtectedRoute><MediaList status="watchlist" types={['movie', 'tv']} title="Watchlist" /></ProtectedRoute>} />
          <Route path="/diary/readlist" element={<ProtectedRoute><MediaList status="readlist" types={['book', 'comic']} title="Readlist" /></ProtectedRoute>} />
          <Route path="/diary/watchlog" element={<ProtectedRoute><MediaList status="watched" types={['movie', 'tv']} title="Watch Log" /></ProtectedRoute>} />
          <Route path="/diary/readlog" element={<ProtectedRoute><MediaList status="read" types={['book', 'comic']} title="Reading Log" /></ProtectedRoute>} />
          <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;