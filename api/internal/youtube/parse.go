package youtube

import (
	"errors"
	"net/url"
	"regexp"
	"strconv"
	"strings"
)

var (
	ErrInvalidURL = errors.New("not a valid YouTube video URL")

	videoIDRe     = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)
	timestampRe   = regexp.MustCompile(`^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$`)
	isoDurationRe = regexp.MustCompile(`^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$`)
)

// ParseURL extracts the video ID and the optional start time (t= or start=)
// from a YouTube URL. A bare 11-character video ID is also accepted.
func ParseURL(raw string) (id string, startSeconds int, err error) {
	raw = strings.TrimSpace(raw)
	if videoIDRe.MatchString(raw) {
		return raw, 0, nil
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}

	u, err := url.Parse(raw)
	if err != nil {
		return "", 0, ErrInvalidURL
	}

	host := strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
	segments := strings.Split(strings.Trim(u.Path, "/"), "/")

	switch host {
	case "youtu.be":
		id = segments[0]
	case "youtube.com", "m.youtube.com", "music.youtube.com":
		switch segments[0] {
		case "watch":
			id = u.Query().Get("v")
		case "shorts", "live", "embed":
			if len(segments) > 1 {
				id = segments[1]
			}
		}
	}
	if !videoIDRe.MatchString(id) {
		return "", 0, ErrInvalidURL
	}

	t := u.Query().Get("t")
	if t == "" {
		t = u.Query().Get("start")
	}
	return id, parseTimestamp(t), nil
}

// parseTimestamp parses YouTube's t= formats ("90", "90s", "1h2m3s").
// Unparseable values are treated as 0.
func parseTimestamp(t string) int {
	m := timestampRe.FindStringSubmatch(t)
	if t == "" || m == nil {
		return 0
	}
	return atoi(m[1])*3600 + atoi(m[2])*60 + atoi(m[3])
}

// ParseISODuration converts an ISO 8601 duration such as "PT1H2M3S" to seconds.
func ParseISODuration(s string) (int, error) {
	m := isoDurationRe.FindStringSubmatch(s)
	if m == nil {
		return 0, errors.New("invalid ISO 8601 duration: " + s)
	}
	return atoi(m[1])*86400 + atoi(m[2])*3600 + atoi(m[3])*60 + atoi(m[4]), nil
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}
