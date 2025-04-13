using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Context;
using Modelarium.Data.Entities;

namespace Modelarium.App.Services
{
    public interface IModelService
    {
        Task<IEnumerable<Model>> GetActiveModelsAsync();
        Task<Model?> GetModelByIdAsync(Guid id);
    }

    public class ModelService(ModelariumDbContext context) : IModelService
    {
        private readonly ModelariumDbContext _context = context;

        public async Task<IEnumerable<Model>> GetActiveModelsAsync()
        {
            return await _context.Models
                .Where(m => m.IsActive)
                .ToListAsync();
        }

        public async Task<Model?> GetModelByIdAsync(Guid id)
        {
            return await _context.Models.FirstOrDefaultAsync(m => m.Id == id);
        }
    }
}
