# GPA Tracker

A modern, full-stack GPA tracking application with authentication, database storage, and cross-device synchronization. Built with React, Node.js, Express, and MongoDB.

## Features

- 🔐 **User Authentication**: Secure login/registration with JWT tokens
- 📊 **GPA Tracking**: Add, edit, and manage courses with automatic GPA calculation
- 📱 **Responsive Design**: Works seamlessly across all devices
- 🎯 **Multiple GPA Scales**: Support for 4.0, 5.0, and 10.0 GPA scales
- 📈 **Visual Analytics**: Charts and graphs showing GPA trends over time
- 🏫 **Academic Organization**: Categorize courses by subject area
- 🔄 **Real-time Sync**: Data automatically syncs across all devices
- 🎨 **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS

## Tech Stack

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend

- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart components
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/justinlam6/GPATracker.git
   cd GPATracker
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/gpa-tracker
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   ```

   For MongoDB Atlas, use:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gpa-tracker
   ```

4. **Run the application**

   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend client (port 3000).

## Usage

### Getting Started

1. **Register an Account**: Create a new account with your email and password
2. **Complete Profile**: Add your institution, graduation year, and preferred GPA scale
3. **Add Courses**: Start adding your courses with grades and credits
4. **Track Progress**: Monitor your GPA trends and academic performance

### Adding Courses

- **Course Name**: Full name of the course
- **Course Code**: Optional course identifier (e.g., CS101)
- **Credits**: Number of credit hours (0.5 to 10)
- **Grade**: Letter grade (A+ through F, P/NP, W, I)
- **Semester**: Fall, Spring, Summer, or Winter
- **Year**: Academic year
- **Category**: Subject area classification
- **Notes**: Additional information about the course

## Deployment

This app is configured for easy deployment to Railway, Vercel, or similar platforms.

### Quick Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables:
   ```env
   MONGODB_URI=your-mongodb-atlas-connection-string
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   ```
5. Deploy! 🚀

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/gpa/courses` - Get user's courses
- `POST /api/gpa/courses` - Add new course
- `GET /api/gpa/summary` - Get GPA summary

## License

This project is licensed under the MIT License.

---

**Built with ❤️ for students and educators**