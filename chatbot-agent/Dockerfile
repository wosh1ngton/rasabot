# Use Rasa Open Source 3.6.20 full image
FROM rasa/rasa:3.6.20-full

# Install specific spaCy version and Portuguese model
USER root

RUN pip install spacy==3.4.1 \
 && python -m spacy download pt_core_news_md
# switch back to non-root (if needed)
USER 1001

# Set working directory
WORKDIR /app

# Copy project files (optional, for initial build)
COPY . /app
