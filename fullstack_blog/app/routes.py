from flask import Blueprint, request, jsonify, current_app, send_from_directory, render_template
from app import db # Importer db directement depuis le package app
from app.models import Article
import os
from werkzeug.utils import secure_filename
# import uuid # Décommenter si vous utilisez UUID pour les noms de fichiers

# Création d'un Blueprint nommé 'main'
main_bp = Blueprint('main', __name__, template_folder='templates', static_folder='static')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# --- Routes API ---
@main_bp.route('/api/articles', methods=['POST'])
def create_article_api():
    data = request.form
    title = data.get('title')
    content = data.get('content')

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400

    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename == '': # Aucun fichier sélectionné
            pass # image_filename restera None
        elif file and allowed_file(file.filename):
            image_filename = secure_filename(file.filename)
            # Pour éviter les conflits de noms de fichiers, on pourrait ajouter un timestamp ou un UUID
            # Par exemple: image_filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename)
            file.save(file_path)
        elif file: # Si un fichier est présent mais non autorisé ou sans nom
            return jsonify({'error': 'File type not allowed or no file selected'}), 400

    new_article = Article(title=title, content=content, image_filename=image_filename)
    db.session.add(new_article)
    db.session.commit()

    return jsonify(new_article.to_dict()), 201

@main_bp.route('/api/articles', methods=['GET'])
def get_articles_api():
    articles = Article.query.order_by(Article.created_at.desc()).all()
    return jsonify([article.to_dict() for article in articles]), 200

@main_bp.route('/api/articles/<int:id>', methods=['GET'])
def get_article_api(id):
    article = Article.query.get_or_404(id)
    return jsonify(article.to_dict()), 200

# --- Routes pour servir les fichiers statiques et les images uploadées ---
@main_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# --- Routes pour servir les pages HTML (Frontend) ---
@main_bp.route('/')
def serve_index():
    return render_template('index.html')

@main_bp.route('/create-article')
def serve_create_article_form():
    return render_template('create_article.html')

# Route de test (peut être supprimée ou modifiée)
# @main_bp.route('/test-backend')
# def test_backend_route():
#     return "Backend du blog est en marche !"
