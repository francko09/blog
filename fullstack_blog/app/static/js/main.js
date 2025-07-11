// Fonction pour gérer le mode sombre
function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const sunIcon = '☀️'; // Caractère Unicode pour le soleil
    const moonIcon = '🌙'; // Caractère Unicode pour la lune

    // Fonction pour mettre à jour l'icône du bouton
    function updateIcon() {
        if (body.classList.contains('dark-mode')) {
            darkModeToggle.innerHTML = sunIcon; // Affiche soleil si mode sombre actif
            darkModeToggle.setAttribute('title', 'Passer en mode clair');
        } else {
            darkModeToggle.innerHTML = moonIcon; // Affiche lune si mode clair actif
            darkModeToggle.setAttribute('title', 'Passer en mode sombre');
        }
    }

    // Appliquer le mode sombre au chargement et définir l'icône initiale
    if (localStorage.getItem('darkMode') === 'enabled' ||
        (localStorage.getItem('darkMode') === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        body.classList.add('dark-mode');
    }
    if (darkModeToggle) updateIcon(); // Mettre à jour l'icône après avoir potentiellement ajouté la classe

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.setItem('darkMode', 'disabled');
            }
            updateIcon(); // Mettre à jour l'icône après chaque clic
        });
    }
}

// Fonction pour charger et afficher les articles
// Prend currentUserId en argument, qui peut être null si l'utilisateur n'est pas connecté.
async function loadArticles(currentUserId) {
    const articlesListDiv = document.getElementById('articles-list');
    if (!articlesListDiv) return;

    try {
        const response = await fetch('/api/articles');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const articles = await response.json();

        if (articles.length === 0) {
            articlesListDiv.innerHTML = '<p>Aucun article à afficher pour le moment.</p>';
            return;
        }

        articlesListDiv.innerHTML = '';
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('article');
            articleElement.setAttribute('id', `article-${article.id}`);

            // Vérifier si l'article a été lu
            let readArticles = JSON.parse(localStorage.getItem('readArticles')) || [];
            let isRead = readArticles.includes(article.id);
            if (isRead) {
                articleElement.classList.add('article-read'); // Ajoute une classe pour styler différemment
            }

            let imageHTML = '';
            if (article.image_url) {
                // Envelopper l'image dans le conteneur pour le ratio carré
                imageHTML = `
                    <div class="article-list-image-container">
                        <img src="${article.image_url}" alt="${escapeHTML(article.title)}">
                    </div>
                `;
            }

            let actionsHTML = '';
            if (currentUserId && article.user_id === currentUserId) {
                actionsHTML = `
                    <a href="/article/${article.id}/edit" class="edit-link action-link" style="margin-left: 10px;">Modifier</a>
                    <button class="delete-button action-link" data-article-id="${article.id}" style="margin-left: 10px;">Supprimer</button>
                `;
            }

            let readStatusHTML = isRead ? '<span class="read-status">(Déjà lu)</span>' : '';

            articleElement.innerHTML = `
                <h2>${escapeHTML(article.title)} ${readStatusHTML}</h2>
                <p><small>Par: ${escapeHTML(article.author_username)} | Publié le: ${new Date(article.created_at).toLocaleDateString()}</small></p>
                <p>${escapeHTML(article.content.substring(0, 200))}...</p>
                ${imageHTML}
                <div class="article-actions">
                    <a href="/article/${article.id}" class="action-link">Lire la suite</a>
                    ${actionsHTML}
                </div>
            `;
            articlesListDiv.appendChild(articleElement);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteArticle);
        });

    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        articlesListDiv.innerHTML = '<p>Erreur lors du chargement des articles. Veuillez réessayer plus tard.</p>';
    }
}

// Fonction pour gérer la suppression d'un article
async function handleDeleteArticle(event) {
    const articleId = event.target.dataset.articleId;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet article (ID: ${articleId}) ?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/articles/${articleId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const articleElement = document.getElementById(`article-${articleId}`);
            if (articleElement) {
                articleElement.remove();
            }
            console.log(`Article ${articleId} supprimé.`);

            const articlesListDiv = document.getElementById('articles-list');
            if (articlesListDiv && articlesListDiv.children.length === 0) {
                articlesListDiv.innerHTML = '<p>Aucun article à afficher pour le moment.</p>';
            }
        } else {
            const result = await response.json().catch(() => ({ error: 'Réponse non JSON ou vide de l\'API' }));
            alert(`Erreur lors de la suppression: ${result.error || response.statusText || 'Erreur inconnue de l\'API'}`);
        }
    } catch (error) {
        console.error('Erreur réseau lors de la suppression:', error);
        alert('Erreur réseau lors de la suppression de l\'article.');
    }
}


// Fonction pour gérer la soumission du formulaire de création d'article
function handleCreateArticleForm() {
    const form = document.getElementById('create-article-form');
    if (!form) return;

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
            messageArea.textContent = '';
            messageArea.className = '';
        }

        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                if (messageArea) {
                    messageArea.textContent = 'Article créé avec succès ! Redirection...';
                    messageArea.classList.add('success');
                }
                form.reset();
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                if (messageArea) {
                    messageArea.textContent = `Erreur: ${result.error || response.statusText || 'Erreur inconnue'}`;
                    messageArea.classList.add('error');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            if (messageArea) {
                messageArea.textContent = 'Une erreur réseau s\'est produite lors de la soumission. Veuillez réessayer.';
                messageArea.classList.add('error');
            }
        }
    });
}

// Fonction utilitaire simple pour échapper le HTML et prévenir les attaques XSS
function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// La fonction showArticleDetail n'est plus nécessaire car on redirige directement.
// function showArticleDetail(articleId) {
//     alert(`Affichage du détail pour l'article ID: ${articleId}. (Fonctionnalité de page de détail non implémentée)`);
// }

// Initialisation du mode sombre et autres fonctionnalités globales au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    setupDarkModeToggle();

    // Les appels spécifiques à des pages (comme loadArticles, handleCreateArticleForm)
    // sont toujours initiés depuis les scripts en ligne dans ces pages HTML spécifiques
    // pour s'assurer que les éléments nécessaires (currentUserId, formulaires) sont disponibles.
});
