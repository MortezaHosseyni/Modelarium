using System.ComponentModel.DataAnnotations;

namespace Modelarium.Data.Entities
{
    public class Message : BaseEntity
    {
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        [MaxLength(int.MaxValue)] public string Sender { get; set; } = "user"; // "user" or "ai"

        [MaxLength(int.MaxValue)] public string Content { get; set; } = string.Empty;

        [MaxLength(int.MaxValue)] public bool IsCodeBlock { get; set; } = false;

        [MaxLength(int.MaxValue)] public string? FilePath { get; set; } // optional file attachment

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
