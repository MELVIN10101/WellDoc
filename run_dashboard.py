#!/usr/bin/env python3
"""
Script to run the Streamlit dashboard
"""
import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def run_dashboard():
    """Run the Streamlit dashboard"""
    try:
        print("🚀 Starting the dashboard...")
        print("📊 Dashboard will open in your browser at http://localhost:8501")
        subprocess.run([sys.executable, "-m", "streamlit", "run", "dashboard.py"])
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped by user")
    except Exception as e:
        print(f"❌ Error running dashboard: {e}")

if __name__ == "__main__":
    print("🔧 Setting up Patient Health Trend Analysis Dashboard...")
    
    # Check if data directory exists
    if not os.path.exists("data"):
        print("📁 Creating data directory...")
        os.makedirs("data")
        print("ℹ️  Please place your CSV files in the 'data' directory:")
        print("   - patient_180days_hourly.csv")
        print("   - Prediction_with_StressIndex.csv")
    
    # Install requirements
    if install_requirements():
        # Run dashboard
        run_dashboard()