# ☁️ GCP Deployment Guide for Kartr

This guide provides step-by-step instructions to containerize and deploy the Kartr application to Google Cloud Platform (GCP).

## 🛠 Prerequisites

1.  **Google Cloud SDK**: Install and initialize the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Docker**: Ensure Docker is installed and running on your local machine.
3.  **GCP Project**: A registered GCP project with billing enabled.

---

## 🏗 Phase 1: Local Setup & Authentication

1.  **Login to GCP**:
    ```bash
    gcloud auth login
    gcloud auth configure-docker us-central1-docker.pkg.dev
    ```

2.  **Set Project ID**:
    ```bash
    gcloud config set project kartr-484816
    export PROJECT_ID=kartr-484816
    ```

3.  **Enable Required APIs**:
    ```bash
    gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com
    ```

---

## 📦 Phase 2: Artifact Registry Setup

Create a repository to store your Docker images:

```bash
gcloud artifacts repositories create kartr-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for Kartr services"
```

---

## 🏗 Phase 3: Build and Push Images (Cloud Build)

We will use Google Cloud Build to build the images directly in the cloud. This avoids issues with local Docker installations.

### 1. Build & Push Backend
Navigate to the root directory of the project:

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/kartr-484816/kartr-repo/backend:latest ./fastapi_backend --project kartr-484816
```

### 2. Build & Push Frontend
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/kartr-484816/kartr-repo/frontend:latest ./bun_frontend --project kartr-484816
```

---

## 🌐 Phase 4: Deploy to Cloud Run

### 1. Deploy Backend
```bash
gcloud run deploy kartr-backend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/kartr-repo/backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="GEMINI_API_KEY=[YOUR_KEY],YOUTUBE_API_KEY=[YOUR_KEY],FIREBASE_PROJECT_ID=[YOUR_ID]"
```
> [!NOTE]
> Copy the Service URL provided after deployment (e.g., `https://kartr-backend-xyz.a.run.app`).

### 2. Deploy Frontend
```bash
gcloud run deploy kartr-frontend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/kartr-repo/frontend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="BACKEND_API_URL=[YOUR_BACKEND_URL_FROM_PREVIOUS_STEP]"
```

---

## ✅ Phase 5: Verification

1.  Open the **Frontend URL** in your browser.
2.  Check the **Network** tab to ensure API calls are reaching the backend URL.
3.  Verify that all features (AI analysis, Dashboard) are functioning correctly.
