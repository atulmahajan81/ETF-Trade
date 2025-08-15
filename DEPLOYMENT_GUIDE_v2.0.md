# Deployment Guide - Version 2.0 Final

## 🚀 **Production Deployment Guide**

### 📋 **Prerequisites**

Before deploying ETF Trading Application v2.0 Final, ensure you have:

- ✅ **Node.js 16+** installed
- ✅ **npm 8+** or **yarn** package manager
- ✅ **Git** for version control
- ✅ **Python 3.8+** (for backend API server)
- ✅ **Web hosting account** (Vercel, Netlify, AWS, etc.)

---

## 🏗️ **Build Process**

### **1. Frontend Build**

```bash
# Navigate to project directory
cd src

# Install dependencies
npm install

# Create production build
npm run build

# The build will be created in the 'build' folder
```

### **2. Backend Setup**

```bash
# Navigate to backend directory
cd ../backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python price_api_server.py
```

---

## 🌐 **Hosting Options**

### **Option 1: Vercel (Recommended)**

#### **Setup Steps:**
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd src
   vercel
   ```

3. **Configure Environment Variables:**
   ```bash
   vercel env add REACT_APP_API_URL
   vercel env add REACT_APP_MARKET_HOURS_START
   vercel env add REACT_APP_MARKET_HOURS_END
   ```

#### **Vercel Configuration (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/manifest.json",
      "dest": "/manifest.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### **Option 2: Netlify**

#### **Setup Steps:**
1. **Connect Repository:**
   - Link your GitHub repository to Netlify
   - Set build command: `cd src && npm run build`
   - Set publish directory: `src/build`

2. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-api-domain.com
   REACT_APP_MARKET_HOURS_START=915
   REACT_APP_MARKET_HOURS_END=1530
   ```

3. **Netlify Configuration (netlify.toml):**
   ```toml
   [build]
     base = "src"
     command = "npm run build"
     publish = "build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### **Option 3: AWS S3 + CloudFront**

#### **Setup Steps:**
1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-etf-trading-app
   ```

2. **Upload Build Files:**
   ```bash
   aws s3 sync src/build s3://your-etf-trading-app
   ```

3. **Configure CloudFront:**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom error pages for SPA routing

4. **Environment Variables:**
   - Set environment variables in your deployment process

### **Option 4: Heroku**

#### **Setup Steps:**
1. **Create Heroku App:**
   ```bash
   heroku create your-etf-trading-app
   ```

2. **Configure Buildpacks:**
   ```bash
   heroku buildpacks:set mars/create-react-app
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **Set Environment Variables:**
   ```bash
   heroku config:set REACT_APP_API_URL=https://your-api-domain.com
   heroku config:set REACT_APP_MARKET_HOURS_START=915
   heroku config:set REACT_APP_MARKET_HOURS_END=1530
   ```

---

## ⚙️ **Environment Configuration**

### **Required Environment Variables**

```bash
# API Configuration
REACT_APP_API_URL=https://your-api-domain.com

# Market Hours (IST)
REACT_APP_MARKET_HOURS_START=915
REACT_APP_MARKET_HOURS_END=1530

# Optional: Analytics
REACT_APP_GA_TRACKING_ID=your-ga-tracking-id

# Optional: Sentry Error Tracking
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

### **Environment-Specific Configurations**

#### **Development (.env.development):**
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MARKET_HOURS_START=915
REACT_APP_MARKET_HOURS_END=1530
NODE_ENV=development
```

#### **Production (.env.production):**
```bash
REACT_APP_API_URL=https://your-production-api.com
REACT_APP_MARKET_HOURS_START=915
REACT_APP_MARKET_HOURS_END=1530
NODE_ENV=production
```

---

## 🔧 **Backend Deployment**

### **Python Flask Server**

#### **Option 1: Heroku**
```bash
# Create requirements.txt
pip freeze > requirements.txt

# Create Procfile
echo "web: python price_api_server.py" > Procfile

# Deploy to Heroku
heroku create your-etf-api
git push heroku main
```

#### **Option 2: AWS EC2**
```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip nginx

# Clone repository
git clone your-repo
cd your-repo

# Install Python dependencies
pip3 install -r requirements.txt

# Setup systemd service
sudo nano /etc/systemd/system/etf-api.service
```

**Systemd Service Configuration:**
```ini
[Unit]
Description=ETF Trading API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/your-repo
Environment=PATH=/home/ubuntu/your-repo/venv/bin
ExecStart=/home/ubuntu/your-repo/venv/bin/python price_api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

#### **Option 3: DigitalOcean App Platform**
1. Connect your GitHub repository
2. Select Python as runtime
3. Set build command: `pip install -r requirements.txt`
4. Set run command: `python price_api_server.py`

---

## 🔒 **Security Configuration**

### **HTTPS Setup**
- ✅ **SSL Certificate**: Install SSL certificate for your domain
- ✅ **HTTPS Redirect**: Configure automatic HTTPS redirect
- ✅ **Security Headers**: Set up security headers

### **CORS Configuration**
```python
# In your Flask app
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://your-frontend-domain.com'])
```

### **API Security**
```python
# Rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

---

## 📊 **Monitoring & Analytics**

### **Error Tracking (Sentry)**
```javascript
// In your React app
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### **Performance Monitoring**
```javascript
// Google Analytics
import ReactGA from 'react-ga';

ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
```

### **Health Checks**
```python
# Add health check endpoint
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
```

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- ✅ **Code Review**: All code reviewed and tested
- ✅ **Environment Variables**: All required variables set
- ✅ **API Endpoints**: Backend API deployed and tested
- ✅ **Database**: Database configured and accessible
- ✅ **SSL Certificate**: HTTPS certificate installed

### **Deployment**
- ✅ **Build Process**: Production build created successfully
- ✅ **File Upload**: All files uploaded to hosting platform
- ✅ **Domain Configuration**: Domain pointing to correct location
- ✅ **Environment Variables**: All variables configured
- ✅ **CORS Settings**: Cross-origin requests configured

### **Post-Deployment**
- ✅ **Functionality Test**: All features working correctly
- ✅ **Performance Test**: Load times within acceptable limits
- ✅ **Security Test**: Security headers and HTTPS working
- ✅ **Mobile Test**: Responsive design working on mobile
- ✅ **Browser Test**: Compatibility across major browsers

---

## 🔄 **Continuous Deployment**

### **GitHub Actions Workflow**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: |
        cd src
        npm install
        
    - name: Build
      run: |
        cd src
        npm run build
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./src
```

---

## 📈 **Performance Optimization**

### **Build Optimization**
```javascript
// webpack.config.js optimizations
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

### **CDN Configuration**
- ✅ **Static Assets**: Serve static assets from CDN
- ✅ **Caching**: Configure proper caching headers
- ✅ **Compression**: Enable gzip compression
- ✅ **Image Optimization**: Optimize images for web

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **API Connection Issues**
```bash
# Check API server status
curl https://your-api-domain.com/health

# Check CORS configuration
# Verify environment variables
```

#### **Performance Issues**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for memory leaks
# Monitor API response times
```

---

## 📞 **Support**

For deployment issues or questions:
- 📧 **Email**: support@your-domain.com
- 📚 **Documentation**: https://your-docs-domain.com
- 🐛 **Bug Reports**: GitHub Issues

---

**🎉 Version 2.0 Final - Ready for Production! 🎉**

*Deploy with confidence - Built for scale and performance* 