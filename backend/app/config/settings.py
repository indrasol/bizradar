import os 
from dotenv import load_dotenv

load_dotenv()

env = os.getenv('ENV', 'development')

# if env == 'development':
#     load_dotenv('.env.dev')
# elif env == 'production':
#     load_dotenv('.env.prod')

# Main
title = os.getenv("title")
description = os.getenv("description")
version = os.getenv("version")

print(f"title: {title}, description: {description}, version: {version}")

# SAM.GOV
SAM_API_KEY = os.getenv("SAMAPIKEY")


#DB
DB_HOST=os.getenv("DBHOSTBIZ")
DB_PORT=os.getenv("DBPORTBIZ")
DB_NAME=os.getenv("DBNAMEBIZ")
DB_USER=os.getenv("DBUSERBIZ")
DB_PASSWORD=os.getenv("DBPASSWORDBIZ")

#AI
OPENAI_API_KEY=os.getenv("OPENAIAPIKEYBIZ")

#VECTOR DB
PINECONE_API_KEY=os.getenv("PINECONEAPIKEYBIZ");
PINECONE_ENV=os.getenv("PINECONEENVBIZ")
PINECONE_INDEX_NAME=os.getenv("PINECONEINDEXNAMEBIZ")
EMBEDDING_MODEL=os.getenv("EMBEDDINGMODELBIZ")

#GITHUB
GITHUB_TOKEN=os.getenv("GITHUB_TOKEN")
GITHUB_REPO=os.getenv("GITHUB_REPO")
GITHUB_OWNER=os.getenv("GITHUB_OWNER")

#CACHE DB REDIS
REDIS_HOST=os.getenv("REDISHOSTBIZ")
REDIS_PORT=os.getenv("REDISPORTBIZ")
REDIS_USERNAME=os.getenv("REDISUSERNAMEBIZ")
REDIS_PASSWORD=os.getenv("REDISPASSWORDBIZ")

#OTHERS
IMPORT_USER=os.getenv("IMPORTUSERBIZ")

# Email (SendGrid)
SENDGRID_API_KEY = os.getenv("SENDGRIDAPIKEY")
# SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@bizradar.com")




