fruitfly-chess/
├── app.py                          # FastAPI backend & game state controller
├── connectome_chess.py             # Connectome GNN policy & Drosophila graph extractor
├── connectome_model.pt             # Quantized GNN weights (7.12 MB, int8 precision)
├── requirements.txt                # Python backend dependencies
├── LICENSE                         # MIT License with author copyright & research credits
├── README.md                       # Documentation & showcase
├── magnus_carlsen_200_games.pgn    # Grandmaster training dataset
├── magnus_training_log.csv         # Training loss & accuracy metrics
├── static/                         # Static textures, brain diagrams & fly renders
│   ├── hd_drosophila_fly.png       # High-definition fly render
│   ├── fly_brain_transparent.png   # Transparent neuropil schematic
│   ├── fly_brain.png               # High-res connectome diagram
│   ├── realistic_drosophila_body.png
│   └── realistic_drosophila_wing.png
└── frontend/                       # React Three Fiber 3D application
    ├── index.html                  # HTML entry point
    ├── package.json                # NPM scripts and dependencies
    ├── vite.config.ts              # Vite bundling configuration
    ├── tailwind.config.js          # Tailwind styling setup
    ├── dist/                       # Pre-built production bundle (ready to run!)
    └── src/
        ├── App.tsx                 # Main application controller
        ├── main.tsx                # React DOM root
        ├── api.ts                  # REST API communication client
        ├── types.ts                # TypeScript interfaces for game & connectome
        ├── components/
        │   ├── Fly3D.tsx           # NeuroMechFly 3D model & grooming kinematics
        │   ├── Board3D.tsx         # 3D chess board & interactive square highlights
        │   ├── Piece3D.tsx         # Procedural 3D chess pieces
        │   ├── ChessViewport.tsx   # Canvas, studio lighting, shadows & orbit controls
        │   ├── BrainCanvas.tsx     # Real-time connectome neural firing visualizer
        │   ├── EvalBar.tsx         # Evaluation advantage indicator
        │   ├── MoveHistory.tsx     # Move notation table with PGN export
        │   └── Header.tsx          # Status indicators and reset controls
        └── hooks/
            └── useChessGame.ts     # Game state management & API polling hook
