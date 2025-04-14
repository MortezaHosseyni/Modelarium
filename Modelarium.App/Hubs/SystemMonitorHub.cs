using Microsoft.AspNetCore.SignalR;

namespace Modelarium.App.Hubs
{
    public class SystemMonitorHub : Hub
    {
        public async Task SendSystemStats(SystemStats stats)
        {
            await Clients.All.SendAsync("ReceiveSystemStats", stats);
        }
    }

    public class SystemStats
    {
        public double MemoryUsedGB { get; set; }
        public double TotalMemoryGB { get; set; }
        public int MemoryPercentage { get; set; }
        public int CpuPercentage { get; set; }
    }
}
