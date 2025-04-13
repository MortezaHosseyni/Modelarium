using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.App.Services
{
    public interface IConversationService
    {
        Task<IEnumerable<ConversationDto>> GetConversationsAsync();
        Task<ConversationWithMessagesDto?> GetConversationWithMessagesAsync(Guid id);
        Task<Conversation> CreateConversationAsync(Conversation conversation);
        Task<bool> DeleteConversationAsync(Guid id);
    }

    public class ConversationService(ModelariumDbContext context) : IConversationService
    {
        private readonly ModelariumDbContext _context = context;

        public async Task<IEnumerable<ConversationDto>> GetConversationsAsync()
        {
            return await _context.Conversations
                .Include(c => c.Model)
                .Include(c => c.Messages)
                .Select(c => new ConversationDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    ModelId = c.ModelId,
                    ModelName = c.Model != null ? c.Model.Name : null,
                    LastMessageAt = c.Messages
                        .OrderByDescending(m => m.SentAt)
                        .Select(m => m.SentAt)
                        .FirstOrDefault()
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();
        }

        public async Task<ConversationWithMessagesDto?> GetConversationWithMessagesAsync(Guid id)
        {
            return await _context.Conversations
                .Where(c => c.Id == id)
                .Include(c => c.Model)
                .Include(c => c.Messages)
                .Select(c => new ConversationWithMessagesDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    ModelId = c.ModelId,
                    ModelName = c.Model != null ? c.Model.Name : null,
                    Messages = c.Messages
                        .OrderBy(m => m.SentAt)
                        .Select(m => new MessageService.MessageDto
                        {
                            Id = m.Id,
                            Content = m.Content,
                            Sender = m.Sender,
                            SentAt = m.SentAt
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();
        }


        public async Task<Conversation> CreateConversationAsync(Conversation conversation)
        {
            await _context.Conversations.AddAsync(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task<bool> DeleteConversationAsync(Guid id)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == id);
            if (conversation == null) return false;

            _context.Conversations.Remove(conversation);
            await _context.SaveChangesAsync();
            return true;
        }
    }

    public class ConversationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = default!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Guid ModelId { get; set; }
        public string? ModelName { get; set; }

        public DateTime? LastMessageAt { get; set; }
    }

    public class ConversationWithMessagesDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = default!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Guid ModelId { get; set; }
        public string? ModelName { get; set; }

        public List<MessageService.MessageDto> Messages { get; set; } = [];
    }
}
