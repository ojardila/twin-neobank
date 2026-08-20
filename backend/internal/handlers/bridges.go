package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"time"
)

// lzClient is a small dedicated client for the LayerZeroScan API.
var lzClient = &http.Client{Timeout: 12 * time.Second}

// Bridge is the trimmed record returned to the frontend.
type Bridge struct {
	SrcTxHash string `json:"srcTxHash"`
	SrcEid    uint32 `json:"srcEid"`
	DstEid    uint32 `json:"dstEid"`
	Status    string `json:"status"`
	Created   string `json:"created"`
}

// lzResponse mirrors the parts of the LayerZeroScan wallet-messages payload we use.
type lzResponse struct {
	Data []struct {
		Pathway struct {
			SrcEid uint32 `json:"srcEid"`
			DstEid uint32 `json:"dstEid"`
		} `json:"pathway"`
		Source struct {
			Tx struct {
				TxHash string `json:"txHash"`
			} `json:"tx"`
		} `json:"source"`
		Status struct {
			Name string `json:"name"`
		} `json:"status"`
		Created string `json:"created"`
	} `json:"data"`
}

// getBridges proxies LayerZeroScan to list a wallet's cross-chain transfers and
// their delivery status. Keeps the external call server-side (no CORS / key).
func (s *Server) getBridges(w http.ResponseWriter, r *http.Request) {
	addr := r.URL.Query().Get("address")
	if addr == "" {
		writeErr(w, http.StatusBadRequest, "missing address")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()

	api := "https://scan.layerzero-api.com/v1/messages/wallet/" + url.PathEscape(addr) + "?limit=15"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, api, nil)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "request build failed")
		return
	}
	resp, err := lzClient.Do(req)
	if err != nil {
		s.log.Error("layerzero fetch failed", "err", err)
		writeErr(w, http.StatusBadGateway, "bridge history unavailable")
		return
	}
	defer resp.Body.Close()

	var parsed lzResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		writeErr(w, http.StatusBadGateway, "bridge history parse failed")
		return
	}

	bridges := make([]Bridge, 0, len(parsed.Data))
	for _, m := range parsed.Data {
		bridges = append(bridges, Bridge{
			SrcTxHash: m.Source.Tx.TxHash,
			SrcEid:    m.Pathway.SrcEid,
			DstEid:    m.Pathway.DstEid,
			Status:    m.Status.Name,
			Created:   m.Created,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"bridges": bridges})
}
