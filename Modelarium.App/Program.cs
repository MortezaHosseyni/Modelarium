using Modelarium.App.Hubs;
using Modelarium.App.Services;
using Modelarium.Data.Context;
using Modelarium.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddRazorPages()
    .AddRazorRuntimeCompilation();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

// Database
builder.Services.AddScoped<ModelariumDbContext>();

// Background Services
builder.Services.AddHostedService<SystemMonitorService>();

// Services
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddScoped<IModelRepository, ModelRepository>();

builder.Services.AddScoped<IMessageRepository, MessageRepository>();

builder.Services.AddScoped<IConversationRepository, ConversationRepository>();

builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IModelService, ModelService>();
builder.Services.AddHttpClient<ILlmService, LlmService>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();
app.MapHub<SystemMonitorHub>("/systemMonitorHub", options =>
{
    options.Transports =
        Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets |
        Microsoft.AspNetCore.Http.Connections.HttpTransportType.LongPolling;
});

app.Run();
