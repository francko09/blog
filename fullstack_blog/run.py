from app import create_app, db
from app.models import Article # Assurez-vous que les modèles sont importés pour la création des tables

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Crée les tables si elles n'existent pas
    app.run(debug=True)
