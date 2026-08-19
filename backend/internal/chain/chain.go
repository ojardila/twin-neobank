// Package chain provides read-only on-chain queries (balances, vault position)
// over raw JSON-RPC eth_call. No external dependencies: calldata is encoded by
// hand (4-byte selector + 32-byte args) and results decoded as uint256.
//
// All state-changing transactions are signed client-side by the user's wallet;
// the backend never holds keys.
package chain

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/ojardila/twin-neobank/backend/internal/config"
)

// Function selectors (first 4 bytes of keccak256 of the signature).
const (
	selBalanceOf       = "70a08231" // balanceOf(address)
	selConvertToAssets = "07a2d13a" // convertToAssets(uint256)
)

// Client issues eth_call requests against per-chain RPC endpoints.
type Client struct {
	cfg  *config.Config
	http *http.Client
}

// New returns a Client.
func New(cfg *config.Config) (*Client, error) {
	return &Client{cfg: cfg, http: &http.Client{Timeout: 12 * time.Second}}, nil
}

type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      int    `json:"id"`
	Method  string `json:"method"`
	Params  []any  `json:"params"`
}

type rpcResponse struct {
	Result string `json:"result"`
	Error  *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// ethCall performs a single eth_call and returns the raw hex result.
func (c *Client) ethCall(ctx context.Context, chainKey, to, data string) (string, error) {
	ch, ok := c.cfg.Chains[chainKey]
	if !ok {
		return "", fmt.Errorf("unknown chain %q", chainKey)
	}
	reqBody, err := json.Marshal(rpcRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "eth_call",
		Params: []any{
			map[string]string{"to": to, "data": data},
			"latest",
		},
	})
	if err != nil {
		return "", err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, ch.RPCURL, bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out rpcResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.Error != nil {
		return "", fmt.Errorf("rpc error %d: %s", out.Error.Code, out.Error.Message)
	}
	return out.Result, nil
}

// encodeAddressArg left-pads a 20-byte address to a 32-byte ABI word.
func encodeAddressArg(addr string) string {
	a := strings.ToLower(strings.TrimPrefix(addr, "0x"))
	return strings.Repeat("0", 64-len(a)) + a
}

// encodeUint256Arg left-pads a big.Int to a 32-byte ABI word.
func encodeUint256Arg(n *big.Int) string {
	h := fmt.Sprintf("%x", n)
	return strings.Repeat("0", 64-len(h)) + h
}

// decodeUint256 parses a 0x-prefixed hex result into a big.Int (defaults to 0).
func decodeUint256(hexStr string) (*big.Int, error) {
	h := strings.TrimPrefix(hexStr, "0x")
	if h == "" {
		return big.NewInt(0), nil
	}
	if _, err := hex.DecodeString(h); err != nil {
		return nil, fmt.Errorf("invalid hex result: %w", err)
	}
	n := new(big.Int)
	n.SetString(h, 16)
	return n, nil
}

// ERC20Balance returns the raw (undecimated) token balance.
func (c *Client) ERC20Balance(ctx context.Context, chainKey, token, holder string) (*big.Int, error) {
	data := "0x" + selBalanceOf + encodeAddressArg(holder)
	res, err := c.ethCall(ctx, chainKey, token, data)
	if err != nil {
		return nil, err
	}
	return decodeUint256(res)
}

// VaultPosition returns the user's vault shares and their value in underlying assets.
func (c *Client) VaultPosition(ctx context.Context, chainKey, vault, holder string) (shares, assets *big.Int, err error) {
	shares, err = c.ERC20Balance(ctx, chainKey, vault, holder) // ERC-4626 shares are an ERC-20 balance
	if err != nil {
		return nil, nil, err
	}
	data := "0x" + selConvertToAssets + encodeUint256Arg(shares)
	res, err := c.ethCall(ctx, chainKey, vault, data)
	if err != nil {
		return nil, nil, err
	}
	assets, err = decodeUint256(res)
	if err != nil {
		return nil, nil, err
	}
	return shares, assets, nil
}

// Close is a no-op (stdlib http client needs no teardown).
func (c *Client) Close() {}
