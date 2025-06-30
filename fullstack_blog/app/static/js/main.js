// Fonction pour charger et afficher les articles
async function loadArticles() {
    const articlesListDiv = document.getElementById('articles-list');
    if (!articlesListDiv) return; // S'assurer que l'élément existe

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

        articlesListDiv.innerHTML = ''; // Vider le message de chargement
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('article');

            let imageHTML = '';
            if (article.image_url) {
                // Utiliser l'URL relative fournie par l'API
                imageHTML = `<img src="${article.image_url}" alt="${article.title}">`;
            }

            articleElement.innerHTML = `
                <h2>${escapeHTML(article.title)}</h2>
                <p>${escapeHTML(article.content.substring(0, 200))}...</p>
                ${imageHTML}
                <p><small>Publié le: ${new Date(article.created_at).toLocaleDateString()}</small></p>
                <a href="#" onclick="showArticleDetail(${article.id}); return false;">Lire la suite</a>
            `;
            // Note: showArticleDetail n'est pas encore implémenté, nécessiterait une nouvelle page ou un modal.
            // Pour l'instant, "Lire la suite" ne fera rien de plus que ce qui est affiché.
            // On pourrait aussi créer une page article.html et y lier directement.
            articlesListDiv.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        articlesListDiv.innerHTML = '<p>Erreur lors du chargement des articles. Veuillez réessayer plus tard.</p>';
    }
}

// Fonction pour gérer la soumission du formulaire de création d'article
function handleCreateArticleForm() {
    const form = document.getElementById('create-article-form');
    if (!form) return; // S'assurer que le formulaire existe

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const messageArea = document.getElementById('message-area');
        messageArea.textContent = ''; // Vider les messages précédents
        messageArea.className = ''; // Retirer les classes de style précédentes

        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                body: formData // FormData gère automatiquement le Content-Type pour multipart/form-data
            });

            const result = await response.json();

            if (response.ok) {
                messageArea.textContent = 'Article créé avec succès ! Redirection...';
                messageArea.classList.add('success');
                form.reset(); // Réinitialiser le formulaire
                setTimeout(() => {
                    window.location.href = '/'; // Rediriger vers la page d'accueil
                }, 2000);
            } else {
                messageArea.textContent = `Erreur: ${result.error || response.statusText}`;
                messageArea.classList.add('error');
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            messageArea.textContent = 'Une erreur s\'est produite lors de la soumission. Veuillez réessayer.';
            messageArea.classList.add('error');
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


// Appels initiaux (si les éléments sont sur la page courante)
// Ces fonctions sont appelées via les scripts en ligne dans les HTML respectifs
// après que le DOM soit chargé.
// document.addEventListener('DOMContentLoaded', function() {
//     loadArticles(); // Appelé depuis index.html
//     handleCreateArticleForm(); // Appelé depuis create_article.html
// });

// Fonction pour afficher le détail d'un article (placeholder)
// Pour une vraie implémentation, on pourrait:
// 1. Naviguer vers une nouvelle page article_detail.html?id=<article.id>
// 2. Afficher les détails dans un modal sur la page actuelle.
function showArticleDetail(articleId) {
    alert(`Affichage du détail pour l'article ID: ${articleId}. Fonctionnalité à implémenter.`);
    // Exemple de redirection:
    // window.location.href = `/article_detail?id=${articleId}`;
    // Ou si on utilise une route Flask pour servir la page de détail:
    // window.location.href = `/article/${articleId}`; // Assurez-vous que cette route existe
}
