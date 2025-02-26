# FORAS - Automated Workflow Management

## 🚀 Overview
FORAS is an automated workflow management system designed to streamline form processing, escalation, and notification management.  
It integrates **Jenkins**, **Ansible**, and **Python-based automation** for a robust CI/CD pipeline.

---

## 📁 Project Structure
FORAS/ │── backend/ # Python-based backend (Flask, SpiffWorkflow) │── frontend/ # Angular frontend │── tests/ # Unit and API tests (pytest, Tavern) │── ansible/ # Ansible playbooks for deployment │── jenkins/ # Jenkins CI/CD pipeline scripts │── install.yml # Installation prerequisites (Jenkins) │── README.md # Documentation │── requirements.txt # Python dependencies │── package.json # Frontend dependencies │── .env # Environment variables

yaml
Copier
Modifier

---

## 📦 Tech Stack
| Component       | Technology |
|----------------|------------|
| **Backend**    | Flask, SpiffWorkflow, Redis |
| **Frontend**   | Angular, PrimeNG |
| **Database**   | PostgreSQL, SQL Server |
| **CI/CD**      | Jenkins, Ansible |
| **Testing**    | Pytest, Tavern |

---

## 🔧 Installation

### **1️⃣ Clone the repository**
```sh
git clone https://github.com/your-repo/FORAS.git
cd FORAS
2️⃣ Backend Setup
sh
Copier
Modifier
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
3️⃣ Frontend Setup
sh
Copier
Modifier
cd frontend
npm install
ng serve
