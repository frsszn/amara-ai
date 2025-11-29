# Amara AI - Quick Start Guide

## 🚀 Live Application URLs

- **Frontend**: https://amara-frontend-av4zyrs6ya-et.a.run.app
- **Backend API**: https://amara-backend-997736185431.asia-southeast2.run.app
- **API Docs**: https://amara-backend-997736185431.asia-southeast2.run.app/api/v1/docs

## 🔐 Test Login Credentials

```
Email: test@amara.ai
Password: test123
```

## 📝 First Time Setup

### 1. Create Test User (Run Once)

```bash
cat backend/scripts/create_test_user.sql | \
  gcloud sql connect amara-db \
  --user=amara_user \
  --database=amara_db
```

Enter password when prompted, then the SQL will create the test user.

### 2. Access the Application

1. Go to: https://amara-frontend-av4zyrs6ya-et.a.run.app/login
2. Login with: `test@amara.ai` / `test123`
3. Explore the dashboard with live data from PostgreSQL

## ✅ What's Deployed

### Backend (FastAPI)

- ✅ Cloud Run service in asia-southeast2
- ✅ Connected to Cloud SQL PostgreSQL
- ✅ CORS enabled for both frontend URLs
- ✅ ML model inference ready
- ✅ Gemini AI integration active

### Frontend (Next.js)

- ✅ Cloud Run service in asia-southeast2
- ✅ Hardcoded backend URL (no env var issues)
- ✅ All pages use live API data
- ✅ No mock data dependencies

### Database

- ✅ Cloud SQL PostgreSQL instance
- ✅ Schema deployed
- ✅ Ready for data import

## 🔧 Recent Fixes

1. **Removed Mock Data** - All frontend pages now fetch from live API
2. **Fixed CORS** - Backend allows requests from both frontend URLs
3. **Hardcoded API URL** - Frontend has backend URL directly in code
4. **Sklearn Compatibility** - Added patch for model version differences
5. **Docker Configuration** - Fixed CMD and port settings for Cloud Run

## 📊 Available Features

- ✅ User authentication (JWT-based)
- ✅ Borrower management with search
- ✅ Credit assessment history
- ✅ ML-powered risk scoring
- ✅ Real-time data updates
- ✅ Responsive UI with loading states

## 🐛 Troubleshooting

### Cannot Login

- Make sure you've created the test user using the SQL script above
- Check backend is accessible: https://amara-backend-997736185431.asia-southeast2.run.app/health
- Verify CORS in browser console

### No Data Showing

- Database may be empty - import sample data if needed
- Check API responses in browser DevTools Network tab

### CORS Errors

- Backend has been configured to allow both frontend URLs
- If still seeing errors, backend may still be deploying

## 📚 Next Steps

1. Import borrower and loan data into database
2. Run credit assessments via the API
3. Create additional users as needed
4. Monitor logs in Cloud Run console
5. Set up Cloud Monitoring alerts

## 🔄 Redeploy Commands

### Frontend

```bash
cd frontend
gcloud run deploy amara-frontend \
  --source . \
  --region=asia-southeast2 \
  --allow-unauthenticated
```

### Backend

```bash
cd backend
gcloud run deploy amara-backend \
  --source . \
  --region=asia-southeast2 \
  --allow-unauthenticated
```

## 📞 Support

- Check Cloud Run logs for detailed error messages
- Use `/health` and `/health/db` endpoints to verify backend status
- API documentation available at `/api/v1/docs`
