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
            'user_id': self.user_id
        }

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=False)

    # Relations inverses (déjà définies par backref dans User et Article si on les ajoute là-bas)
    # author = db.relationship('User', backref=db.backref('comments_written', lazy='dynamic')) # Exemple
    # article_commented = db.relationship('Article', backref=db.backref('article_comments', lazy='dynamic')) # Exemple

    def __repr__(self):
        return f'<Comment {self.id} by User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'author_username': self.author.username if self.author else "Inconnu", # Nécessite que la relation 'author' soit définie
            'article_id': self.article_id,
            'user_id': self.user_id
        }

# Ajout des relations inverses dans User et Article pour les commentaires
User.comments = db.relationship('Comment', backref='author', lazy='dynamic', foreign_keys=[Comment.user_id])
Article.comments = db.relationship('Comment', backref='article_ref', lazy='dynamic', foreign_keys=[Comment.article_id])
# Note: 'author' dans Comment sera le backref de User.comments
#       'article_ref' dans Comment sera le backref de Article.comments

# Table d'association pour les Likes
article_likes = db.Table('article_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('article_id', db.Integer, db.ForeignKey('article.id'), primary_key=True)
)

# Ajout de la relation 'liked_articles' à User
User.liked_articles = db.relationship(
    'Article', secondary=article_likes,
    backref=db.backref('likers', lazy='dynamic'), # Permet article.likers
    lazy='dynamic'
)

# Méthodes pour liker/unliker un article dans le modèle User
def like_article(self, article):
    if not self.has_liked_article(article):
        self.liked_articles.append(article)

def unlike_article(self, article):
    if self.has_liked_article(article):
        self.liked_articles.remove(article)

def has_liked_article(self, article):
    return article in self.liked_articles.all() # .all() est important pour les relations lazy='dynamic'

# Attacher les méthodes au modèle User
User.like_article = like_article
User.unlike_article = unlike_article
User.has_liked_article = has_liked_article

# Table d'association pour les Favoris
user_favorites = db.Table('user_favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('article_id', db.Integer, db.ForeignKey('article.id'), primary_key=True)
)

# Ajout de la relation 'favorited_articles' à User
User.favorited_articles = db.relationship(
    'Article', secondary=user_favorites,
    backref=db.backref('bookmarked_by', lazy='dynamic'), # Permet article.bookmarked_by
    lazy='dynamic'
)

# Méthodes pour ajouter/retirer des favoris dans le modèle User
def add_to_favorites(self, article):
    if not self.has_favorited_article(article):
        self.favorited_articles.append(article)

def remove_from_favorites(self, article):
    if self.has_favorited_article(article):
        self.favorited_articles.remove(article)

def has_favorited_article(self, article):
    return article in self.favorited_articles.all()

# Attacher les nouvelles méthodes au modèle User
User.add_to_favorites = add_to_favorites
User.remove_from_favorites = remove_from_favorites
User.has_favorited_article = has_favorited_article


# Mettre à jour Article.to_dict() pour inclure le nombre de likes
# La vérification si l'utilisateur actuel a liké/favorisé sera faite dans la route ou le template
original_article_to_dict = Article.to_dict # Réassigner pour éviter les appels récursifs si déjà modifié
def article_to_dict_extended(self):
    data = original_article_to_dict(self) # Appelle la version précédente de to_dict (qui inclut déjà les likes)
    data['favorites_count'] = self.bookmarked_by.count() # Ajoute le compteur de favoris
    # 'current_user_has_favorited' sera ajouté dynamiquement par la route si nécessaire
    return data
Article.to_dict = article_to_dict_extended
