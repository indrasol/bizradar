from flask import Flask
from flask_cors import CORS
from routes.search_routes import search_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register the search routes blueprint
app.register_blueprint(search_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Ensure the server is running on port 5000