using System.Text;
using System.Text.Json;
using Modelarium.Data.Repositories;

namespace Modelarium.App.Services
{
    public interface ILlmService
    {
        Task<string> GenerateResponseAsync(string modelId, string prompt, IEnumerable<dynamic>? history = null);
    }

    public class LlmService(IModelRepository modelRepository, HttpClient httpClient) : ILlmService
    {
        private readonly IModelRepository _model = modelRepository;
        private readonly HttpClient _httpClient = httpClient;

        public async Task<string> GenerateResponseAsync(string modelId, string prompt, IEnumerable<dynamic>? history = null)
        {
            try
            {
                var model = await _model.FindOneAsync(m => m!.ModelId == modelId);
                if (model == null)
                    return "❌ Model not found.";

                var messages = history?.ToList() ?? [];
                messages.Add(new { role = "user", content = prompt });

                var requestBody = new
                {
                    model = model.Name.ToLower(),
                    messages = messages,
                    stream = false 
                };

                var response = await _httpClient.PostAsJsonAsync("http://localhost:11434/api/chat", requestBody);
                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    return $"❌ Ollama API error: {response.StatusCode} - {error}";
                }

                var responseData = await response.Content.ReadFromJsonAsync<OllamaChatResponse>();
                return responseData?.Message?.Content?.Trim() ?? "⚠️ No response from model.";
            }
            catch (Exception ex)
            {
                return $"❗ Exception: {ex.Message}";
            }
        }

        public class OllamaChatResponse
        {
            public MessageContent? Message { get; set; }

            public class MessageContent
            {
                public string? Role { get; set; }
                public string? Content { get; set; }
            }
        }
    }
}
