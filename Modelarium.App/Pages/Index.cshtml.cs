using Microsoft.AspNetCore.Mvc.RazorPages;
using Modelarium.Data.Repositories;

namespace Modelarium.App.Pages
{
    public class IndexModel(IModelRepository model, IConversationRepository conversation) : PageModel
    {
        private readonly IModelRepository _model = model;
        private readonly IConversationRepository _conversation = conversation;

        public Widget? DashboardWidgets;

        public async Task OnGet()
        {
            var drive = DriveInfo.GetDrives()
                .FirstOrDefault(d => d.IsReady && d.RootDirectory.FullName == Path.GetPathRoot(Environment.CurrentDirectory));

            if (drive == null) return;

            var total = drive.TotalSize;
            var free = drive.AvailableFreeSpace;
            var used = total - free;

            var lastConversation = await _conversation.GetFirstAsync();

            DashboardWidgets = new Widget
            {
                Models = await _model.CountAsync(),
                Conversations = await _conversation.CountAsync(),
                LastConversation = lastConversation?.CreatedAt,
                UsagePercent = (int)((double)used / total * 100),
                UsedStorageFormatted = FormatBytes(used)
            };
        }

        private string FormatBytes(long bytes)
        {
            string[] sizes = ["B", "KB", "MB", "GB", "TB"];
            double len = bytes;
            var order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }

    public class Widget
    {
        public long Models { get; set; }
        public long Conversations { get; set; }
        public DateTime? LastConversation { get; set; }
        public string? UsedStorageFormatted { get; set; }
        public int UsagePercent { get; set; }
    }
}
