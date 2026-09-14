# 🪰 Drosophila Connectome Chess (FliPy 3D)

An interactive, full-stack 3D chess game where you play against a simulated biological *Drosophila melanogaster* (fruit fly) brain connectome AI powered by Graph Neural Networks (GNN) and Stockfish 19 NNUE (3500+ ELO).

Across the board sits an anatomically accurate 3D model of *Drosophila melanogaster* modeled after the scientific **NeuroMechFly** architecture. In real time, the fly:
- Breathes with abdominal respiratory pumping.
- Flaps its wings at high frequency during calculations and flights.
- Performs realistic, biological foreleg grooming—rubbing the outer (lateral and dorsal) surfaces of its prothoracic legs against each other.
- Swoops down from its observation perch to pick up chess pieces in its forelegs and physically moves them across the board to play its moves!

---

## 🏗️ Architecture

```
drosophila_chess/
├── app.py                      # FastAPI web server and game state engine
├── connectome_chess.py         # Drosophila connectome extractor & GNN policy network
├── connectome_model.pt         # Trained connectome GNN model weights
├── requirements.txt            # Python dependencies
├── static/                     # Static media & textures (brain graphs, fly imagery)
└── frontend/                   # React + Three.js + React Three Fiber 3D UI
    ├── src/
    │   ├── components/
    │   │   ├── Fly3D.tsx       # 3D NeuroMechFly model, kinematics & outer leg grooming
    │   │   ├── Board3D.tsx     # 3D wooden chess board & dynamic square highlights
    │   │   ├── Piece3D.tsx     # Low-poly procedural 3D chess pieces
    │   │   ├── ChessViewport.tsx # R3F Canvas, studio lighting, shadows & orbit controls
    │   │   ├── BrainCanvas.tsx # Real-time connectome neural firing visualization
    │   │   └── ...
    │   ├── App.tsx             # Main game loop and state synchronization
    │   └── ...
    ├── dist/                   # Production built assets (served by FastAPI)
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Create and activate a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python app.py
# or: uvicorn app:app --host 127.0.0.1 --port 8000
```

The game is now running at **http://127.0.0.1:8000**!

### 2. Frontend Development (Optional)

To modify or develop the 3D frontend:

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server with hot reload on http://localhost:5173
npm run build    # Compiles production bundle to frontend/dist/
```

---

## 🔬 Biological Connectome Engine

- **Connectome Extraction**: Builds a biological directed graph of 256 neurons (sensory, mushroom body, central complex, motor neuropils) and realistic synaptic weights.
- **GNN Policy**: Uses multi-layer Graph Neural Network message passing over the connectome topology to evaluate board positions and select tactical candidate moves.
- **Stockfish NNUE Integration**: Combines biological connectome activation with deep tactical depth search.
- **Biomechanical Kinematics**: The 3D fly features articulated multi-segment joints (coxa, trochanter, spindle femur, high arched knee, tibia with spurs, 5-segment tarsus, and claws) calibrated to real Drosophila kinematics.

---

## 📜 License
MIT
