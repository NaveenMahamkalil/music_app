#  Emotion-Aware Music Player: An AI-Based System for Real-Time Mood Detection and Personalized Music Recommendation Using Facial Expression Analysis

## Overview

This project is a web-based application that detects the user's mood using a CNN model and recommends music accordingly. The system aims to improve user experience by automatically suggesting songs based on emotions.

## Features

* Detects user emotion using a CNN model
* Recommends songs based on detected mood
* Simple and user-friendly interface
* Real-time image or webcam-based mood detection

## Tech Stack

Frontend: Angular / React (update as per your project)
Backend: .NET Core / Node.js
Machine Learning: Python, TensorFlow/Keras, OpenCV
Database: SQL Server / MongoDB

## Project Structure

```
project-root/
  client/
  server/
  README.txt
```

## Setup Instructions

1. Clone the repository

```
git clone https://github.com/your-username/music_app.git
cd music_app
```

2. Install frontend dependencies

```
cd frontend
npm install
npm start
```

3. Run backend

```
cd backend
npm install
npm start
```

4. Run ML model (if separate)

```
pip install -r requirements.txt
python app.py
```

## How It Works

* The user opens the application
* The system captures an image or uses webcam input
* The CNN model predicts the user's emotion
* Based on the emotion, relevant songs are recommended

## Future Improvements

* Integration with music streaming APIs
* Mobile application support
* Improved accuracy of emotion detection


Feel free to make any development and create a pull request.
