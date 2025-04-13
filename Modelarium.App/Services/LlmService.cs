using System.Diagnostics;
using Modelarium.Data.Repositories;

namespace Modelarium.App.Services
{
    public interface ILlmService
    {
        Task<string> GenerateResponseAsync(string modelId, string prompt, IEnumerable<dynamic>? history = null);
    }

    public class LlmService(IModelRepository model) : ILlmService
    {
        private readonly IModelRepository _model = model;

        public async Task<string> GenerateResponseAsync(string modelId, string prompt, IEnumerable<dynamic>? history = null)
        {
            try
            {
                var model = await _model.FindOneAsync(m => m!.ModelId == modelId);

                var ollamaPath = FindOllamaExecutable();
                if (ollamaPath == null || model == null)
                    return "❌ Ollama executable not found. Make sure it's installed.";

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = ollamaPath,
                    Arguments = $"run {model.Name}",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process();
                process.StartInfo = processStartInfo;
                process.Start();

                await process.StandardInput.WriteLineAsync(prompt);
                process.StandardInput.Close();

                var response = await process.StandardOutput.ReadToEndAsync();

                await process.WaitForExitAsync();

                return string.IsNullOrWhiteSpace(response) ? "No response generated." : response.Trim();
            }
            catch (Exception ex)
            {
                return $"❗ Exception: {ex.Message}";
            }
        }

        private static string? FindOllamaExecutable()
        {
            var executableName = OperatingSystem.IsWindows() ? "ollama.exe" : "ollama";

            string[] searchPaths =
            [
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".ollama", "bin", executableName),
                Environment.ExpandEnvironmentVariables(@"%LocalAppData%\Programs\Ollama\" + executableName),
                Environment.ExpandEnvironmentVariables(@"%ProgramFiles%\Ollama\" + executableName),
                "/usr/local/bin/" + executableName,
                "/usr/bin/" + executableName
            ];

            return searchPaths.FirstOrDefault(File.Exists);
        }
    }
}
