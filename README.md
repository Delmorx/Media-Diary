# Media Diary - Personal Review Platform

A full-stack web application for tracking and reviewing movies, TV shows, books, and comics with friends.

## Features

- User authentication (register/login)
- Profile management with profile pictures
- Watchlist & Readlist for media you plan to consume
- Watch Log & Reading Log for reviewed media
- 5-star rating system with decimal support
- Written reviews
- Sortable by date added, release date, and rating
- Leaderboards:
  - Daily pages read (resets daily)
  - Books read (annual)
  - Comics read (annual)
  - Movies watched (annual)
  - TV shows finished (annual)

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite
- **Frontend**: React
- **Auth**: JWT + bcrypt

## Local Development Setup

### Prerequisites
- Node.js 18+ installed
- npm installed

### Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

### Running Locally

1. Start the backend server (runs on port 3001):
```bash
npm start
```

2. In a new terminal, start the React frontend (runs on port 3000):
```bash
cd client
npm start
```

3. Open http://localhost:3000 in your browser

## Deploying to Render

### Step 1: Prepare Your Repository

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub:
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [Render.com](https://render.com) and sign up/login

2. Click "New +" and select "Web Service"

3. Connect your GitHub repository

4. Configure the service:
   - **Name**: media-diary (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

5. Add Environment Variables:
   - `JWT_SECRET`: Create a strong random string (e.g., use a password generator)
   - `NODE_ENV`: `production`

6. Click "Create Web Service"

7. Wait for the deployment to complete (first deploy takes ~5-10 minutes)

8. Your app will be live at: `https://your-app-name.onrender.com`

### Important Notes for Render:

- The free tier spins down after 15 minutes of inactivity, so first load might be slow
- SQLite database will persist on the disk (but be aware free tier has storage limits)
- Profile pictures are stored locally and will persist with the disk storage

## Environment Variables

Create a `.env` file for local development (optional):

```
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
```

For production on Render, set these in the Render dashboard.

## Database Schema

The app uses SQLite with the following tables:
- `users` - User accounts and profiles
- `media_items` - All watchlist/readlist items and logs
- `daily_reading` - Daily reading progress tracking
- `annual_stats` - Yearly statistics for leaderboards

## API Endpoints

### Auth
- `POST /api/register` - Create new account
- `POST /api/login` - Login

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/picture` - Upload profile picture

### Media
- `POST /api/media` - Add media item
- `GET /api/media` - Get media items (with filters)
- `PUT /api/media/:id` - Update media item
- `DELETE /api/media/:id` - Delete media item

### Leaderboards
- `GET /api/leaderboard/daily-reading` - Daily pages read
- `GET /api/leaderboard/annual/:category` - Annual stats

## Usage Tips

1. **Adding Media**: Use the "Add New" button in any list view
2. **Rating**: Use decimals (e.g., 4.5) for precise ratings
3. **Finishing Items**: Check the "Finished" box to move items to logs and update leaderboards
4. **Sorting**: Change sort options to view by date added, release date, or rating
5. **Leaderboards**: Stats reset daily for pages read, annually for books/comics/movies/shows

## Troubleshooting

**Database locked error**: Stop and restart the server

**Port already in use**: Change the PORT in .env or kill the process using that port

**Profile pictures not loading**: Ensure the `uploads/` directory exists and has write permissions

## Future Enhancements

- Add search functionality
- Import from IMDb/Goodreads
- Social features (follow friends, see their reviews)
- Recommendations based on ratings
- Export data to CSV
- Dark mode
- Mobile app

## License

MIT
