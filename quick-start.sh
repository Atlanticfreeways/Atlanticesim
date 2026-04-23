#!/bin/bash

echo "🚀 Atlantic eSIM Quick Start - Frontend Focus"
echo "=============================================="

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

# Start frontend
echo "🎨 Starting frontend on http://localhost:5173"
npm run dev
