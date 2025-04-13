using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.Data.Repositories
{
    public interface IModelRepository : IGenericRepository<Model>
    {
    }

    public class ModelRepository(ModelariumDbContext db)
        : GenericRepository<Model>(db), IModelRepository
    {
    }
}
