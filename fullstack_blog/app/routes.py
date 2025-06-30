from flask import Blueprint, request, jsonify, current_app, send_from_directory, render_template, flash, redirect, url_for, abort
from app import db, bcrypt # Importer db et bcrypt depuis le package app
from app.models import Article, User # Importer User
from flask_login import login_user, logout_user, current_user, login_required
import os
from werkzeug.utils import secure_filename
# import uuid # Décommenter si vous utilisez UUID pour les noms de fichiers

# Création d'un Blueprint nommé 'main'
main_bp = Blueprint('main', __name__, template_folder='templates', static_folder='static')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# --- Routes d'Authentification ---
@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        flash('Vous êtes déjà connecté.', 'info')
        return redirect(url_for('main.serve_index'))

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not username or not email or not password or not confirm_password:
            flash('Tous les champs sont requis.', 'danger')
            return render_template('register.html')

        if password != confirm_password:
            flash('Les mots de passe ne correspondent pas.', 'danger')
            return render_template('register.html')

        existing_user_by_username = User.query.filter_by(username=username).first()
        if existing_user_by_username:
            flash('Ce nom d\'utilisateur est déjà utilisé.', 'danger')
            return render_template('register.html')

        existing_user_by_email = User.query.filter_by(email=email).first()
        if existing_user_by_email:
            flash('Cet email est déjà utilisé.', 'danger')
            return render_template('register.html')

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('Inscription réussie ! Veuillez vous connecter.', 'success')
        return redirect(url_for('main.login'))

    return render_template('register.html')

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        flash('Vous êtes déjà connecté.', 'info')
        return redirect(url_for('main.serve_index'))

    if request.method == 'POST':
        username_or_email = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

        if not username_or_email or not password:
            flash('Nom d\'utilisateur/Email et mot de passe requis.', 'danger')
            return render_template('login.html')

        user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()

        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('Connexion réussie !', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.serve_index'))
        else:
            flash('Échec de la connexion. Vérifiez vos identifiants.', 'danger')
            return render_template('login.html')

    return render_template('login.html')

@main_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté.', 'success')
    return redirect(url_for('main.serve_index'))


# --- Routes API pour les Articles ---
@main_bp.route('/api/articles', methods=['POST'])
@login_required
def create_article_api():
    data = request.form
    title = data.get('title')
    content = data.get('content')

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400

    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename == '':
            pass
        elif file and allowed_file(file.filename):
            image_filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename)
            file.save(file_path)
        elif file:
            return jsonify({'error': 'File type not allowed or no file selected'}), 400

    author_id = current_user.id
    new_article = Article(title=title, content=content, image_filename=image_filename, user_id=author_id)
    db.session.add(new_article)
    db.session.commit()
    return jsonify(new_article.to_dict()), 201

@main_bp.route('/api/articles', methods=['GET'])
def get_articles_api():
    articles = Article.query.order_by(Article.created_at.desc()).all()
    return jsonify([article.to_dict() for article in articles]), 200

@main_bp.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article_api(article_id):
    article = Article.query.get_or_404(article_id)
    return jsonify(article.to_dict()), 200

@main_bp.route('/api/articles/<int:article_id>/edit', methods=['POST'])
@login_required
def edit_article_api(article_id):
    article = Article.query.get_or_404(article_id)
    if article.author != current_user:
        return jsonify({'error': 'Action non autorisée'}), 403

    data = request.form
    title = data.get('title')
    content = data.get('content')

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400

    article.title = title
    article.content = content

    if 'image' in request.files:
        file = request.files['image']
        if file.filename == '':
            pass
        elif file and allowed_file(file.filename):
            if article.image_filename and article.image_filename != file.filename:
                try:
                    os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], article.image_filename))
                except OSError:
                    pass
            article.image_filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], article.image_filename)
            file.save(file_path)
        elif file:
             return jsonify({'error': 'File type not allowed for new image'}), 400

    db.session.commit()
    return jsonify(article.to_dict()), 200

@main_bp.route('/api/articles/<int:article_id>', methods=['DELETE'])
@login_required
def delete_article_api(article_id):
    article = Article.query.get_or_404(article_id)
    if article.author != current_user:
        return jsonify({'error': 'Action non autorisée'}), 403

    if article.image_filename:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], article.image_filename))
        except OSError as e:
            current_app.logger.error(f"Erreur lors de la suppression du fichier image {article.image_filename}: {e}")
            pass

    db.session.delete(article)
    db.session.commit()
    return jsonify({'message': 'Article supprimé avec succès'}), 200


# --- Routes pour servir les fichiers statiques et les pages HTML ---
@main_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@main_bp.route('/')
def serve_index():
    return render_template('index.html')

@main_bp.route('/article/<int:article_id>')
def serve_article_detail(article_id):
    article = Article.query.get_or_404(article_id)
    return render_template('article_detail.html', article=article)

@main_bp.route('/create-article')
@login_required
def serve_create_article_form():
    return render_template('create_article.html')

@main_bp.route('/article/<int:article_id>/edit', methods=['GET'])
@login_required
def serve_edit_article_form(article_id):
    article = Article.query.get_or_404(article_id)
    if article.author != current_user:
        flash("Vous n'êtes pas autorisé à modifier cet article.", "danger")
        abort(403)
    return render_template('edit_article.html', article=article)
