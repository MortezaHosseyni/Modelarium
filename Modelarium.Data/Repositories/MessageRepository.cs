using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.Data.Repositories
{
    public interface IMessageRepository : IGenericRepository<Message>
    {
    }

    public class MessageRepository(ModelariumDbContext db)
        : GenericRepository<Message>(db), IMessageRepository
    {
    }
}
