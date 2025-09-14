# Train a new Rasa model
train:
	docker-compose run --rm rasa-train

# Start the bot (API + Action Server)
up:
	docker-compose up rasa action_server

# Stop everything
down:
	docker-compose down

# Reload the latest trained model into the running Rasa server
reload:
	@latest_model=$$(ls -t models/*.tar.gz | head -n 1) && \
	echo "Reloading model: $$latest_model" && \
	curl -s -X POST \
	  http://localhost:5005/model \
	  -H "Content-type: multipart/form-data" \
	  -F "model=@$$latest_model"

# Clean old models except the latest 2
clean-models:
	ls -t models/*.tar.gz | tail -n +3 | xargs -r rm -f
