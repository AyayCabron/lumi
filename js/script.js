class MediaLibrary {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('mediaLibrary')) || [];
        this.currentItemId = null;
        this.apiKeys = {
            omdb: 'b9a37c2b', 
            googleBooks: 'AIzaSyBkLvW2K2Jq9yJ6Q7X9X8X7X6X5X4X3X2X1X0' 
        };
        this.currentSearchResults = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkFirstTimeUser();
        this.loadDashboard();
        this.updateYearFilters();
        

        this.fixViewportZoom();
    }


    fixViewportZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }


    checkFirstTimeUser() {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial && this.items.length === 0) {
            document.getElementById('welcome-tutorial').classList.add('active');
        }
    }


    setupEventListeners() {

        document.querySelectorAll('.next-slide').forEach(button => {
            button.addEventListener('click', (e) => {
                const nextSlide = e.target.getAttribute('data-next');
                this.showTutorialSlide(nextSlide);
            });
        });

        document.querySelectorAll('.prev-slide').forEach(button => {
            button.addEventListener('click', (e) => {
                const prevSlide = e.target.getAttribute('data-prev');
                this.showTutorialSlide(prevSlide);
            });
        });

        document.getElementById('start-using').addEventListener('click', () => {
            localStorage.setItem('hasSeenTutorial', 'true');
            document.getElementById('welcome-tutorial').classList.remove('active');
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('welcome-tutorial').classList.add('active');
            this.showTutorialSlide('1');
        });


        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(e.target.getAttribute('data-page'));
            });
        });


        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.openItemModal();
        });

        document.getElementById('add-item-btn-dashboard').addEventListener('click', () => {
            this.openItemModal();
        });

        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeItemModal();
        });

        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });


        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchFormTab(tabId);
            });
        });

   
        document.getElementById('search-api-btn').addEventListener('click', () => {
            this.searchItemByAPI();
        });

        document.querySelectorAll('.rating-input .star').forEach(star => {
            star.addEventListener('click', (e) => {
                const value = parseInt(e.target.getAttribute('data-value'));
                this.setRating(value);
            });

            star.addEventListener('mouseover', (e) => {
                const value = parseInt(e.target.getAttribute('data-value'));
                this.highlightStars(value);
            });
        });

        document.querySelector('.rating-input').addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('item-rating').value) || 0;
            this.highlightStars(currentRating);
        });


        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteItem(this.currentItemId);
            this.closeConfirmModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeConfirmModal();
        });

 
        document.getElementById('search-input').addEventListener('input', () => {
            this.filterLibrary();
        });

        document.getElementById('type-filter').addEventListener('change', () => {
            this.filterLibrary();
        });

        document.getElementById('year-filter').addEventListener('change', () => {
            this.filterLibrary();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.filterLibrary();
        });

        document.getElementById('ranking-year').addEventListener('change', () => {
            this.loadRanking();
        });

        document.getElementById('ranking-type').addEventListener('change', () => {
            this.loadRanking();
        });


        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }


    showTutorialSlide(slideNumber) {
        document.querySelectorAll('.tutorial-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        document.getElementById(`slide-${slideNumber}`).classList.add('active');
    }


    switchFormTab(tabId) {

        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    }


    showPage(pageId) {

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');


        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        switch(pageId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'library':
                this.loadLibrary();
                break;
            case 'favorites':
                this.loadFavorites();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
            case 'ranking':
                this.loadRanking();
                break;
        }
    }


    loadDashboard() {

        const books = this.items.filter(item => item.type === 'book');
        const movies = this.items.filter(item => item.type === 'movie');
        const series = this.items.filter(item => item.type === 'series');
        
        document.getElementById('total-books').textContent = books.length;
        document.getElementById('total-movies').textContent = movies.length;
        document.getElementById('total-series').textContent = series.length;
        
        const ratedItems = this.items.filter(item => item.rating);
        const avgRating = ratedItems.length > 0 
            ? (ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length).toFixed(1)
            : '0.0';
        document.getElementById('avg-rating').textContent = avgRating;


        const recentItems = [...this.items]
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, 6);
        
        this.renderItems(recentItems, 'recent-items');
    }


    loadLibrary() {
        this.filterLibrary();
    }


    filterLibrary() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const typeFilter = document.getElementById('type-filter').value;
        const yearFilter = document.getElementById('year-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        let filteredItems = this.items;


        if (searchTerm) {
            filteredItems = filteredItems.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                (item.authorDirector && item.authorDirector.toLowerCase().includes(searchTerm)) ||
                (item.genre && item.genre.toLowerCase().includes(searchTerm))
            );
        }

        if (typeFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.type === typeFilter);
        }

        if (yearFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.year == yearFilter);
        }

        if (statusFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.status === statusFilter);
        }

        this.renderItems(filteredItems, 'library-grid');
    }


    loadFavorites() {
        const favorites = this.items.filter(item => item.favorite);
        this.renderItems(favorites, 'favorites-grid');
    }


    loadStatistics() {

        document.getElementById('stat-total').textContent = this.items.length;
        document.getElementById('stat-favorites').textContent = this.items.filter(item => item.favorite).length;
        document.getElementById('stat-completed').textContent = this.items.filter(item => item.status === 'completed').length;
        
        const ratedItems = this.items.filter(item => item.rating);
        const avgRating = ratedItems.length > 0 
            ? (ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length).toFixed(1)
            : '0.0';
        document.getElementById('stat-avg-rating').textContent = avgRating;

  
        this.renderTypeChart();
        
  
        this.renderRatingChart();
    }


    loadRanking() {
        const selectedYear = document.getElementById('ranking-year').value;
        const selectedType = document.getElementById('ranking-type').value;
        

        let itemsToRank = this.items;
        if (selectedYear !== 'all') {
            itemsToRank = itemsToRank.filter(item => {
                const itemYear = new Date(item.addedDate).getFullYear();
                return itemYear == selectedYear;
            });
        }

        if (selectedType !== 'all') {
            itemsToRank = itemsToRank.filter(item => item.type === selectedType);
        }


        const rankedItems = [...itemsToRank]
            .filter(item => item.rating) 
            .sort((a, b) => b.rating - a.rating);

        this.renderRanking(rankedItems);
    }


    renderItems(items, containerId) {
        const container = document.getElementById(containerId);
        
        if (items.length === 0) {
            let emptyMessage = '';
            switch(containerId) {
                case 'recent-items':
                    emptyMessage = '<p>Sua biblioteca está vazia</p><button class="btn btn-primary" onclick="library.openItemModal()">Adicionar Primeiro Item</button>';
                    break;
                case 'favorites-grid':
                    emptyMessage = '<p>Nenhum favorito ainda</p><p class="empty-state-sub">Marque itens como favoritos para vê-los aqui</p>';
                    break;
                default:
                    emptyMessage = '<p>Nenhum item encontrado</p><button class="btn btn-primary" onclick="library.openItemModal()">Adicionar Item</button>';
            }
            
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="card" data-id="${item.id}">
                <img src="${item.image || this.getDefaultImage(item.type)}" alt="${item.title}" class="card-img" onerror="this.src='${this.getDefaultImage(item.type)}'">
                <div class="card-actions">
                    <button class="card-action-btn favorite ${item.favorite ? 'active' : ''}" onclick="library.toggleFavorite('${item.id}')" title="${item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="card-action-btn" onclick="library.openItemModal('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-btn" onclick="library.openConfirmModal('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-content">
                    <div class="card-title">${item.title}</div>
                    <div class="card-meta">
                        <span>${item.year || 'N/A'}</span>
                        <span class="card-rating">${this.getRatingStars(item.rating)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }


    getRatingStars(rating) {
        if (!rating) return 'Sem avaliação';
        
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }


    renderRanking(items) {
        const container = document.getElementById('ranking-list');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>Nenhum item para ranking</p>
                    <p class="empty-state-sub">Adicione itens com avaliações para ver o ranking</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map((item, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <img src="${item.image || this.getDefaultImage(item.type)}" alt="${item.title}">
                <div class="ranking-item-info">
                    <div class="ranking-item-title">${item.title}</div>
                    <div class="ranking-item-meta">
                        <span>${this.getTypeLabel(item.type)}</span>
                        <span>${item.year || 'N/A'}</span>
                        <span class="card-rating">${this.getRatingStars(item.rating)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }


    async searchItemByAPI() {
        const type = document.getElementById('search-type').value;
        const query = document.getElementById('search-query').value.trim();
        
        if (!type) {
            this.showNotification('Por favor, selecione um tipo (livro, filme ou série)', 'error');
            return;
        }
        
        if (!query) {
            this.showNotification('Por favor, digite um título para buscar', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            let results = [];
            
            if (type === 'book') {
                results = await this.searchGoogleBooks(query);
            } else {
                results = await this.searchOMDB(query, type);
            }
            
            this.displaySearchResults(results, type);
        } catch (error) {
            console.error('Erro na busca:', error);
            this.showNotification('Erro ao buscar item. Tente novamente.', 'error');
        }
        
        this.showLoading(false);
    }


    async searchGoogleBooks(query) {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
        const data = await response.json();
        
        if (!data.items) return [];
        
        return data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                title: volumeInfo.title,
                authorDirector: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor desconhecido',
                year: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : null,
                genre: volumeInfo.categories ? volumeInfo.categories[0] : null,
                image: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail.replace('http://', 'https://') : null,
                description: volumeInfo.description
            };
        });
    }


    async searchOMDB(query, type) {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${this.apiKeys.omdb}&s=${encodeURIComponent(query)}&type=${type === 'movie' ? 'movie' : 'series'}`);
        const data = await response.json();
        
        if (data.Response === 'False') return [];
        

        const detailedResults = await Promise.all(
            data.Search.slice(0, 5).map(async (item) => {
                try {
                    const detailResponse = await fetch(`https://www.omdbapi.com/?apikey=${this.apiKeys.omdb}&i=${item.imdbID}`);
                    const detailData = await detailResponse.json();
                    
                    return {
                        title: detailData.Title,
                        authorDirector: detailData.Director !== 'N/A' ? detailData.Director : detailData.Writer !== 'N/A' ? detailData.Writer : 'Diretor desconhecido',
                        year: detailData.Year !== 'N/A' ? detailData.Year.replace(/–.*/, '') : null,
                        genre: detailData.Genre !== 'N/A' ? detailData.Genre.split(',')[0] : null,
                        image: detailData.Poster !== 'N/A' ? detailData.Poster : null,
                        description: detailData.Plot !== 'N/A' ? detailData.Plot : null
                    };
                } catch (error) {
                    console.error('Erro ao buscar detalhes:', error);
                    return null;
                }
            })
        );
        
        return detailedResults.filter(item => item !== null);
    }


    displaySearchResults(results, type) {
        const container = document.getElementById('search-results');
        this.currentSearchResults = results;
        
        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state-small"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
            return;
        }
        
        container.innerHTML = results.map((result, index) => `
            <div class="search-result-item" data-index="${index}">
                <img src="${result.image || this.getDefaultImage(type)}" alt="${result.title}" onerror="this.src='${this.getDefaultImage(type)}'">
                <div class="search-result-info">
                    <h3>${result.title}</h3>
                    <p><strong>${type === 'book' ? 'Autor' : 'Diretor'}:</strong> ${result.authorDirector || 'N/A'}</p>
                    <p><strong>Ano:</strong> ${result.year || 'N/A'}</p>
                    <p><strong>Gênero:</strong> ${result.genre || 'N/A'}</p>
                </div>
            </div>
        `).join('');
        

        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                this.fillFormWithResult(results[index], type);
            });
        });
    }


    fillFormWithResult(result, type) {

        this.switchFormTab('manual-tab');
        

        document.getElementById('item-type').value = type;
        document.getElementById('item-title').value = result.title || '';
        document.getElementById('item-author-director').value = result.authorDirector || '';
        document.getElementById('item-year').value = result.year || '';
        document.getElementById('item-genre').value = result.genre || '';
        document.getElementById('item-image').value = result.image || '';
        document.getElementById('item-notes').value = result.description || '';
        
        this.showNotification('Formulário preenchido com os dados da busca!', 'success');
    }


    setRating(value) {
        document.getElementById('item-rating').value = value;
        document.getElementById('rating-value').textContent = value;
        this.highlightStars(value);
    }

    highlightStars(value) {
        const stars = document.querySelectorAll('.rating-input .star');
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }


    openItemModal(itemId = null) {
        const modal = document.getElementById('item-modal');
        const form = document.getElementById('item-form');
        
        if (itemId) {

            document.getElementById('modal-title').textContent = 'Editar Item';
            this.currentItemId = itemId;
            const item = this.items.find(i => i.id === itemId);
            

            document.getElementById('item-type').value = item.type;
            document.getElementById('item-title').value = item.title;
            document.getElementById('item-author-director').value = item.authorDirector || '';
            document.getElementById('item-year').value = item.year || '';
            document.getElementById('item-genre').value = item.genre || '';
            this.setRating(item.rating || 0);
            document.getElementById('item-status').value = item.status || 'completed';
            document.getElementById('item-image').value = item.image || '';
            document.getElementById('item-notes').value = item.notes || '';
            document.getElementById('item-favorite').checked = item.favorite || false;
            
 
            this.switchFormTab('manual-tab');
        } else {

            document.getElementById('modal-title').textContent = 'Adicionar Item';
            this.currentItemId = null;
            form.reset();
            this.setRating(0);
            

            this.switchFormTab('search-tab');
        }
        
        modal.classList.add('active');
    }


    closeItemModal() {
        document.getElementById('item-modal').classList.remove('active');
        document.getElementById('search-results').innerHTML = '<div class="empty-state-small"><i class="fas fa-search"></i><p>Digite um título e clique em buscar</p></div>';
        this.currentSearchResults = [];
    }


    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }


    saveItem() {
  
        const isSearchTabActive = document.getElementById('search-tab').classList.contains('active');
        const manualTitle = document.getElementById('item-title').value.trim();
        
        if (isSearchTabActive && !manualTitle) {
            this.showNotification('Por favor, preencha o formulário ou use a busca automática', 'error');
            return;
        }

        const itemData = {
            type: document.getElementById('item-type').value,
            title: manualTitle,
            authorDirector: document.getElementById('item-author-director').value.trim(),
            year: document.getElementById('item-year').value ? parseInt(document.getElementById('item-year').value) : null,
            genre: document.getElementById('item-genre').value.trim(),
            rating: parseFloat(document.getElementById('item-rating').value) || null,
            status: document.getElementById('item-status').value,
            image: document.getElementById('item-image').value.trim(),
            notes: document.getElementById('item-notes').value.trim(),
            favorite: document.getElementById('item-favorite').checked,
            addedDate: new Date().toISOString()
        };


        if (!itemData.type || !itemData.title) {
            this.showNotification('Por favor, preencha pelo menos o tipo e o título', 'error');
            return;
        }

        if (this.currentItemId) {

            const index = this.items.findIndex(item => item.id === this.currentItemId);
            if (index !== -1) {

                itemData.id = this.currentItemId;
                itemData.addedDate = this.items[index].addedDate;
                this.items[index] = itemData;
                this.showNotification('Item atualizado com sucesso!', 'success');
            }
        } else {

            itemData.id = this.generateId();
            this.items.push(itemData);
            this.showNotification('Item adicionado com sucesso!', 'success');
        }

        this.saveToLocalStorage();
        this.closeItemModal();
        

        const currentPage = document.querySelector('.page.active').id;
        this.showPage(currentPage);
        

        this.updateYearFilters();
    }


    openConfirmModal(itemId) {
        this.currentItemId = itemId;
        document.getElementById('confirm-modal').classList.add('active');
    }


    closeConfirmModal() {
        document.getElementById('confirm-modal').classList.remove('active');
    }


    deleteItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveToLocalStorage();
        this.showNotification('Item excluído com sucesso!', 'success');
        

        const currentPage = document.querySelector('.page.active').id;
        this.showPage(currentPage);
    }


    toggleFavorite(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.favorite = !item.favorite;
            this.saveToLocalStorage();
            

            const currentPage = document.querySelector('.page.active').id;
            this.showPage(currentPage);
            
            this.showNotification(item.favorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!', 'success');
        }
    }


    updateYearFilters() {
        const years = [...new Set(this.items.map(item => item.year).filter(year => year))].sort((a, b) => b - a);
        
        const yearFilter = document.getElementById('year-filter');
        const rankingYear = document.getElementById('ranking-year');
        

        while (yearFilter.children.length > 1) yearFilter.removeChild(yearFilter.lastChild);
        while (rankingYear.children.length > 1) rankingYear.removeChild(rankingYear.lastChild);
        

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            
            yearFilter.appendChild(option.cloneNode(true));
            rankingYear.appendChild(option);
        });
        

        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            const currentYearOption = document.createElement('option');
            currentYearOption.value = currentYear;
            currentYearOption.textContent = currentYear;
            rankingYear.appendChild(currentYearOption);
        }
    }


    renderTypeChart() {
        const ctx = document.getElementById('type-chart');
        if (!ctx) return;
        
        const types = ['book', 'movie', 'series'];
        const typeCounts = types.map(type => 
            this.items.filter(item => item.type === type).length
        );
        

        if (this.typeChart) {
            this.typeChart.destroy();
        }
        
        this.typeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Livros', 'Filmes', 'Séries'],
                datasets: [{
                    data: typeCounts,
                    backgroundColor: ['#e50914', '#007bff', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f0f0f0',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }


    renderRatingChart() {
        const ctx = document.getElementById('rating-chart');
        if (!ctx) return;
        

        const ratingGroups = {
            '5.0': 0, '4.5': 0, '4.0': 0, '3.5': 0, '3.0': 0,
            '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0.5': 0
        };
        
        this.items.forEach(item => {
            if (item.rating) {
                const roundedRating = (Math.round(item.rating * 2) / 2).toFixed(1);
                ratingGroups[roundedRating] = (ratingGroups[roundedRating] || 0) + 1;
            }
        });
        

        if (this.ratingChart) {
            this.ratingChart.destroy();
        }
        
        this.ratingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ratingGroups).reverse(),
                datasets: [{
                    label: 'Número de Itens',
                    data: Object.values(ratingGroups).reverse(),
                    backgroundColor: '#e50914',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#f0f0f0',
                            font: { size: 10 }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: {
                            color: '#f0f0f0',
                            font: { size: 10 }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f0',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }


    showNotification(message, type = 'info') {

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        

        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '2000',
            animation: 'slideIn 0.3s ease',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        });
        

        document.body.appendChild(notification);
        

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }


    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }


    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }


    saveToLocalStorage() {
        localStorage.setItem('mediaLibrary', JSON.stringify(this.items));
    }


    getDefaultImage(type) {
        const svgTemplates = {
            book: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="%231a1d2e"/><text x="100" y="140" font-family="Arial" font-size="18" fill="%23e50914" text-anchor="middle">LIVRO</text></svg>`,
            movie: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="%231a1d2e"/><text x="100" y="140" font-family="Arial" font-size="18" fill="%23007bff" text-anchor="middle">FILME</text></svg>`,
            series: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="%231a1d2e"/><text x="100" y="140" font-family="Arial" font-size="18" fill="%2328a745" text-anchor="middle">SÉRIE</text></svg>`
        };
        return svgTemplates[type] || svgTemplates.book;
    }


    getTypeLabel(type) {
        const labels = {
            book: 'Livro',
            movie: 'Filme',
            series: 'Série'
        };
        return labels[type] || 'Desconhecido';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.library = new MediaLibrary();
});


const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);