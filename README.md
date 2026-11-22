# SmartNotes – AI-Powered Intelligent Note Generation and Learning Platform

SmartNotes is an AI-powered learning platform designed to transform lecture recordings and study topics into structured, understandable, and revision-friendly notes.

The platform combines speech transcription, Natural Language Processing (NLP), and Large Language Models (LLMs) to help students convert learning materials into meaningful study resources.

Rather than simply generating summaries, SmartNotes aims to make learning easier through concept-based explanations, important keyword extraction, examples, visual representations, and self-assessment.

## Key Features

### 1. Lecture Mode
- Upload audio and video lecture recordings.
- Extract audio from supported media formats.
- Convert speech into text using Faster-Whisper.
- Analyze transcribed content using NLP techniques.
- Generate educational notes using Google's Gemini AI.
- Preserve the connection between the original lecture and generated notes.

### 2. Study Mode
- Generate notes directly from a given topic or subject.
- Supports different learning approaches:
  - **Structured Style:** Organizes information into clearly defined sections and learning categories.
  - **Guided Style:** Presents concepts through simpler, connected explanations intended to improve conceptual understanding.
- Supports different learning levels.
- Uses NLP-assisted text analysis to identify important concepts and keywords.

### 3. Intelligent NLP Processing
- Sentence segmentation.
- Text preprocessing and normalization.
- TF-IDF-based keyword relevance analysis.
- Important term and concept identification.
- Content analysis to support more relevant note generation.

### 4. Learning and Revision Support
- Concept-based explanations.
- Important keywords and terminology.
- Examples and applications.
- Quick revision points.
- Self-assessment questions.
- Revision Readiness Score based on the completeness of generated learning material.

### 5. Visual Learning Support
- Mermaid-based diagrams and flowcharts.
- Visual representations of processes and relationships.
- PDF and text export options.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Python, Flask |
| AI Integration | Google Gemini API |
| Speech Recognition | Faster-Whisper |
| NLP | Python-based NLP processing, TF-IDF |
| Audio Processing | FFmpeg, imageio-ffmpeg |
| Diagrams | Mermaid.js |
| Export | jsPDF |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## System Architecture

SmartNotes follows a frontend-backend architecture.

1. The user uploads a lecture recording or enters a study topic.
2. The frontend sends the request to the Flask backend.
3. In Lecture Mode, the backend extracts audio and performs speech transcription using Faster-Whisper.
4. The resulting text is processed using NLP techniques.
5. The analyzed content is passed to Gemini for educational note generation.
6. The generated notes are returned to the frontend.
7. Users can view, revise, and export their learning material.

## Supported Lecture Formats

- MP3
- WAV
- MP4
- MOV

*Actual support depends on the backend's configured file validation and processing environment.*


## Installation and Setup

### Prerequisites
- Python 3.10 or later
- Node.js and npm
- Git
- Google Gemini API key

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd Minor-Project
```

### 2. Backend Setup

```bash
cd smartnotes-backend

python -m venv venv
```

Activate the virtual environment.

Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in your `.env` file, including your Gemini API key.

Start the backend:

```bash
python app.py
```

### 3. Frontend Setup

Open another terminal:

```bash
cd smartnotes-frontend

npm install
```

Configure the backend API URL using the frontend environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local development URL displayed by Vite.

## Deployment

The project uses separate deployment services:

- **Frontend:** Vercel
- **Backend:** Render

The frontend communicates with the deployed Flask API through HTTP requests. Backend CORS configuration allows requests from authorized frontend origins.

Deployment requires the appropriate environment variables and API credentials.

## Project Objectives

- Reduce the effort required to prepare study notes from lengthy lectures.
- Improve accessibility of recorded educational content through transcription.
- Identify important concepts and terminology using NLP.
- Generate explanations that support conceptual understanding.
- Provide multiple approaches to learning and revision.
- Combine AI-generated educational content with organized visual and textual learning resources.

## Future Enhancements

- Improved adaptive guided-learning generation.
- More advanced concept extraction and semantic analysis.
- Improved automatic diagram generation and rendering.
- Persistent user accounts and role-based access.
- Database-backed storage of user and learning information.
- Improved revision evaluation and personalized learning support.



*SmartNotes – Making learning more understandable, organized, and accessible.*
