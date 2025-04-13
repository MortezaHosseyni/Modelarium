using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Modelarium.Data.Entities;
using Modelarium.Data.Repositories;
using SystemFile = System.IO.File;

namespace Modelarium.App.Pages
{
    public class ModelsModel(IModelRepository modelRepo) : PageModel
    {
        private readonly IModelRepository _model = modelRepo;

        public List<Model>? Models { get; set; }

        public async Task OnGet()
        {
            await FetchAndSaveOllamaModels();
            var models = await _model.GetAllAsync();
            Models = models.ToList();
        }

        public async Task FetchAndSaveOllamaModels()
        {
            try
            {
                var ollamaModels = GetOllamaModels();

                foreach (var newModel in ollamaModels.Select(modelInfo => new Model
                {
                    Name = modelInfo.Name,
                    Description = $"Ollama model: {modelInfo.Name}",
                    Version = modelInfo.Name.Split(':')[1],
                    ModelId = modelInfo.ID,
                    FilePath = string.Empty,
                    SizeInBytes = ConvertSizeToBytes(modelInfo.Size),
                    IsActive = true
                }))
                {
                    var exists = await _model.AnyAsync(m => m.ModelId == newModel.ModelId);
                    if (!exists)
                        _model.Add(newModel);
                }

                Console.WriteLine($"Successfully added {ollamaModels.Count} models to the database.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching and saving Ollama models: {ex.Message}");
                throw;
            }
        }

        private List<OllamaModelInfo>? GetOllamaModels()
        {
            var result = new List<OllamaModelInfo>();

            try
            {
                var ollamaPath = FindOllamaExecutable();
                if (string.IsNullOrEmpty(ollamaPath))
                {
                    Console.WriteLine("❌ Ollama executable not found.");
                    return null;
                }

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = ollamaPath,
                    Arguments = "list",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process();
                process.StartInfo = processStartInfo;
                process.Start();

                var output = process.StandardOutput.ReadToEnd();
                var errorOutput = process.StandardError.ReadToEnd();

                process.WaitForExit();

                Console.WriteLine($"Command output: \n{output}");
                if (!string.IsNullOrEmpty(errorOutput))
                {
                    Console.WriteLine($"Command error output: \n{errorOutput}");
                }

                if (string.IsNullOrWhiteSpace(output) && process.ExitCode != 0)
                {
                    Console.WriteLine("Trying alternative approach with full path...");
                    return GetOllamaModelsAlternative();
                }

                var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                if (lines.Length <= 1)
                {
                    Console.WriteLine("No models found or unexpected output format.");
                    return result;
                }

                for (var i = 1; i < lines.Length; i++)
                {
                    var modelLine = lines[i].Trim();
                    var parts = Regex.Split(modelLine, @"\s+").Where(p => !string.IsNullOrWhiteSpace(p)).ToArray();

                    if (parts.Length >= 4)
                    {
                        result.Add(new OllamaModelInfo
                        {
                            Name = parts[0],
                            ID = parts[1],
                            Size = parts[2] + " " + parts[3]
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing Ollama list command: {ex.Message}");
                Console.WriteLine("Trying alternative approach...");
                return GetOllamaModelsAlternative();
            }

            return result;
        }

        private static string? FindOllamaExecutable()
        {
            var searchPaths = new[]
            {
                // System PATH check (try this first)
                Environment.ExpandEnvironmentVariables(@"%ProgramFiles%\Ollama\ollama.exe"),
                Environment.ExpandEnvironmentVariables(@"%LocalAppData%\Programs\Ollama\ollama.exe"),
                Environment.ExpandEnvironmentVariables(@"%UserProfile%\.ollama\bin\ollama.exe")
            };

            return searchPaths.FirstOrDefault(SystemFile.Exists);
        }

        private List<OllamaModelInfo> GetOllamaModelsAlternative()
        {
            var result = new List<OllamaModelInfo>();

            try
            {
                var tempBatchFile = Path.Combine(Path.GetTempPath(), "ollama_list.bat");
                System.IO.File.WriteAllText(tempBatchFile, "@echo off\r\nollama list");

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = tempBatchFile,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process();
                process.StartInfo = processStartInfo;
                process.Start();

                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                Console.WriteLine($"Alternative command output: \n{output}");

                var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                for (var i = 1; i < lines.Length; i++)
                {
                    var modelLine = lines[i].Trim();
                    var parts = Regex.Split(modelLine, @"\s+").Where(p => !string.IsNullOrWhiteSpace(p)).ToArray();

                    if (parts.Length >= 4)
                    {
                        result.Add(new OllamaModelInfo
                        {
                            Name = parts[0],
                            ID = parts[1],
                            Size = parts[2] + " " + parts[3]
                        });
                    }
                }

                try { System.IO.File.Delete(tempBatchFile); }
                catch
                {
                    // ignored
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in alternative approach: {ex.Message}");
            }

            return result;
        }

        private long ConvertSizeToBytes(string sizeStr)
        {
            try
            {
                var match = Regex.Match(sizeStr, @"(\d+\.?\d*)\s*(\w+)");
                if (!match.Success) return 0;

                var size = double.Parse(match.Groups[1].Value);
                var unit = match.Groups[2].Value.ToUpper();

                return unit switch
                {
                    "B" => (long)size,
                    "KB" => (long)(size * 1024),
                    "MB" => (long)(size * 1024 * 1024),
                    "GB" => (long)(size * 1024 * 1024 * 1024),
                    "TB" => (long)(size * 1024 * 1024 * 1024 * 1024),
                    _ => 0
                };
            }
            catch
            {
                return 0;
            }
        }

        private class OllamaModelInfo
        {
            public string Name { get; init; } = string.Empty;
            public string ID { get; init; } = string.Empty;
            public string Size { get; init; } = string.Empty;
        }
    }
}
