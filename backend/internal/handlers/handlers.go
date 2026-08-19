// Package handlers exposes the HTTP API consumed by the frontend.
package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/ojardila/twin-neobank/backend/internal/chain"
	"github.com/ojardila/twin-neobank/backend/internal/config"
)

// Server bundles dependencies for the HTTP handlers.
type Server struct {
	cfg   *config.Config
	chain *chain.Client
	log   *slog.Logger
}

// New returns a Server.
func New(cfg *config.Config, ch *chain.Client, log *slog.Logger) *Server {
	return &Server{cfg: cfg, chain: ch, log: log}
}

// Routes wires the mux with CORS + logging middleware.
func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /readyz", s.health)
	mux.HandleFunc("GET /api/config", s.getConfig)
	mux.HandleFunc("GET /api/balance", s.getBalance)
	mux.HandleFunc("GET /api/vault", s.getVault)
	return s.withMiddleware(mux)
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// getConfig returns chain + contract metadata (single source of truth for the UI).
func (s *Server) getConfig(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.cfg)
}

// getBalance returns the ARGt balance for ?address on ?chain (default arbitrum).
func (s *Server) getBalance(w http.ResponseWriter, r *http.Request) {
	addr := r.URL.Query().Get("address")
	chainKey := def(r.URL.Query().Get("chain"), "arbitrum")
	if addr == "" {
		writeErr(w, http.StatusBadRequest, "missing address")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	bal, err := s.chain.ERC20Balance(ctx, chainKey, s.cfg.ARGtToken, addr)
	if err != nil {
		s.log.Error("balance query failed", "err", err, "chain", chainKey, "addr", addr)
		writeErr(w, http.StatusBadGateway, "balance query failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"chain":    chainKey,
		"token":    s.cfg.ARGtToken,
		"address":  addr,
		"raw":      bal.String(),
		"decimals": s.cfg.ARGtDecimals,
	})
}

// getVault returns the user's ERC-4626 vault shares + underlying value.
func (s *Server) getVault(w http.ResponseWriter, r *http.Request) {
	addr := r.URL.Query().Get("address")
	if addr == "" {
		writeErr(w, http.StatusBadRequest, "missing address")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	shares, assets, err := s.chain.VaultPosition(ctx, s.cfg.VaultChain, s.cfg.Vault, addr)
	if err != nil {
		s.log.Error("vault query failed", "err", err, "addr", addr)
		writeErr(w, http.StatusBadGateway, "vault query failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"chain":    s.cfg.VaultChain,
		"vault":    s.cfg.Vault,
		"address":  addr,
		"shares":   shares.String(),
		"assets":   assets.String(),
		"decimals": s.cfg.ARGtDecimals,
	})
}

// --- middleware & helpers ---

func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		start := time.Now()
		next.ServeHTTP(w, r)
		s.log.Info("request", "method", r.Method, "path", r.URL.Path, "dur", time.Since(start).String())
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func def(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
