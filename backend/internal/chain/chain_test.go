package chain

import (
	"math/big"
	"testing"
)

func TestEncodeAddressArg(t *testing.T) {
	got := encodeAddressArg("0x59863989d080B22476DB95656d0C3CC18be92214")
	want := "00000000000000000000000059863989d080b22476db95656d0c3cc18be92214"
	if got != want {
		t.Fatalf("encodeAddressArg = %q, want %q", got, want)
	}
	if len(got) != 64 {
		t.Fatalf("encoded address length = %d, want 64", len(got))
	}
}

func TestEncodeUint256Arg(t *testing.T) {
	cases := map[string]*big.Int{
		"0000000000000000000000000000000000000000000000000000000000000000": big.NewInt(0),
		"0000000000000000000000000000000000000000000000000000000000000005": big.NewInt(5),
		"0000000000000000000000000000000000000000000000000de0b6b3a7640000": big.NewInt(1_000_000_000_000_000_000),
	}
	for want, n := range cases {
		if got := encodeUint256Arg(n); got != want {
			t.Errorf("encodeUint256Arg(%s) = %q, want %q", n, got, want)
		}
		if len(encodeUint256Arg(n)) != 64 {
			t.Errorf("encodeUint256Arg(%s) length != 64", n)
		}
	}
}

func TestDecodeUint256(t *testing.T) {
	cases := []struct {
		in   string
		want int64
	}{
		{"0x0000000000000000000000000000000000000000000000000000000000000005", 5},
		{"0x", 0},
		{"", 0},
		{"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000", 1_000_000_000_000_000_000},
	}
	for _, c := range cases {
		got, err := decodeUint256(c.in)
		if err != nil {
			t.Fatalf("decodeUint256(%q) error: %v", c.in, err)
		}
		if got.Int64() != c.want {
			t.Errorf("decodeUint256(%q) = %d, want %d", c.in, got.Int64(), c.want)
		}
	}

	if _, err := decodeUint256("0xzz"); err == nil {
		t.Error("decodeUint256 with invalid hex should error")
	}
}
