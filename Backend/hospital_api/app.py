from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import JWT_SECRET_KEY

from routes_auth import auth_bp
from routes_patients import patients_bp
from routes_profile import profile_bp
from routes_reports import reports_bp
from routes_diagnosis import diagnosis_bp

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
jwt = JWTManager(app)

app.register_blueprint(auth_bp)
app.register_blueprint(patients_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(diagnosis_bp)

if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(debug=True)
