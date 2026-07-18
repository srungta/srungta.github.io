using Microsoft.Azure.Cosmos;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Config comes from appsettings.json OR environment variables.
var endpoint = builder.Configuration["Cosmos:Endpoint"]
    ?? "https://localhost:8081";
var key = builder.Configuration["Cosmos:Key"]
    ?? "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="; // well-known emulator key
var databaseName = builder.Configuration["Cosmos:Database"]
    ?? "myapp";

var cosmos = new CosmosClient(endpoint, key, new CosmosClientOptions
{
    ConnectionMode = ConnectionMode.Gateway,
    // The emulator uses a self-signed cert; trust it in dev only.
    ServerCertificateCustomValidationCallback = (_, _, _) => true,
});

var db = await cosmos.CreateDatabaseIfNotExistsAsync(databaseName);
var container = await db.Database.CreateContainerIfNotExistsAsync("notes", "/id");

var app = builder.Build();

app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/notes", async () =>
{
    var query = container.Container.GetItemQueryIterator<Note>("SELECT * FROM c");
    var results = new List<Note>();
    while (query.HasMoreResults)
        results.AddRange(await query.ReadNextAsync());
    return Results.Ok(results);
});

app.MapPost("/api/notes", async (Note note) =>
{
    if (string.IsNullOrWhiteSpace(note.Text))
        return Results.BadRequest(new { error = "Text is required." });

    note.Id = Guid.NewGuid().ToString();
    note.Text = note.Text.Trim();
    await container.Container.CreateItemAsync(note, new PartitionKey(note.Id));
    return Results.Created($"/api/notes/{note.Id}", note);
});

app.Run();

record Note
{
    [Newtonsoft.Json.JsonProperty("id")]
    public string Id { get; set; } = "";

    [Newtonsoft.Json.JsonProperty("text")]
    public string Text { get; set; } = "";
}