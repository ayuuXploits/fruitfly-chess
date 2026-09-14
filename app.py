"""
FastAPI Server for the Drosophila Connectome Chess Web Application.
Serves the React 3D frontend and exposes the game API.
"""

import math
import os
import random
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
import torch

from connectome_chess import (
    DrosophilaConnectomeExtractor,
    ChessStateEncoder,
    ConnectomeChessPolicy
)

app = FastAPI(title="Drosophila Connectome Chess")

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Game & Model State
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "connectome_model.pt")

print("[Init] Initializing Drosophila Connectome Graph...")
extractor = DrosophilaConnectomeExtractor(num_sensory=64, num_inter=128, num_motor=64, seed=42)
G = extractor.build_biological_subgraph()
pyg_data = extractor.to_pyg_data(G)

policy = ConnectomeChessPolicy(pyg_connectome=pyg_data, hidden_dim=64, num_gnn_layers=3)
last_loaded_mtime = 0.0

def reload_policy_if_updated():
    global policy, last_loaded_mtime
    if os.path.exists(CHECKPOINT_PATH):
        try:
            mtime = os.path.getmtime(CHECKPOINT_PATH)
            if mtime > last_loaded_mtime:
                state_dict = torch.load(CHECKPOINT_PATH, map_location="cpu")
                if isinstance(state_dict, dict):
                    decoded = {}
                    for k, v in state_dict.items():
                        if isinstance(v, dict) and "q" in v and "scale" in v:
                            decoded[k] = v["q"].float() * v["scale"].float()
                        elif isinstance(v, torch.Tensor) and v.is_floating_point():
                            decoded[k] = v.float()
                        else:
                            decoded[k] = v
                    state_dict = decoded
                policy.load_state_dict(state_dict)
                last_loaded_mtime = mtime
                policy.eval()
                print(f"[Policy] Reloaded updated weights from {CHECKPOINT_PATH} (mtime: {mtime})")
        except Exception as e:
            print(f"[Warning] Could not reload checkpoint: {e}")

reload_policy_if_updated()

# Global Game Session State
game_board = chess.Board()
game_mode = "tactical"  # "tactical" or "policy"
player_color = chess.WHITE
move_history = []


class MoveRequest(BaseModel):
    move: str  # UCI string, e.g. "e2e4"
    mode: Optional[str] = "tactical"


class ResetRequest(BaseModel):
    player_color: Optional[str] = "white"
    mode: Optional[str] = "tactical"


def compute_board_state_dict() -> Dict[str, Any]:
    global game_board, move_history, player_color
    legal_moves = [m.uci() for m in game_board.legal_moves]

    # Calculate material score
    vals = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
    white_mat = sum(vals.get(p.piece_type, 0) for p in game_board.piece_map().values() if p.color == chess.WHITE)
    black_mat = sum(vals.get(p.piece_type, 0) for p in game_board.piece_map().values() if p.color == chess.BLACK)
    material_balance = white_mat - black_mat

    return {
        "fen": game_board.fen(),
        "turn": "white" if game_board.turn == chess.WHITE else "black",
        "is_game_over": game_board.is_game_over(),
        "is_check": game_board.is_check(),
        "is_checkmate": game_board.is_checkmate(),
        "is_stalemate": game_board.is_stalemate(),
        "is_draw": game_board.can_claim_draw() or game_board.is_insufficient_material(),
        "legal_moves": legal_moves,
        "material_balance": material_balance,
        "move_history": move_history,
        "player_color": "white" if player_color == chess.WHITE else "black",
    }


# ─── Serve React App ───
@app.get("/")
def get_index():
    # Prefer built React app; fall back to old static HTML
    react_index = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(react_index):
        return FileResponse(react_index)
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/state")
def get_state():
    return compute_board_state_dict()


