from app import db # db est initialisé dans app/__init__.py
from datetime import datetime
from flask_login import UserMixin # Nécessaire pour Flask-Login
from werkzeug.security import generate_password_hash, check_password_hash

# Association pour la relation User <-> Article (un auteur peut avoir plusieurs articles)
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256)) # Augmenté la taille pour bcrypt
    articles = db.relationship('Article', backref='author', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_filename = db.Column(db.String(100), nullable=True) # Nom du fichier image
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Clé étrangère

    def __repr__(self):
        return f'<Article {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'image_url': f'/uploads/{self.image_filename}' if self.image_filename else None,
            'created_at': self.created_at.isoformat(),
            'author_username': self.author.username if self.author else "Inconnu",
            'user_id': self.user_id # Ajout de user_id pour la comparaison côté client
        }
