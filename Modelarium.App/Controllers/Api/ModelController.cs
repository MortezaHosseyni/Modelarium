using Microsoft.AspNetCore.Mvc;
using Modelarium.App.Services;
using Modelarium.Data.Entities;

namespace Modelarium.App.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelController(IModelService modelService) : ControllerBase
    {
        private readonly IModelService _modelService = modelService;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Model>>> GetModels()
        {
            var models = await _modelService.GetActiveModelsAsync();
            return Ok(models);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<Model>> GetModel(Guid id)
        {
            var model = await _modelService.GetModelByIdAsync(id);
            if (model == null) return NotFound();
            return Ok(model);
        }
    }
}
