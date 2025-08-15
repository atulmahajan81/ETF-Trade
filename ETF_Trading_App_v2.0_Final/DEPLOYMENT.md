# Deployment Guide

## 🚀 Uploading to GitHub

### Prerequisites
1. **Install Git**: Download from https://git-scm.com/
2. **Install GitHub CLI**: Download from https://cli.github.com/
3. **GitHub Account**: Ensure you have access to https://github.com/atulmahajan81/ETF-Trade

### Method 1: Using Git Commands

```bash
# 1. Initialize Git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: ETF Trading Application"

# 4. Add remote repository
git remote add origin https://github.com/atulmahajan81/ETF-Trade.git

# 5. Push to GitHub
git push -u origin main
```

### Method 2: Using GitHub CLI

```bash
# 1. Login to GitHub
gh auth login

# 2. Initialize repository
gh repo create atulmahajan81/ETF-Trade --public --source=. --remote=origin --push
```

### Method 3: Manual Upload via GitHub Web

1. Go to https://github.com/atulmahajan81/ETF-Trade
2. Click "Add file" → "Upload files"
3. Drag and drop all project files
4. Add commit message: "Initial commit: ETF Trading Application"
5. Click "Commit changes"

## 📁 Files to Upload

### Essential Files
- `README.md` - Project documentation
- `package.json` - Node.js dependencies
- `requirements.txt` - Python dependencies
- `src/` - React frontend source code
- `price_fetcher.py` - MStocks API integration
- `dma_calculator.py` - DMA calculations
- `price_api_server.py` - Flask API server
- `test_python_login.py` - Python API testing
- `.gitignore` - Git ignore rules

### Optional Files
- `MULTI_BROKER_SETUP_GUIDE.md` - Setup documentation
- `DEPLOYMENT.md` - This deployment guide

## 🔧 Post-Upload Setup

### 1. Enable GitHub Pages (Optional)
1. Go to repository Settings
2. Navigate to Pages section
3. Select source: "Deploy from a branch"
4. Choose branch: "main"
5. Select folder: "/ (root)"
6. Click Save

### 2. Set up GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

## 🌐 Deployment Options

### Frontend Deployment

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

#### GitHub Pages
```bash
# Add homepage to package.json
"homepage": "https://atulmahajan81.github.io/ETF-Trade"

# Install gh-pages
npm install --save-dev gh-pages

# Add scripts to package.json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### Backend Deployment

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

#### Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: gunicorn price_api_server:app" > Procfile

# Deploy
heroku create
git push heroku main
```

#### Render
1. Connect GitHub repository
2. Select "Web Service"
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn price_api_server:app`
5. Deploy

## 🔐 Environment Variables

### Frontend (.env)
```
REACT_APP_API_BASE_URL=https://your-backend-url.com
REACT_APP_MSTOCKS_API_URL=https://api.mstock.trade
```

### Backend (.env)
```
FLASK_ENV=production
FLASK_DEBUG=0
```

## 📝 Important Notes

1. **Credentials**: Never commit API keys or credentials
2. **Session Files**: Exclude `*.pkl` files from Git
3. **Environment Variables**: Use deployment platform's env var system
4. **CORS**: Configure CORS for production domains
5. **HTTPS**: Ensure all production URLs use HTTPS

## 🆘 Troubleshooting

### Common Issues
- **Git not found**: Install Git from https://git-scm.com/
- **Authentication failed**: Use GitHub CLI or personal access token
- **Build fails**: Check Node.js and Python versions
- **CORS errors**: Update CORS configuration for production

### Support
- GitHub Issues: Create issue in repository
- Documentation: Check README.md
- Deployment logs: Check platform-specific logs

---

**Ready to deploy!** Choose the method that works best for your setup. 