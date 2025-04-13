using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Modelarium.Data.Migrations
{
    /// <inheritdoc />
    public partial class Model_ModelId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModelId",
                table: "Models",
                type: "TEXT",
                maxLength: 2147483647,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModelId",
                table: "Models");
        }
    }
}
