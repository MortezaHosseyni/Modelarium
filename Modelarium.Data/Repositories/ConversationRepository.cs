using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.Data.Repositories
{
    public interface IConversationRepository : IGenericRepository<Conversation>
    {
        Task<Conversation?> GetFirstAsync();
    }

    public class ConversationRepository(ModelariumDbContext db)
        : GenericRepository<Conversation>(db), IConversationRepository
    {

        public async Task<Conversation?> GetFirstAsync()
        {
            return await Context.Conversations.OrderByDescending(c => c.CreatedAt).FirstOrDefaultAsync();
        }
    }
}
