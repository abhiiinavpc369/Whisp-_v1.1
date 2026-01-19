# Whisp Production Deployment Guide

This guide outlines the steps to deploy the Whisp application to production using Vercel for the frontend and Railway for the backend.

## Prerequisites

- GitHub repository for the project
- MongoDB Atlas account with a production database
- Vercel account
- Railway account

## Backend Deployment (Railway)

1. **Prepare Backend for Production**:
   - Copy `backend/.env.example` to `backend/.env` and fill in production values:
     - MONGO_URI: Your MongoDB Atlas connection string
     - JWT_SECRET: Generate a strong secret (e.g., 64 characters)
     - SESSION_SECRET: Generate a strong secret
     - FRONTEND_URL: Set to your production frontend URL (e.g., https://whisp.vercel.app)
     - PORT: Set by Railway automatically
     - NODE_ENV: production
     - REDIS_URL: Optional, for scaling Socket.io

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Deploy to Railway**:
   - Connect your GitHub repository to Railway
   - Set environment variables in Railway dashboard
   - Deploy the backend
   - Note the production backend URL (e.g., https://whisp-backend.up.railway.app)

## Frontend Deployment (Vercel)

1. **Prepare Frontend for Production**:
   - Update `frontend/.env.production`:
     - REACT_APP_API_BASE_URL: Set to your production backend URL (e.g., https://whisp-backend.up.railway.app)

2. **Build the Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard (or use .env.production)
   - Deploy the frontend
   - Note the production frontend URL

## Post-Deployment Configuration

1. **Update CORS**: Ensure the backend's FRONTEND_URL matches the Vercel domain
2. **MongoDB Security**: Whitelist Railway's IP ranges in MongoDB Atlas if required
3. **SSL Certificates**: Handled automatically by hosting platforms
4. **DNS**: Point custom domain to Vercel/Railway if needed

## Scaling Considerations

- **Database**: MongoDB Atlas handles scaling; monitor connection limits
- **Socket.io**: Use Redis adapter for multiple backend instances (add REDIS_URL env var)
- **Backend**: Railway supports horizontal scaling
- **Frontend**: Vercel provides global CDN

## Monitoring and Maintenance

- Monitor Railway logs for errors
- Set up alerts for downtime
- Regularly update dependencies for security
- Backup MongoDB Atlas data

## Testing

End-to-end tests are implemented using Cypress to cover critical user flows: user login, creating/joining conversations, sending messages, uploading files, and profile settings.

To run tests locally:
- Ensure backend and frontend are running
- Run `cd frontend && npm run cypress:run`

Tests are automatically run in CI/CD pipeline on GitHub Actions for every push and pull request.

## Troubleshooting

- Check environment variables are set correctly
- Verify CORS settings allow frontend domain
- Ensure MongoDB connection strings are correct
- Test Socket.io connections after deployment