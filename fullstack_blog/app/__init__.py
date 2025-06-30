from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager # Ajout de Flask-Login
from flask_bcrypt import Bcrypt # Ajout de Flask-Bcrypt
import os

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager() # Initialisation de LoginManager
bcrypt = Bcrypt() # Initialisation de Bcrypt

# Configuration pour Flask-Login
login_manager.login_view = 'main.login' # Nom de la route de connexion (Blueprint 'main', fonction 'login')
login_manager.login_message = "Veuillez vous connecter pour accéder à cette page."
login_manager.login_message_category = "info" # Catégorie de message flash

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app) # Initialisation de LoginManager avec l'app
    bcrypt.init_app(app) # Initialisation de Bcrypt avec l'app

    # Créer le dossier uploads s'il n'existe pas
    upload_folder = app.config.get('UPLOAD_FOLDER')
    if upload_folder and not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    elif not upload_folder:
        app.logger.warning("UPLOAD_FOLDER n'est pas configuré.")

    # Importation des modèles pour les rendre disponibles
    from app import models

    # Fonction de chargement de l'utilisateur pour Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return models.User.query.get(int(user_id))

    # Importation et enregistrement du Blueprint
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    return app
