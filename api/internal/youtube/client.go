package youtube

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

var ErrNotFound = errors.New("video not found on YouTube")

type Metadata struct {
	Title           string
	Channel         string
	ThumbnailURL    string
	DurationSeconds int
}

type Client struct {
	apiKey string
	http   *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{apiKey: apiKey, http: &http.Client{Timeout: 10 * time.Second}}
}

type thumbnail struct {
	URL string `json:"url"`
}

type videosResponse struct {
	Items []struct {
		Snippet struct {
			Title        string `json:"title"`
			ChannelTitle string `json:"channelTitle"`
			Thumbnails   struct {
				Medium thumbnail `json:"medium"`
				High   thumbnail `json:"high"`
			} `json:"thumbnails"`
		} `json:"snippet"`
		ContentDetails struct {
			Duration string `json:"duration"`
		} `json:"contentDetails"`
	} `json:"items"`
}

// FetchVideo gets title, channel, thumbnail and duration from the YouTube Data API v3.
func (c *Client) FetchVideo(ctx context.Context, id string) (Metadata, error) {
	q := url.Values{
		"part": {"snippet,contentDetails"},
		"id":   {id},
		"key":  {c.apiKey},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/youtube/v3/videos?"+q.Encode(), nil)
	if err != nil {
		return Metadata{}, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return Metadata{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return Metadata{}, fmt.Errorf("youtube api returned %s", resp.Status)
	}

	var body videosResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return Metadata{}, err
	}
	if len(body.Items) == 0 {
		return Metadata{}, ErrNotFound
	}

	item := body.Items[0]
	duration, err := ParseISODuration(item.ContentDetails.Duration)
	if err != nil {
		return Metadata{}, err
	}
	thumb := item.Snippet.Thumbnails.Medium.URL
	if thumb == "" {
		thumb = item.Snippet.Thumbnails.High.URL
	}
	return Metadata{
		Title:           item.Snippet.Title,
		Channel:         item.Snippet.ChannelTitle,
		ThumbnailURL:    thumb,
		DurationSeconds: duration,
	}, nil
}