@app.get("/api/connectome")
def get_connectome_graph():
    """
    Returns connectome node coordinates and synaptic edges for biological canvas visualization.
    """
    nodes = []
    sensory_n = extractor.num_sensory
    inter_n = extractor.num_inter
    motor_n = extractor.num_motor
    mb_n = inter_n // 2
    cx_n = inter_n - mb_n

    for u in range(extractor.total_nodes):
        attr = G.nodes[u]
        neuropil = attr.get("neuropil", "Central_Brain")
        cell_type = attr.get("cell_type", "Neuron")

        if u < sensory_n:
            angle = (u / sensory_n) * math.pi - math.pi / 2
            x = 100 + 40 * math.cos(angle)
            y = 250 + 180 * math.sin(angle)
            color = "#00f0ff"
        elif u < sensory_n + mb_n:
            idx = u - sensory_n
            r = 30 + (idx % 4) * 15
            theta = (idx / mb_n) * 2 * math.pi
            x = 320 + r * math.cos(theta)
            y = 140 + r * math.sin(theta)
            color = "#bd00ff"
        elif u < sensory_n + inter_n:
            idx = u - sensory_n - mb_n
            r = 55
            theta = (idx / cx_n) * 2 * math.pi
            x = 320 + r * math.cos(theta)
            y = 340 + r * math.sin(theta)
            color = "#ffb700"
        else:
            idx = u - (sensory_n + inter_n)
            angle = (idx / motor_n) * math.pi - math.pi / 2
            x = 520 + 35 * math.cos(angle)
            y = 250 + 160 * math.sin(angle)
            color = "#00ff66"

        nodes.append({
            "id": u,
            "x": round(x, 1),
            "y": round(y, 1),
            "neuropil": neuropil,
            "cell_type": cell_type,
            "color": color
        })

    edges = []
    for u, v, data in G.edges(data=True):
        weight = data.get("weight", 1.0)
        edges.append({
            "source": u,
            "target": v,
            "weight": round(weight, 2)
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": extractor.total_nodes,
        "total_edges": len(edges)
    }


@app.post("/api/player-move")
def make_player_move(req: MoveRequest):
    global game_board, move_history
    if game_board.is_game_over():
        raise HTTPException(status_code=400, detail="Game is already over.")

    try:
        move = chess.Move.from_uci(req.move)
        if move not in game_board.legal_moves:
            # Try queen promotion if pawn to last rank
            move_q = chess.Move.from_uci(req.move + "q")
            if move_q in game_board.legal_moves:
                move = move_q
            else:
                raise HTTPException(status_code=400, detail=f"Illegal move: {req.move}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid move notation: {str(e)}")

    san = game_board.san(move)
    game_board.push(move)
    move_history.append({"player": "Human", "uci": move.uci(), "san": san})

    return compute_board_state_dict()


@app.post("/api/fly-move")
def make_fly_move(req: MoveRequest):
    global game_board, move_history, policy
    reload_policy_if_updated()
    if game_board.is_game_over():
        return compute_board_state_dict()

    mode = req.mode or "undefeatable"

    with torch.no_grad():
        if mode == "undefeatable" or mode == "stockfish_3500":
            best_move, stats = policy.search_best_move(game_board, depth=14, time_limit_sec=0.35, mode="undefeatable")
            eval_val = stats.get("eval_value", round(stats.get("eval_cp", 0.0) / 100.0, 2))
        elif mode == "grandmaster_2300" or mode == "grandmaster":
            best_move, stats = policy.search_best_move(game_board, depth=4, time_limit_sec=0.9, mode="grandmaster_2300")
            eval_val = round(stats.get("eval_cp", 0.0) / 100.0, 2)
        elif mode == "tactical":
            best_move, stats = policy.search_best_move(game_board, depth=2, time_limit_sec=0.3, mode="grandmaster_2300")
            eval_val = round(stats.get("eval_cp", 0.0) / 100.0, 2)
        else:
            best_move, log_prob, val, stats = policy.select_action(game_board, deterministic=True)
            eval_val = float(val.item())

    san = game_board.san(best_move)
    game_board.push(best_move)
    move_history.append({"player": "Fruit Fly (Drosophila)", "uci": best_move.uci(), "san": san})

    res = compute_board_state_dict()
    res["fly_stats"] = {
        "sensory_firing": round(stats.get("sensory_norm", 0.0), 2),
        "inter_firing": round(stats.get("inter_norm", 0.0), 2),
        "motor_firing": round(stats.get("motor_norm", 0.0), 2),
        "eval_value": float(eval_val),
        "eval_cp": stats.get("eval_cp", 0.0),
        "search_depth": stats.get("search_depth", stats.get("depth", 14)),
        "nodes_searched": stats.get("nodes_searched", stats.get("nodes", 1)),
        "search_time_ms": stats.get("search_time_ms", 0.0),
        "engine_type": stats.get("engine_type", "Stockfish 19 NNUE (3500+ ELO)"),
        "chosen_move": best_move.uci(),
        "chosen_san": san
    }
    return res


@app.post("/api/reset")
def reset_game(req: ResetRequest):
    global game_board, move_history, player_color, game_mode
    reload_policy_if_updated()
    game_board.reset()
    move_history = []
    player_color = chess.WHITE if req.player_color == "white" else chess.BLACK
    game_mode = req.mode or "undefeatable"

    # If player is black, fly makes initial move
    if player_color == chess.BLACK:
        with torch.no_grad():
            best_move, stats = policy.search_best_move(game_board, depth=14, time_limit_sec=0.35, mode=game_mode)
        san = game_board.san(best_move)
        game_board.push(best_move)
        move_history.append({"player": "Fruit Fly (Drosophila)", "uci": best_move.uci(), "san": san})

    return compute_board_state_dict()


# ─── Mount static assets ───
# Serve built React assets (JS/CSS bundles)
if os.path.isdir(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend-assets")

# Serve original static files (fly images etc.)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
