using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using Modelarium.App.Hubs;
using Modelarium.App.Tools;

namespace Modelarium.App.Services
{
    public class SystemMonitorService(IHubContext<SystemMonitorHub> hubContext) : BackgroundService
    {
        private readonly IHubContext<SystemMonitorHub> _hubContext = hubContext;
        private readonly PerformanceCounter _cpuCounter = new("Processor", "% Processor Time", "_Total");
        private readonly PerformanceCounter _ramCounter = new("Memory", "Available MBytes");
        private readonly long _totalMemoryBytes = SystemInfoHelper.GetTotalPhysicalMemory();

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Get CPU usage
                    _cpuCounter.NextValue(); // First call will always return 0
                    await Task.Delay(1000, stoppingToken); // Wait for a second to get a meaningful reading
                    int cpuPercentage = (int)Math.Round(_cpuCounter.NextValue());

                    // Get memory usage
                    double availableMemoryMB = _ramCounter.NextValue();
                    double totalMemoryGB = Math.Round(_totalMemoryBytes / (1024.0 * 1024 * 1024), 1);
                    double usedMemoryGB = Math.Round(((_totalMemoryBytes / (1024.0 * 1024)) - availableMemoryMB) / 1024, 1);
                    int memoryPercentage = (int)Math.Round((usedMemoryGB / totalMemoryGB) * 100);

                    // Create stats object
                    var stats = new SystemStats
                    {
                        MemoryUsedGB = usedMemoryGB,
                        TotalMemoryGB = totalMemoryGB,
                        MemoryPercentage = memoryPercentage,
                        CpuPercentage = cpuPercentage
                    };

                    // Send updates to all connected clients
                    await _hubContext.Clients.All.SendAsync("ReceiveSystemStats", stats, cancellationToken: stoppingToken);

                    // Wait before the next update
                    await Task.Delay(3000, stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    // Log the exception
                    Console.WriteLine($"Error in SystemMonitorService: {ex.Message}");
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }
    }
}
