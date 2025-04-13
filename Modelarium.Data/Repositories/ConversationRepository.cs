using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.Data.Repositories
{
    public interface IConversationRepository : IGenericRepository<Conversation>
    {
    }

    public class ConversationRepository(ModelariumDbContext db)
        : GenericRepository<Conversation>(db), IConversationRepository
    {
    }
}
