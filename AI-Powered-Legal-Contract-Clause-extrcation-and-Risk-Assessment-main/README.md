
## Run Locally

**Prerequisites:**  Node.js


1. Install frontend dependencies:
   `npm install`

2. Install Python backend dependencies and run the FastAPI server that loads the local models placed in `models/`:

   - Create and activate a virtual environment (Windows PowerShell):

     ```powershell
     python -m venv .venv; .\.venv\Scripts\Activate.ps1
     pip install -r server\requirements.txt
     ```

   - Run the backend (FastAPI/uvicorn):

     ```powershell
     uvicorn server.app:app --reload --host 0.0.0.0 --port 8000
     ```

3. Run the frontend:

   ```powershell
   npm run dev
   ```

The frontend calls the local backend at http://localhost:8000/analyze/ to perform inference using the models in the `models/` folder. No remote API key is required.
