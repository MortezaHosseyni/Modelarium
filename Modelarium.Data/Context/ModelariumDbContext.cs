using Microsoft.EntityFrameworkCore;
using Modelarium.Data.Entities;

namespace Modelarium.Data.Context
{
    public class ModelariumDbContext : DbContext
    {
        public DbSet<Model> Models { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var databasePath = Path.Combine(Directory.GetCurrentDirectory(), "Modelarium.db");
            optionsBuilder.UseSqlite($"Data Source={databasePath};");

            optionsBuilder.EnableSensitiveDataLogging();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Model>()
                .HasMany(m => m.Conversations)
                .WithOne(c => c.Model)
                .HasForeignKey(c => c.ModelId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Conversation>()
                .HasMany(c => c.Messages)
                .WithOne(m => m.Conversation)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
