package handlers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ojardila/twin-neobank/backend/internal/chain"
	"github.com/ojardila/twin-neobank/backend/internal/config"
)

func newTestServer(t *testing.T) http.Handler {
	t.Helper()
	cfg := config.Load()
	ch, err := chain.New(cfg)
	if err != nil {
		t.Fatalf("chain.New: %v", err)
	}
	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	return New(cfg, ch, log).Routes()
}

func do(t *testing.T, h http.Handler, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

func TestHealthz(t *testing.T) {
	rr := do(t, newTestServer(t), "/healthz")
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "ok" {
		t.Errorf("status = %q, want ok", body["status"])
	}
}

func TestGetConfig(t *testing.T) {
	rr := do(t, newTestServer(t), "/api/config")
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	var cfg config.Config
	if err := json.Unmarshal(rr.Body.Bytes(), &cfg); err != nil {
		t.Fatalf("decode config: %v", err)
	}
	if cfg.ARGtToken == "" {
		t.Error("empty argtToken in /api/config")
	}
	if len(cfg.Chains) != 3 {
		t.Errorf("chains = %d, want 3", len(cfg.Chains))
	}
}

func TestBalanceRequiresAddress(t *testing.T) {
	// Missing address should 400 before any RPC call (no network needed).
	rr := do(t, newTestServer(t), "/api/balance")
	if rr.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rr.Code)
	}
}

func TestCORSHeaders(t *testing.T) {
	rr := do(t, newTestServer(t), "/healthz")
	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("CORS origin = %q, want *", got)
	}
}
