package youtube

import "testing"

func TestParseURL(t *testing.T) {
	tests := []struct {
		in        string
		wantID    string
		wantStart int
		wantErr   bool
	}{
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ", 0, false},
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=754s", "dQw4w9WgXcQ", 754, false},
		{"https://youtube.com/watch?v=dQw4w9WgXcQ&t=1h2m3s", "dQw4w9WgXcQ", 3723, false},
		{"https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=90", "dQw4w9WgXcQ", 90, false},
		{"https://youtu.be/dQw4w9WgXcQ?si=abc&t=42", "dQw4w9WgXcQ", 42, false},
		{"youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ", 0, false},
		{"https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ", 0, false},
		{"https://www.youtube.com/live/dQw4w9WgXcQ?feature=share", "dQw4w9WgXcQ", 0, false},
		{"https://www.youtube.com/embed/dQw4w9WgXcQ?start=30", "dQw4w9WgXcQ", 30, false},
		{"dQw4w9WgXcQ", "dQw4w9WgXcQ", 0, false},
		{"  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ", "dQw4w9WgXcQ", 0, false},
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=garbage", "dQw4w9WgXcQ", 0, false},
		{"https://vimeo.com/123456", "", 0, true},
		{"https://www.youtube.com/watch?v=short", "", 0, true},
		{"https://www.youtube.com/channel/UC123", "", 0, true},
		{"", "", 0, true},
	}
	for _, tt := range tests {
		id, start, err := ParseURL(tt.in)
		if (err != nil) != tt.wantErr {
			t.Errorf("ParseURL(%q) err = %v, wantErr %v", tt.in, err, tt.wantErr)
			continue
		}
		if id != tt.wantID || start != tt.wantStart {
			t.Errorf("ParseURL(%q) = (%q, %d), want (%q, %d)", tt.in, id, start, tt.wantID, tt.wantStart)
		}
	}
}

func TestParseISODuration(t *testing.T) {
	tests := []struct {
		in      string
		want    int
		wantErr bool
	}{
		{"PT1H2M3S", 3723, false},
		{"PT45M", 2700, false},
		{"PT30S", 30, false},
		{"P1DT2H", 93600, false},
		{"P0D", 0, false},
		{"1:00", 0, true},
	}
	for _, tt := range tests {
		got, err := ParseISODuration(tt.in)
		if (err != nil) != tt.wantErr || got != tt.want {
			t.Errorf("ParseISODuration(%q) = (%d, %v), want (%d, wantErr %v)", tt.in, got, err, tt.want, tt.wantErr)
		}
	}
}
