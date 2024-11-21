class FileRepository {
    constructor() {
        this.files = [];
        this.currentCategory = 'all';
        this.setupEventListeners();
        this.loadFiles();
    }

    setupEventListeners() {
        // File upload
        document.getElementById('file-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveCategory(btn.dataset.category);
            });
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterFiles(e.target.value);
        });

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closePreview();
        });
    }

    handleFileUpload(fileList) {
        for (let file of fileList) {
            const fileObj = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: this.formatFileSize(file.size),
                type: this.getFileType(file),
                data: null
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                fileObj.data = e.target.result;
                this.files.push(fileObj);
                this.saveFiles();
                this.displayFiles();
            };
            reader.readAsDataURL(file);
        }
    }

    getFileType(file) {
        if (file.type.startsWith('image/')) return 'images';
        if (file.type.startsWith('audio/')) return 'music';
        if (file.type.startsWith('video/')) return 'videos';
        return 'documents';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    setActiveCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        this.displayFiles();
    }

    filterFiles(searchTerm) {
        const filteredFiles = this.files.filter(file => {
            const matchesCategory = this.currentCategory === 'all' || file.type === this.currentCategory;
            const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        this.displayFiles(filteredFiles);
    }

    displayFiles(filesToShow = null) {
        const container = document.getElementById('files-container');
        container.innerHTML = '';

        const files = filesToShow || this.files.filter(file => 
            this.currentCategory === 'all' || file.type === this.currentCategory
        );

        files.forEach(file => {
            const card = this.createFileCard(file);
            container.appendChild(card);
        });
    }

    createFileCard(file) {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.onclick = () => this.previewFile(file);

        const iconClass = this.getFileIconClass(file.type);
        
        // Create the main content
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="file-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${file.size}</div>
        `;

        // Create hover preview for images and videos
        if (file.type === 'images' || file.type === 'videos') {
            const preview = document.createElement('div');
            preview.className = 'hover-preview';

            // Add loading state
            preview.classList.add('loading');

            if (file.type === 'images') {
                const img = document.createElement('img');
                img.src = file.data;
                img.onload = () => preview.classList.remove('loading');
                preview.appendChild(img);
            } else if (file.type === 'videos') {
                const video = document.createElement('video');
                video.src = file.data;
                video.muted = true; // Mute by default
                video.loop = true;
                
                // Remove loading state when video is ready
                video.onloadeddata = () => {
                    preview.classList.remove('loading');
                };

                // Play/pause on hover
                card.addEventListener('mouseenter', () => {
                    video.play().catch(e => console.log('Auto-play prevented:', e));
                });
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });

                preview.appendChild(video);
            }

            card.appendChild(preview);
        }

        card.appendChild(content);
        return card;
    }

    getFileIconClass(type) {
        const icons = {
            images: 'fas fa-image',
            music: 'fas fa-music',
            videos: 'fas fa-video',
            documents: 'fas fa-file-alt'
        };
        return icons[type] || 'fas fa-file';
    }

    previewFile(file) {
        const modal = document.getElementById('preview-modal');
        const container = modal.querySelector('.preview-container');
        container.innerHTML = '';

        let previewElement;
        if (file.type === 'images') {
            previewElement = document.createElement('img');
            previewElement.src = file.data;
        } else if (file.type === 'music') {
            previewElement = document.createElement('audio');
            previewElement.src = file.data;
            previewElement.controls = true;
        } else if (file.type === 'videos') {
            previewElement = document.createElement('video');
            previewElement.src = file.data;
            previewElement.controls = true;
            previewElement.autoplay = true; // Auto-play in full preview
        } else {
            previewElement = document.createElement('div');
            previewElement.textContent = 'Preview not available for this file type';
        }

        container.appendChild(previewElement);
        modal.style.display = 'block';
    }

    closePreview() {
        const modal = document.getElementById('preview-modal');
        modal.style.display = 'none';
        modal.querySelector('.preview-container').innerHTML = '';
    }

    saveFiles() {
        localStorage.setItem('fileRepository', JSON.stringify(this.files));
    }

    loadFiles() {
        const savedFiles = localStorage.getItem('fileRepository');
        if (savedFiles) {
            this.files = JSON.parse(savedFiles);
            this.displayFiles();
        }
    }
}

// Initialize the application
const repository = new FileRepository();
