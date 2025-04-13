document.addEventListener('DOMContentLoaded', function () {
    // Variables
    let selectedFile = null;
    const dropArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileUpload');
    const browseBtn = document.getElementById('browseBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const removeFileBtn = document.getElementById('removeFile');
    const fileDetailsDiv = document.getElementById('fileDetails');
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');

    // Modal elements
    const confirmModal = document.getElementById('confirmModal');
    const errorModal = document.getElementById('errorModal');
    const successModal = document.getElementById('successModal');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const retryBtn = document.getElementById('retryBtn');

    // Handle drag and drop events
    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropArea.classList.add('border-primary');
    });

    dropArea.addEventListener('dragleave', function () {
        dropArea.classList.remove('border-primary');
    });

    dropArea.addEventListener('drop', function (e) {
        e.preventDefault();
        dropArea.classList.remove('border-primary');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle browse button click
    browseBtn.addEventListener('click', function () {
        fileInput.click();
    });

    // Handle file input change
    fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Handle remove file button click
    removeFileBtn.addEventListener('click', function () {
        resetFileSelection();
    });

    // Handle upload button click
    uploadBtn.addEventListener('click', function () {
        if (validateForm()) {
            showConfirmModal();
        }
    });

    // Handle confirm upload button click
    confirmUploadBtn.addEventListener('click', function () {
        hideModal(confirmModal);
        startUpload();
    });

    // Handle retry button click
    retryBtn.addEventListener('click', function () {
        hideModal(errorModal);
        startUpload();
    });

    // Add click handlers for all modal close buttons
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });

    // Function to handle file selection
    function handleFileSelection(file) {
        // Check file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (fileExt !== 'gguf' && fileExt !== 'ggml') {
            showError('Invalid file format. Only .gguf and .ggml files are supported.');
            return;
        }

        selectedFile = file;

        // Update file details UI
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        fileDetailsDiv.classList.remove('d-none');

        // Enable upload button
        uploadBtn.disabled = false;

        // Auto-fill model name from filename
        const nameSuggestion = file.name.replace(/\.(gguf|ggml)$/, '');
        document.getElementById('modelName').value = nameSuggestion;

        // Auto-select file type radio button
        if (fileExt === 'gguf') {
            document.getElementById('typeGGUF').checked = true;
        } else {
            document.getElementById('typeGGML').checked = true;
        }
    }

    // Function to reset file selection
    function resetFileSelection() {
        selectedFile = null;
        fileInput.value = '';
        fileDetailsDiv.classList.add('d-none');
        uploadBtn.disabled = true;
    }

    // Function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to validate form
    function validateForm() {
        const modelName = document.getElementById('modelName').value.trim();
        if (!modelName) {
            showError('Please enter a model name.');
            return false;
        }

        if (!selectedFile) {
            showError('Please select a model file to upload.');
            return false;
        }

        const params = document.getElementById('modelParams').value;
        if (params === 'Select parameter size') {
            showError('Please select parameter size.');
            return false;
        }

        const context = document.getElementById('modelContext').value;
        if (context === 'Select context size') {
            showError('Please select context window size.');
            return false;
        }

        return true;
    }

    // Function to show error
    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        showModal(errorModal);
    }

    // Function to show confirmation modal
    function showConfirmModal() {
        document.getElementById('confirmName').textContent = document.getElementById('modelName').value;
        document.getElementById('confirmFile').textContent = selectedFile.name;
        document.getElementById('confirmSize').textContent = formatFileSize(selectedFile.size);
        document.getElementById('confirmActivate').textContent = document.getElementById('activateAfterUpload').checked ? 'Yes' : 'No';
        showModal(confirmModal);
    }

    // Function to show modal
    function showModal(modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        // Add modal backdrop if it doesn't exist
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.classList.add('modal-backdrop', 'fade', 'show');
            document.body.appendChild(backdrop);
        }
    }

    // Function to hide modal
    function hideModal(modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        // Remove modal backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    // Function to start upload
    function startUpload() {
        // Show progress UI
        progressDiv.classList.remove('d-none');
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', 0);
        progressPercent.textContent = '0%';

        // Prepare form data
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', document.getElementById('modelName').value);
        formData.append('description', document.getElementById('modelDesc').value);
        formData.append('parameters', document.getElementById('modelParams').value);
        formData.append('contextWindow', document.getElementById('modelContext').value);
        formData.append('modelType', document.querySelector('input[name="modelType"]:checked').value);
        formData.append('activateAfterUpload', document.getElementById('activateAfterUpload').checked);

        // Simulate upload with progress updates
        let progress = 0;
        const interval = setInterval(function () {
            progress += Math.random() * 3;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);

                // Simulate API call completion
                setTimeout(function () {
                    uploadComplete();
                }, 1000);
            }

            const progressInt = Math.floor(progress);
            progressBar.style.width = progressInt + '%';
            progressBar.setAttribute('aria-valuenow', progressInt);
            progressPercent.textContent = progressInt + '%';
        }, 500);
    }

    // Function called when upload is complete
    function uploadComplete() {
        progressDiv.classList.add('d-none');

        // Show activation message if applicable
        if (document.getElementById('activateAfterUpload').checked) {
            document.getElementById('activationMessage').classList.remove('d-none');
        }

        // Show success modal
        showModal(successModal);

        // Reset form
        resetFileSelection();
        document.getElementById('modelName').value = '';
        document.getElementById('modelDesc').value = '';
        document.getElementById('modelParams').value = 'Select parameter size';
        document.getElementById('modelContext').value = 'Select context size';
        document.getElementById('typeGGUF').checked = true;
        document.getElementById('activateAfterUpload').checked = false;
    }

    // Make the entire drop area clickable
    dropArea.addEventListener('click', function (e) {
        if (e.target !== this && !e.target.classList.contains('upload-area')) return;
        fileInput.click();
    });
});