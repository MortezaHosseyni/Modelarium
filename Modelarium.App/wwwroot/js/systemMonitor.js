// Create connection to the SignalR hub
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/systemMonitorHub")
    .withAutomaticReconnect()
    .build();

// Function to update UI with system stats
function updateSystemStats(stats) {
    // Update memory display
    const memoryText = `${stats.memoryUsedGB.toFixed(1)} GB / ${stats.totalMemoryGB.toFixed(1)} GB`;
    document.querySelector("#memory-stats").textContent = memoryText;

    // Update memory progress bar
    const memoryProgressBar = document.querySelector("#memory-progress");
    memoryProgressBar.style.width = `${stats.memoryPercentage}%`;
    memoryProgressBar.setAttribute("aria-valuenow", stats.memoryPercentage);

    // Set color based on memory usage
    if (stats.memoryPercentage < 60) {
        memoryProgressBar.className = "progress-bar bg-success";
    } else if (stats.memoryPercentage < 80) {
        memoryProgressBar.className = "progress-bar bg-warning";
    } else {
        memoryProgressBar.className = "progress-bar bg-danger";
    }

    // Update CPU display
    document.querySelector("#cpu-stats").textContent = `${stats.cpuPercentage}%`;

    // Update CPU progress bar
    const cpuProgressBar = document.querySelector("#cpu-progress");
    cpuProgressBar.style.width = `${stats.cpuPercentage}%`;
    cpuProgressBar.setAttribute("aria-valuenow", stats.cpuPercentage);

    // Set color based on CPU usage
    if (stats.cpuPercentage < 60) {
        cpuProgressBar.className = "progress-bar bg-success";
    } else if (stats.cpuPercentage < 80) {
        cpuProgressBar.className = "progress-bar bg-warning";
    } else {
        cpuProgressBar.className = "progress-bar bg-danger";
    }
}

// Register the event handler
connection.on("ReceiveSystemStats", (stats) => {
    updateSystemStats(stats);
});

// Start the connection
async function startConnection() {
    try {
        await connection.start();
        console.log("SignalR Connected");
    } catch (err) {
        console.error("SignalR Connection Error: ", err);
        setTimeout(startConnection, 5000);
    }
}

// Initialize connection
startConnection();