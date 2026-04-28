package shared

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

func NewRedis(redisURL string) (*redis.Client, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	// Check connection
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Warn().Err(err).Msg("Redis is not available. Some features like rate limiting and session revocation will be disabled or degraded.")
	} else {
		log.Info().Msg("Connected to Redis successfully")
	}

	return client, nil
}
