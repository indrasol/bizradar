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

# JWT - Using Supabase's default JWT secret
# This should match the JWT_SECRET in your Supabase project settings
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", os.getenv("JWT_SECRET", "your-supabase-jwt-secret"))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days (matching Supabase's default)

# Stripe
# Print Stripe keys for debugging
print(f"Loading Stripe keys - Secret: {'*' * 20}{os.getenv('STRIPE_SECRET_KEY', '')[-4:] if os.getenv('STRIPE_SECRET_KEY') else 'Not set'}")
print(f"Loading Stripe keys - Publishable: {os.getenv('STRIPE_PUBLISHABLE_KEY', '')[:8]}...")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Verify Stripe keys are loaded
if not STRIPE_SECRET_KEY:
    print("WARNING: STRIPE_SECRET_KEY is not set in environment variables")
if not STRIPE_PUBLISHABLE_KEY:
    print("WARNING: STRIPE_PUBLISHABLE_KEY is not set in environment variables")

# CACHE DB REDIS
REDIS_HOST = os.getenv("REDISHOSTBIZ")
REDIS_PORT = os.getenv("REDISPORTBIZ")
REDIS_USERNAME = os.getenv("REDISUSERNAMEBIZ")
REDIS_PASSWORD = os.getenv("REDISPASSWORDBIZ")

# Stripe
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
def get_stripe_secret_key():
    return os.getenv('STRIPE_SECRET_KEY', '')
#OTHERS
IMPORT_USER=os.getenv("IMPORTUSERBIZ")

# Email (SendGrid)
SENDGRID_API_KEY = os.getenv("SENDGRIDAPIKEYBIZ")
# SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@bizradar.com")

#Stripe
STRIPE_SECRET_KEY=os.getenv("STRIPESECRETKEYBIZ")
STRIPE_PUBLISHABLE_KEY=os.getenv("STRIPEPUBLISHABLEKEYBIZ")




