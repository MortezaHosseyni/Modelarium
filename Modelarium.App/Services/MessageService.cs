using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Context;
using Modelarium.Data.Entities;
using static Modelarium.App.Services.MessageService;

namespace Modelarium.App.Services
{
    public interface IMessageService
    {
        Task<MessageDto> AddMessageAsync(Message message);
        Task<MessageDto> GenerateAiResponseAsync(Guid conversationId, string userMessage);
    }

    public class MessageService(
        ModelariumDbContext context,
        ILlmService llmService)
        : IMessageService
    {
        private readonly ModelariumDbContext _context = context;

        private readonly ILlmService _llmService = llmService;

        public async Task<MessageDto> AddMessageAsync(Message message)
        {
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                Sender = message.Sender,
                Content = message.Content,
                IsCodeBlock = message.IsCodeBlock,
                FilePath = message.FilePath,
                SentAt = message.SentAt
            };
        }

        public async Task<MessageDto> GenerateAiResponseAsync(Guid conversationId, string userMessage)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Model)
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                throw new ArgumentException("Conversation not found", nameof(conversationId));

            var model = conversation.Model;

            // Convert message history into Ollama-compatible format
            var orderedMessages = conversation.Messages?
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    role = m.Sender == "ai" ? "assistant" : "user",
                    content = m.Content
                })
                .ToList();

            // Get AI response from Ollama
            var aiResponseContent = await _llmService.GenerateResponseAsync(model.ModelId, userMessage, orderedMessages);

            // Save AI message
            var aiMessage = new Message
            {
                ConversationId = conversationId,
                Sender = "ai",
                Content = aiResponseContent,
                SentAt = DateTime.UtcNow
            };

            await _context.Messages.AddAsync(aiMessage);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = aiMessage.Id,
                Sender = aiMessage.Sender,
                Content = aiMessage.Content,
                IsCodeBlock = aiMessage.IsCodeBlock,
                FilePath = aiMessage.FilePath,
                SentAt = aiMessage.SentAt
            };
        }

        public class MessageDto
        {
            public Guid Id { get; set; }
            public string Content { get; set; } = default!;
            public string Sender { get; set; } = default!;
            public bool IsCodeBlock { get; set; }
            public string? FilePath { get; set; }
            public DateTime SentAt { get; set; }
        }
    }
}
