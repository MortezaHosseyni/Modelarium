using System.ComponentModel.DataAnnotations;

namespace Modelarium.Data.Entities
{
    public class Model : BaseEntity
    {
        [MaxLength(int.MaxValue)] public string ModelId { get; set; } = string.Empty;

        [MaxLength(int.MaxValue)] public string Name { get; set; } = string.Empty;
        [MaxLength(int.MaxValue)] public string Description { get; set; } = string.Empty;

        [MaxLength(int.MaxValue)] public string Version { get; set; } = string.Empty;

        [MaxLength(int.MaxValue)] public string Parameters { get; set; } = string.Empty;

        [MaxLength(int.MaxValue)] public string FilePath { get; set; } = string.Empty;

        public long SizeInBytes { get; set; }

        public bool IsActive { get; set; } = false;

        public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    }
}
