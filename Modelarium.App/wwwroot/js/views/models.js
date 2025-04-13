// View toggle functionality
document.getElementById('cardView').addEventListener('click', function () {
    document.getElementById('modelCardsView').classList.remove('d-none');
    document.getElementById('modelTableView').classList.add('d-none');
    this.classList.add('active');
    document.getElementById('tableView').classList.remove('active');
});

document.getElementById('tableView').addEventListener('click', function () {
    document.getElementById('modelTableView').classList.remove('d-none');
    document.getElementById('modelCardsView').classList.add('d-none');
    this.classList.add('active');
    document.getElementById('cardView').classList.remove('active');
});

// Search functionality
document.getElementById('modelSearch').addEventListener('keyup', function () {
    const searchTerm = this.value.toLowerCase();
    const modelCards = document.querySelectorAll('.model-card');

    modelCards.forEach(card => {
        const modelName = card.querySelector('.card-title').textContent.toLowerCase();
        const modelDesc = card.querySelector('.card-text').textContent.toLowerCase();

        if (modelName.includes(searchTerm) || modelDesc.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    // Also filter table rows when in table view
    const tableRows = document.querySelectorAll('#modelTableView tbody tr');

    tableRows.forEach(row => {
        const modelNameCell = row.cells[1].textContent.toLowerCase();

        if (modelNameCell.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});