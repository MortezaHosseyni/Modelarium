using System.Text.Json;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Modelarium.Data.Entities;
using Modelarium.Data.Repositories;

namespace Modelarium.App.Pages
{
    public class ModelsModel(IModelRepository modelRepo) : PageModel
    {
        private readonly IModelRepository _model = modelRepo;

        public List<Model>? Models { get; set; }

        public async Task OnGet()
        {
            await FetchAndSaveOllamaModelsAsync();
            var models = await _model.GetAllAsync();
            Models = models.ToList();
        }

        public async Task FetchAndSaveOllamaModelsAsync()
        {
            try
            {
                var ollamaModels = await GetOllamaModelsFromApiAsync();
                if (ollamaModels == null) return;

                foreach (var newModel in ollamaModels.Models.Select(info => new Model
                         {
                             Name = info.Name,
                             Description = $"Ollama model: {info.Name}",
                             Version = info.Name.Contains(":") ? info.Name.Split(':')[1] : "latest",
                             ModelId = Guid.NewGuid().ToString(),
                             FilePath = string.Empty,
                             SizeInBytes = 0,
                             IsActive = true
                         }))
                {
                    var exists = await _model.AnyAsync(m => m.Name == newModel.Name);
                    if (!exists)
                        _model.Add(newModel);
                }

                Console.WriteLine($"✅ Successfully synced {ollamaModels.Models.Count} models from Ollama API.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error syncing Ollama models: {ex.Message}");
                throw;
            }
        }

        private async Task<OllamaListResponse?> GetOllamaModelsFromApiAsync()
        {
            using var client = new HttpClient();
            client.BaseAddress = new Uri("http://localhost:11434");

            try
            {
                var response = await client.GetAsync("/api/tags");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OllamaListResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error fetching models from Ollama API: {ex.Message}");
                return null;
            }
        }

        private class OllamaListResponse
        {
            public List<OllamaModelItem> Models { get; init; } = [];
        }

        private class OllamaModelItem
        {
            public string Name { get; set; } = string.Empty;
            public string Digest { get; set; } = string.Empty;
            public DateTime ModifiedAt { get; set; }
            public long? Size { get; set; }
        }
    }
}
