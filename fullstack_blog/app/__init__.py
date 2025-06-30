from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # Créer le dossier uploads s'il n'existe pas
    upload_folder = app.config.get('UPLOAD_FOLDER')
    if upload_folder and not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    elif not upload_folder:
        # Gérer le cas où UPLOAD_FOLDER n'est pas défini, peut-être logger un avertissement
        app.logger.warning("UPLOAD_FOLDER n'est pas configuré.")


    # Importation et enregistrement du Blueprint
    from app.routes import main_bp  # Importation du Blueprint
    app.register_blueprint(main_bp) # Enregistrement du Blueprint

    # Importation des modèles pour s'assurer qu'ils sont connus de SQLAlchemy avant db.create_all()
    from app import models

    return app
