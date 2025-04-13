using Microsoft.AspNetCore.Mvc;
using Modelarium.App.Services;
using Modelarium.Data.Entities;
using static Modelarium.App.Services.MessageService;

namespace Modelarium.App.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConversationController(IConversationService conversationService, IMessageService messageService)
        : ControllerBase
    {
        private readonly IConversationService _conversationService = conversationService;
        private readonly IMessageService _messageService = messageService;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Conversation>>> GetConversations()
        {
            var conversations = await _conversationService.GetConversationsAsync();
            return Ok(conversations);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<Conversation>> GetConversation(Guid id)
        {
            var conversation = await _conversationService.GetConversationWithMessagesAsync(id);
            if (conversation == null) return NotFound();
            return Ok(conversation);
        }

        [HttpPost]
        public async Task<ActionResult<Conversation>> CreateConversation([FromBody] Conversation conversation)
        {
            var created = await _conversationService.CreateConversationAsync(conversation);
            return CreatedAtAction(nameof(GetConversation), new { id = created.Id }, created);
        }

        [HttpPost("{conversationId:guid}/messages")]
        public async Task<ActionResult<MessageDto>> AddMessage(Guid conversationId, [FromBody] Message message)
        {
            message.ConversationId = conversationId;
            message.SentAt = DateTime.UtcNow;

            var addedMessage = await _messageService.AddMessageAsync(message);

            if (message.Sender != "user") return Ok(addedMessage);

            var aiResponse = await _messageService.GenerateAiResponseAsync(conversationId, message.Content);
            return Ok(new { userMessage = addedMessage, aiResponse });
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult> DeleteConversation(Guid id)
        {
            var success = await _conversationService.DeleteConversationAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
