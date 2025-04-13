using System.ComponentModel.DataAnnotations;

namespace Modelarium.Data.Entities
{
    public class Conversation : BaseEntity
    {
        [MaxLength(int.MaxValue)] public string Title { get; set; } = "New Conversation";

        public Guid ModelId { get; set; }
        public Model Model { get; set; } = null!;

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
