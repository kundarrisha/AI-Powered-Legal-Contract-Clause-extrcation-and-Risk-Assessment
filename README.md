# ⚖️ AI-Powered Legal Contract Clause Extraction & Risk Assessment

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-70.8%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-26.5%25-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-2.7%25-E34F26?style=for-the-badge&logo=html5&logoColor=white)

*Automate legal contract analysis with the power of AI — extract key clauses, assess risks, and make informed decisions faster.*

</div>

---

## 📌 Overview

**AI-Powered Legal Contract Clause Extraction & Risk Assessment** is a full-stack intelligent system that automates the review of legal contracts. By combining advanced Natural Language Processing (NLP) with AI-driven analysis, it identifies critical clauses, evaluates potential risks, and surfaces actionable insights — reducing manual review time significantly.

Whether you're a legal professional, a startup founder, or an enterprise team, this tool helps you understand contracts faster and with greater confidence.

---

## ✨ Features

- 🔍 **Clause Extraction** — Automatically identifies and extracts key clauses such as liability, confidentiality, termination, indemnification, and more.
- ⚠️ **Risk Assessment** — Classifies risks by category (legal, financial, compliance) and severity level (Low / Medium / High).
- 💡 **Actionable Recommendations** — Suggests mitigation strategies for flagged risk areas.
- 📄 **Multi-Format Support** — Accepts contracts in PDF, DOCX, and TXT formats.
- 🌐 **Full-Stack Architecture** — TypeScript-powered frontend with a Python-based AI/NLP backend.
- 📊 **Structured Reports** — Outputs results in a clean, structured format ready for review.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | TypeScript, HTML |
| **Backend / AI** | Python, NLP / Transformer Models |
| **Document Parsing** | PDF / DOCX processing libraries |
| **Risk Engine** | AI-based clause classification & scoring |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.9+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/kundarrisha/AI-Powered-Legal-Contract-Clause-extrcation-and-Risk-Assessment.git
cd AI-Powered-Legal-Contract-Clause-extrcation-and-Risk-Assessment
```

2. **Set up the Python backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up the TypeScript frontend**

```bash
cd frontend
npm install
```

4. **Configure environment variables**

```bash
cp .env.example .env
# Add your API keys and configuration
```

5. **Run the application**

```bash
# Start the backend
python app.py

# Start the frontend (in a separate terminal)
npm run dev
```

---

## 📂 Project Structure

```
AI-Powered-Legal-Contract-Clause-Extraction-and-Risk-Assessment/
├── frontend/          # TypeScript UI for uploading contracts & viewing results
├── backend/           # Python AI/NLP engine for clause extraction & risk scoring
├── models/            # Pre-trained or fine-tuned NLP models
├── utils/             # Shared utilities and helpers
└── README.md
```

---

## 🔄 How It Works

```
📤 Upload Contract (PDF/DOCX/TXT)
        ↓
🧠 AI Clause Extraction Engine
        ↓
⚠️  Risk Classification & Scoring
        ↓
📋 Structured Risk Report with Recommendations
```

1. **Upload** your legal contract via the web interface.
2. The **AI engine** parses and extracts identifiable clauses.
3. Each clause is **classified and scored** for risk level.
4. A **detailed report** is generated with recommendations for mitigation.

---

## 📸 Screenshots

> _Add screenshots or a demo GIF here to showcase the UI and generated reports._

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the project:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

> This tool is an **AI-powered assistant only**. It does **not** constitute legal advice. All outputs must be reviewed and validated by a qualified legal professional before any decisions are made. The analysis is automated and may be incomplete or inaccurate for complex or jurisdiction-specific contracts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Kundarrisha**
- GitHub: [@kundarrisha](https://github.com/kundarrisha)

---

<div align="center">

⭐ If you found this project helpful, consider giving it a star!

</div>
