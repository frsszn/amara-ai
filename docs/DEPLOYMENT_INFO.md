# Amara AI - Deployment Information

## 🚀 Live URLs

- **Frontend**: https://amara-frontend-av4zyrs6ya-et.a.run.app
- **Backend API**: https://amara-backend-av4zyrs6ya-et.a.run.app
- **API Documentation**: https://amara-backend-av4zyrs6ya-et.a.run.app/api/v1/docs

## 🔐 Test Login Credentials

```
Email: test@amara.ai
Password: test123
```

## 📊 Database

- **Instance**: amara-db
- **Region**: asia-southeast2 (Jakarta)
- **Database**: amara_db
- **User**: amara_user

## ✅ Deployment Status

### Backend (FastAPI)

- ✅ Deployed to Cloud Run
- ✅ Connected to Cloud SQL PostgreSQL
- ✅ CORS configured for frontend
- ✅ ML model inference enabled
- ✅ Gemini AI integration active
- ✅ Health checks passing

### Frontend (Next.js)

- ✅ Deployed to Cloud Run
- ✅ Connected to backend API
- ✅ Environment variables configured
- ✅ Authentication working
- ✅ Real-time data from PostgreSQL

## 🔧 Recent Fixes Applied

1. **Database Migration**

   - Removed all mock data dependencies
   - Updated all pages to fetch from live API
   - Added proper error handling and loading states

2. **CORS Configuration**

   - Updated backend to allow requests from new frontend URL
   - Fixed CORS origins in `backend/app/core/config.py`

3. **Environment Variables**

   - Frontend: `NEXT_PUBLIC_API_URL` pointing to backend
   - Backend: Database connection via Cloud SQL connector

4. **Dockerfile Updates**

   - Frontend: Fixed CMD to use `node server.js` for standalone output
   - Frontend: Changed port from 3000 to 8080 for Cloud Run

5. **sklearn Compatibility**
   - Added compatibility patch in `ml_inference.py` for model version differences

## 📝 API Endpoints

### Authentication

- POST `/api/v1/auth/login/json` - Login with email/password
- POST `/api/v1/auth/register` - Register new user
- GET `/api/v1/auth/me` - Get current user info
- POST `/api/v1/auth/logout` - Logout

### Dashboard

- GET `/api/v1/dashboard/stats` - Get dashboard statistics
- GET `/api/v1/borrowers` - List all borrowers
- GET `/api/v1/assessments` - List all credit assessments

### Health Checks

- GET `/health` - Basic health check
- GET `/health/db` - Database connectivity check

## 🔄 Redeployment Commands

### Backend

```bash
cd backend
gcloud run deploy amara-backend \
  --source . \
  --region=asia-southeast2 \
  --allow-unauthenticated
```

### Frontend

```bash
cd frontend
gcloud run deploy amara-frontend \
  --source . \
  --region=asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://amara-backend-av4zyrs6ya-et.a.run.app/api/v1"
```

## 📦 Database Management

### Create Test User

```bash
cat backend/scripts/create_test_user.sql | \
  gcloud sql connect amara-db \
  --user=amara_user \
  --database=amara_db
```

### Connect to Database

```bash
gcloud sql connect amara-db \
  --user=amara_user \
  --database=amara_db
```

## 🎯 Features Working

- ✅ User authentication and authorization
- ✅ Borrower management with search
- ✅ Credit assessment history
- ✅ ML-powered risk scoring
- ✅ Gemini AI integration for NLP analysis
- ✅ Real-time data updates
- ✅ Responsive UI with loading states
- ✅ Error handling and validation

## 🔐 Security Notes

- JWT tokens expire after 24 hours
- All passwords are bcrypt hashed
- Database uses SSL connections
- CORS restricted to specific origins
- Environment variables managed via Secret Manager

## 📈 Next Steps

1. Create additional users via the database or API
2. Import borrower and loan data
3. Run credit assessments
4. Monitor application logs in Cloud Run
5. Set up Cloud Monitoring alerts

## 🐛 Troubleshooting

### Frontend shows "Failed to load resource"

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is deployed and healthy

### Database connection errors

- Verify Cloud SQL instance is running
- Check database credentials in Secret Manager
- Ensure Cloud SQL connector is configured

### Authentication issues

- Verify user exists in database
- Check password hash is correct
- Confirm JWT_SECRET_KEY is set

## 📞 Support

For issues or questions, check:

- Application logs: Cloud Run console
- Database logs: Cloud SQL console
- API documentation: `/api/v1/docs` endpoint
